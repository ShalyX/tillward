// TESTNET only. Dedicated gas wallet; service uses flock to prevent concurrent signers.
import {readFile,open,rename,statfs} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createPublicClient,createWalletClient,defineChain,http,webSocket,fallback,keccak256,encodeFunctionData,isAddress,parseTransaction,decodeFunctionData,recoverTransactionAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {readWithRetry} from '../src/read-retry.mjs';
import {insertionHints} from '../src/native-hints.mjs';
import {discoverAccounts,accountBatch,operationalIssues} from './keeper-registry.mjs';

export function settlementPlan(quote,maximum=1000n*10n**18n){
 if(typeof quote!=='bigint'||typeof maximum!=='bigint'||quote<0n||maximum<=0n)throw new Error('Invalid settlement bounds.');
 return {amount:quote<maximum?quote:maximum,eligible:quote>0n};
}
export function gasBudget(used,gas,price,transactionCap=20000000000000n,dailyCap=100000000000000n){
 if([used,gas,price].some(v=>typeof v!=='bigint'||v<0n)||gas===0n||price===0n)throw new Error('Invalid gas budget.');
 const reserve=gas*price;if(reserve>transactionCap||used+reserve>dailyCap)throw new Error('Gas budget exceeded; no transaction signed.');
 return used+reserve;
}
// Sponsorship is a service policy; permissionless on-chain settlement stays open.
export function sponsorshipPlan(quote,used=0n,{minimum=10n**18n,accountCap=25000000000000n,reserve=0n}={}){
 if([quote,used,minimum,accountCap,reserve].some(v=>typeof v!=='bigint'||v<0n)||minimum===0n||accountCap===0n)throw Error('Invalid sponsorship budget.');
 return {eligible:quote>=minimum&&used+reserve<=accountCap,reason:quote<minimum?'batching-below-1-MUSD':'account-daily-gas-cap'};
}
export async function validatePending(pending,signer,abi){
 if(!pending)return;
 if(pending.chainId!==31611||!isAddress(pending.account||'')||!/^0x[0-9a-fA-F]+$/.test(pending.raw||'')||keccak256(pending.raw)!==pending.hash)throw Error('Invalid pending journal.');
 const tx=parseTransaction(pending.raw),call=decodeFunctionData({abi,data:tx.data});
 if(Number(tx.chainId)!==31611||tx.to?.toLowerCase()!==pending.account.toLowerCase()||(tx.value??0n)!==0n||
  (await recoverTransactionAddress({serializedTransaction:pending.raw})).toLowerCase()!==signer.toLowerCase()||call.functionName!=='settle'||call.args[0]<=0n||call.args[0]>1000n*10n**18n)throw Error('Pending journal transaction mismatch.');
 gasBudget(0n,tx.gas,tx.gasPrice);
}
async function atomicJson(path,value){const temporary=path+'.tmp',file=await open(temporary,'w',0o600);try{await file.writeFile(JSON.stringify(value,null,2));await file.sync();}finally{await file.close();}await rename(temporary,path);}
async function main(){
 const walletPath=process.argv[2],target=process.argv[3],watch=process.argv.includes('--watch'),all=target==='--all';
 if(!walletPath||(!all&&!isAddress(target||'')))throw new Error('Usage: node scripts/keeper.mjs <dedicated-test-wallet.json> <--all|registered-account> [--watch]');
 const c=JSON.parse(await readFile('public/deployment.json','utf8'));if(c.chainId!==31611)throw new Error('Testnet only.');
 const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
 const transport=c.ws?fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})]):http(c.rpc,{timeout:15000,retryCount:1});
 const p=createPublicClient({chain,transport});
 const signer=privateKeyToAccount(JSON.parse(await readFile(resolve(walletPath),'utf8')).privateKey);
 const w=createWalletClient({chain,account:signer,transport});
 const factory=JSON.parse(await readFile('out/RevenueFactory.sol/RevenueFactory.json','utf8'));
 const artifact=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8'));
 const stateDir=process.env.KEEPER_STATE_DIR||dirname(resolve(walletPath));
 const journalPath=resolve(stateDir,'paydown-keeper-journal.json'),healthPath=resolve(stateDir,'keeper-health.json');
 let journal={},missingJournal=false;try{journal=JSON.parse(await readFile(journalPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw new Error('Keeper journal is unreadable. Restore it before signing.');missingJournal=true;}
 if(!journal||Array.isArray(journal)||typeof journal!=='object'||(journal.accounts!==undefined&&(!journal.accounts||Array.isArray(journal.accounts)||typeof journal.accounts!=='object'))||
  (journal.cursor!==undefined&&(!Number.isSafeInteger(journal.cursor)||journal.cursor<0)))throw Error('Invalid keeper journal.');
 if(!all&&journal.target&&journal.target.toLowerCase()!==target.toLowerCase())throw new Error('Keeper state belongs to another account.');
 if(!all)journal.target=target;
 if(journal.accountGas!==undefined&&(!journal.accountGas||Array.isArray(journal.accountGas)||typeof journal.accountGas!=='object'||Object.entries(journal.accountGas).some(([a,v])=>!isAddress(a)||typeof v!=='string'||!/^\d+$/.test(v))))throw Error('Invalid per-account sponsorship journal.');
 if(journal.gasReserved!==undefined&&!/^\d+$/.test(journal.gasReserved))throw Error('Invalid journal gas reservation.');
 await validatePending(journal.pending,signer.address,artifact.abi);
 const registryPath=resolve(stateDir,'keeper-registry.json');let registry={chainId:31611,factory:c.factory,nextBlock:String(c.deploymentBlock),accounts:[]};
 let existingRegistry=false;try{registry=JSON.parse(await readFile(registryPath,'utf8'));existingRegistry=true;}catch(e){if(e.code!=='ENOENT')throw Error('Registry unreadable; restore before signing.');}
 if(existingRegistry&&missingJournal)throw Error('Journal missing from an initialized keeper; restore and reconcile before signing.');
 if(registry.chainId!==31611||registry.factory.toLowerCase()!==c.factory.toLowerCase()||!Array.isArray(registry.accounts)||registry.accounts.some(a=>!isAddress(a))||!/^\d+$/.test(registry.nextBlock)||BigInt(registry.nextBlock)<BigInt(c.deploymentBlock))throw Error('Registry configuration mismatch.');
 let latest={enrolled:registry.accounts.length,accounts:journal.accounts??{},last:journal.last??null};
 async function report(state,extra={}){const health={state,checkedAt:new Date().toISOString(),chainId:31611,mode:all?'factory':'single',wallet:signer.address,...latest,...extra};await atomicJson(healthPath,health);console.log(JSON.stringify(health));}
 async function verifyAccount(account,head){
  if(head<BigInt(c.lastVerifiedBlock||c.deploymentBlock)||Math.abs(Date.now()/1000-Number((await p.getBlock({blockNumber:head})).timestamp))>180)throw Error('Account RPC snapshot is stale.');
  if(!await readWithRetry(()=>p.readContract({address:c.factory,abi:factory.abi,functionName:'isAccount',args:[account],blockNumber:head})))throw new Error('Unregistered account.');
  const owner=await p.readContract({address:account,abi:artifact.abi,functionName:'owner',blockNumber:head});if(owner.toLowerCase()===signer.address.toLowerCase())throw new Error('Use a separate gas-only keeper wallet.');
 }
 async function settleAccount(target,head){
  await verifyAccount(target,head);
  if(!journal.pending){
   const [quote,reason]=await readWithRetry(()=>p.readContract({address:target,abi:artifact.abi,functionName:'repaymentQuote',blockNumber:head}));
   const plan=settlementPlan(quote);
   if(!plan.eligible)return {state:'deferred',reason,block:Number(head),checkedAt:new Date().toISOString()};
   const today=new Date().toISOString().slice(0,10);
   const accountUsed=journal.day===today?BigInt(journal.accountGas?.[target.toLowerCase()]||'0'):0n;
   const sponsorship=sponsorshipPlan(plan.amount,accountUsed);
   if(!sponsorship.eligible)return {state:'deferred',reason:sponsorship.reason,block:Number(head),checkedAt:new Date().toISOString()};
   const args=[plan.amount,...await insertionHints(p,{...c,lastVerifiedBlock:Number(head)},target,'repay',plan.amount)];
   await p.simulateContract({account:signer,address:target,abi:artifact.abi,functionName:'settle',args});
   const price=await p.getGasPrice(),gas=800000n;
   const day=new Date().toISOString().slice(0,10),used=journal.day===day?BigInt(journal.gasReserved||'0'):0n;
   const reserved=gasBudget(used,gas,price);
   if(!sponsorshipPlan(plan.amount,accountUsed,{reserve:gas*price}).eligible)return {state:'deferred',reason:'account-daily-gas-cap',checkedAt:new Date().toISOString()};
   const balance=await p.getBalance({address:signer.address});if(balance<gas*price)throw new Error('Keeper wallet needs test BTC gas.');
   const request=await w.prepareTransactionRequest({account:signer,to:target,data:encodeFunctionData({abi:artifact.abi,functionName:'settle',args}),gas,gasPrice:price,type:'legacy'});
   const raw=await w.signTransaction(request);journal.pending={chainId:31611,account:target,hash:keccak256(raw),raw};if(journal.day!==day)journal.accountGas={};journal.accountGas??={};journal.accountGas[target.toLowerCase()]=(accountUsed+gas*price).toString();journal.day=day;journal.gasReserved=reserved.toString();
   // One global signer journal and gas budget across every account. Persist before broadcast.
   await atomicJson(journalPath,journal);
  }
  if(journal.pending.account.toLowerCase()!==target.toLowerCase())throw new Error('Pending transaction target mismatch.');
  const tx=journal.pending;let receipt;try{receipt=await p.getTransactionReceipt({hash:tx.hash});}catch{}
  if(!receipt){let seen;try{seen=await p.getTransaction({hash:tx.hash});}catch{}
   if(!seen)await p.sendRawTransaction({serializedTransaction:tx.raw});
   await report('pending',{pending:{account:target,hash:tx.hash}});receipt=await p.waitForTransactionReceipt({hash:tx.hash,timeout:90000,confirmations:2});
  }
  // Never sign the next nonce until the prior receipt is confirmed on a fresh head.
  const fresh=await p.getBlockNumber({cacheTime:0});if(fresh<receipt.blockNumber+1n)throw Error('Waiting for receipt confirmations.');
  if((await p.getBlock({blockNumber:receipt.blockNumber})).hash!==receipt.blockHash)throw Error('Receipt block reorganized; pending journal retained.');
  journal.last={account:target,hash:tx.hash,status:receipt.status,block:Number(receipt.blockNumber)};journal.pending=null;
  await atomicJson(journalPath,journal);
  if(receipt.status!=='success')throw new Error('Keeper transaction reverted; allocation remains onchain.');
  return {state:'confirmed',...journal.last,checkedAt:new Date().toISOString()};
 }
 async function once(){
  if(await p.getChainId()!==31611)throw new Error('Chain mismatch.');
  const head=await p.getBlockNumber({cacheTime:0});if(head<BigInt(c.lastVerifiedBlock||c.deploymentBlock))throw new Error('RPC head is behind confirmed evidence.');
  const block=await p.getBlock({blockNumber:head});if(Math.abs(Date.now()/1000-Number(block.timestamp))>180)throw new Error('RPC block is stale; waiting for synchronization.');
  const code=await p.getCode({address:c.factory,blockNumber:head});if(!code||keccak256(code)!==c.factoryCodeHash)throw new Error('Factory code mismatch.');
  const disk=await statfs(stateDir,{bigint:true}),freeBytes=disk.bavail*disk.bsize,balance=await p.getBalance({address:signer.address});
  latest={...latest,block:Number(head),freeBytes:String(freeBytes),balance:String(balance)};
  if(freeBytes<134217728n)throw Error('Disk below 128 MiB; signing stopped. Free space before restarting.');
  journal.accounts??={};
  // Recover the global pending nonce first, even if discovery has not caught up yet.
  if(journal.pending){const address=journal.pending.account;journal.accounts[address]=await settleAccount(address,head);await atomicJson(journalPath,journal);latest.accounts=journal.accounts;latest.last=journal.last;await report('recovered',{pending:null});return;}
  if(all){
   const safeHead=head-6n;
   if(registry.anchor&&await p.getBlock({blockNumber:BigInt(registry.anchor.block)}).then(b=>b.hash)!==registry.anchor.hash)throw Error('Discovery checkpoint reorganized. Operator must rescan registry.');
   const discovery=await discoverAccounts({registry,head:safeHead,start:BigInt(c.deploymentBlock),
    fetchLogs:(fromBlock,toBlock)=>p.getContractEvents({address:c.factory,abi:factory.abi,eventName:'AccountCreated',fromBlock,toBlock,strict:true}),
    validate:async(address,owner)=>await p.readContract({address:c.factory,abi:factory.abi,functionName:'isAccount',args:[address],blockNumber:safeHead})&&
     (await p.readContract({address:c.factory,abi:factory.abi,functionName:'accountOf',args:[owner],blockNumber:safeHead})).toLowerCase()===address.toLowerCase(),
    save:async(next)=>{const blockNumber=BigInt(next.nextBlock)-1n;next.anchor={block:Number(blockNumber),hash:(await p.getBlock({blockNumber})).hash};await atomicJson(registryPath,next);}});
   latest.enrolled=registry.accounts.length;latest.discovery={nextBlock:registry.nextBlock,safeHead:Number(safeHead),synced:discovery.synced};
   if(!discovery.synced){await report('discovering');return;}
  }
  const batch=accountBatch(all?registry.accounts:[target],journal.cursor||0);let failed=0;
  for(const address of batch.accounts){
   const previous=journal.accounts[address];
   if(previous?.retryAfter>Date.now())continue;
   try{journal.accounts[address]=await settleAccount(address,await p.getBlockNumber({cacheTime:0}));}
   catch(e){failed++;const count=(previous?.failures||0)+1;journal.accounts[address]={state:'degraded',message:String(e.shortMessage||e.message).slice(0,240),failures:count,checkedAt:new Date().toISOString(),retryAfter:Date.now()+Math.min(900000,60000*2**Math.min(count,4))};}
   await atomicJson(journalPath,journal);
   if(journal.pending)break; // A pending nonce blocks all further signing, regardless of account.
  }
  journal.cursor=batch.next;await atomicJson(journalPath,journal);
  const failures=Object.values(journal.accounts).filter(a=>a.state==='degraded').length;
  const issues=operationalIssues({checkedAt:new Date().toISOString(),balance,freeBytes,failures});
  latest={...latest,accounts:journal.accounts,last:journal.last??null};
  await report(issues.length?'degraded':'healthy',{issues,processed:batch.accounts.length,failed,pending:journal.pending?{account:journal.pending.account,hash:journal.pending.hash}:null});
 }
 let failures=0;
 do{try{await once();failures=0;}catch(e){failures++;await report('degraded',{message:String(e.shortMessage||e.message).slice(0,240),consecutiveFailures:failures});if(!watch)process.exitCode=1;}
  if(!watch)break;await new Promise(r=>setTimeout(r,Math.min(900000,60000*2**Math.min(failures,4))));
 }while(true);
 process.exit(process.exitCode||0);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
