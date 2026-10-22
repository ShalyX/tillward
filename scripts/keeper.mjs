// TESTNET only. Dedicated gas wallet; service uses flock to prevent concurrent signers.
import {readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createPublicClient,createWalletClient,defineChain,http,webSocket,fallback,keccak256,encodeFunctionData,isAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {readWithRetry} from '../src/read-retry.mjs';
import {insertionHints} from '../src/native-hints.mjs';

export function settlementPlan(quote,maximum=1000n*10n**18n){
 if(typeof quote!=='bigint'||typeof maximum!=='bigint'||quote<0n||maximum<=0n)throw new Error('Invalid settlement bounds.');
 return {amount:quote<maximum?quote:maximum,eligible:quote>0n};
}
export function gasBudget(used,gas,price,transactionCap=20000000000000n,dailyCap=100000000000000n){
 if([used,gas,price].some(v=>typeof v!=='bigint'||v<0n)||gas===0n||price===0n)throw new Error('Invalid gas budget.');
 const reserve=gas*price;if(reserve>transactionCap||used+reserve>dailyCap)throw new Error('Gas budget exceeded; no transaction signed.');
 return used+reserve;
}
async function atomicJson(path,value){const temporary=path+'.tmp';await writeFile(temporary,JSON.stringify(value,null,2),{mode:0o600});await rename(temporary,path);}
async function main(){
 const walletPath=process.argv[2],target=process.argv[3],watch=process.argv.includes('--watch');
 if(!walletPath||!isAddress(target||''))throw new Error('Usage: node scripts/keeper.mjs <dedicated-test-wallet.json> <registered-account> [--watch]');
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
 let journal={};try{journal=JSON.parse(await readFile(journalPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw new Error('Keeper journal is unreadable. Restore it before signing.');}
 if(journal.target&&journal.target.toLowerCase()!==target.toLowerCase())throw new Error('Keeper state belongs to another account.');
 journal.target=target;
 async function report(state,extra={}){const health={state,checkedAt:new Date().toISOString(),chainId:31611,account:target,wallet:signer.address,...extra};await atomicJson(healthPath,health);console.log(JSON.stringify(health));}
 async function once(){
  if(await p.getChainId()!==31611)throw new Error('Chain mismatch.');
  const head=await p.getBlockNumber({cacheTime:0});if(head<BigInt(c.lastVerifiedBlock||c.deploymentBlock))throw new Error('RPC head is behind confirmed evidence.');
  const block=await p.getBlock({blockNumber:head});if(Math.abs(Date.now()/1000-Number(block.timestamp))>180)throw new Error('RPC block is stale; waiting for synchronization.');
  const code=await p.getCode({address:c.factory,blockNumber:head});if(!code||keccak256(code)!==c.factoryCodeHash)throw new Error('Factory code mismatch.');
  if(!await readWithRetry(()=>p.readContract({address:c.factory,abi:factory.abi,functionName:'isAccount',args:[target],blockNumber:head})))throw new Error('Unregistered account.');
  const owner=await p.readContract({address:target,abi:artifact.abi,functionName:'owner',blockNumber:head});if(owner.toLowerCase()===signer.address.toLowerCase())throw new Error('Use a separate gas-only keeper wallet.');
  if(!journal.pending){
   const [quote,reason]=await readWithRetry(()=>p.readContract({address:target,abi:artifact.abi,functionName:'repaymentQuote',blockNumber:head}));
   const plan=settlementPlan(quote);if(!plan.eligible){await report('deferred',{reason,block:Number(head),last:journal.last??null});return;}
   const args=[plan.amount,...await insertionHints(p,{...c,lastVerifiedBlock:Number(head)},target,'repay',plan.amount)];
   await p.simulateContract({account:signer,address:target,abi:artifact.abi,functionName:'settle',args});
   const price=await p.getGasPrice(),gas=800000n;
   const day=new Date().toISOString().slice(0,10),used=journal.day===day?BigInt(journal.gasReserved||'0'):0n;
   const reserved=gasBudget(used,gas,price);
   const balance=await p.getBalance({address:signer.address});if(balance<gas*price)throw new Error('Keeper wallet needs test BTC gas.');
   const request=await w.prepareTransactionRequest({account:signer,to:target,data:encodeFunctionData({abi:artifact.abi,functionName:'settle',args}),gas,gasPrice:price,type:'legacy'});
   const raw=await w.signTransaction(request);journal.pending={chainId:31611,account:target,hash:keccak256(raw),raw};journal.day=day;journal.gasReserved=reserved.toString();
   // Journal exact signed bytes before broadcast; retries never create a replacement.
   await atomicJson(journalPath,journal);
  }
  if(journal.pending.chainId!==31611||journal.pending.account.toLowerCase()!==target.toLowerCase())throw new Error('Pending transaction target mismatch.');
  const tx=journal.pending;let receipt;try{receipt=await p.getTransactionReceipt({hash:tx.hash});}catch{}
  if(!receipt){let seen;try{seen=await p.getTransaction({hash:tx.hash});}catch{}
   if(!seen)await p.sendRawTransaction({serializedTransaction:tx.raw});
   await report('pending',{hash:tx.hash});receipt=await p.waitForTransactionReceipt({hash:tx.hash,timeout:90000});
  }
  journal.last={hash:tx.hash,status:receipt.status,block:Number(receipt.blockNumber)};journal.pending=null;
  await atomicJson(journalPath,journal);
  if(receipt.status!=='success')throw new Error('Keeper transaction reverted; allocation remains onchain.');
  await report('confirmed',{...journal.last});
 }
 let failures=0;
 do{try{await once();failures=0;}catch(e){failures++;await report('degraded',{message:String(e.shortMessage||e.message).slice(0,240),consecutiveFailures:failures});if(!watch)process.exitCode=1;}
  if(!watch)break;await new Promise(r=>setTimeout(r,Math.min(900000,60000*2**Math.min(failures,4))));
 }while(true);
 process.exit(process.exitCode||0);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
