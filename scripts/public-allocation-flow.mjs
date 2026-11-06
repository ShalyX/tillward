// Controlled QA with the dedicated test wallet only. Never touches the Rabby owner key.
// Stages are separate so preconditions and public proof can be inspected between them.
import {readFile,writeFile,mkdir,open,rename,unlink} from 'node:fs/promises';
import {createPublicClient,createWalletClient,defineChain,http,webSocket,fallback,parseAbi,encodeFunctionData,encodeDeployData,keccak256,parseTransaction,recoverTransactionAddress,zeroAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {snapshotFreshness} from '../src/transaction-recovery.mjs';
import {readLoanRisk} from '../src/loan-risk.mjs';
import {insertionHints} from '../src/native-hints.mjs';
const stage=process.argv[2];
if(!['setup','loan','invoice','fund-keeper','pay','close','post-close','recover'].includes(stage))throw Error('Choose a V3 allocation QA stage.');
const dir='../../work/allocation-v3-private';await mkdir(dir,{recursive:true,mode:0o700});
const lockPath=dir+'/runner.lock',lock=await open(lockPath,'wx',0o600);await lock.writeFile(String(process.pid));
try{
const c=JSON.parse(await readFile('deployments/testnet-factory-v3.json','utf8'));
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const transport=fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})]);
const p=createPublicClient({chain,transport});
const signer=privateKeyToAccount(JSON.parse(await readFile('../../work/paydown-test-wallet.json','utf8')).privateKey);
const expectedOwner='0x25Db120d4c36977E57cb360f30E6C6028b8d3935',eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(c.chainId!==31611||c.accountVersion!==3||!eq(signer.address,expectedOwner)||await p.getChainId()!==31611)throw Error('Dedicated public-testnet wallet only.');
const w=createWalletClient({chain,account:signer,transport});
const accountArtifact=JSON.parse(await readFile('out/RevenueAccountV3.sol/RevenueAccountV3.json','utf8'));
const factoryAbi=parseAbi(['function createAccount() returns(address)','function accountOf(address) view returns(address)','function isAccount(address) view returns(bool)']);
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','function transfer(address,uint256) returns(bool)','function approve(address,uint256) returns(bool)']);
const nativeAbi=parseAbi(['function getBorrowingFee(uint256) view returns(uint256)','function MUSD_GAS_COMPENSATION() view returns(uint256)','function getRedemptionHints(uint256,uint256,uint256) view returns(address,uint256,uint256)','function getCurrentICR(address,uint256) view returns(uint256)','function getCollateral(address) view returns(uint256)','function getTroveStatus(address) view returns(uint256)']);
const path=dir+'/journal.json';let j={chainId:31611,factory:c.factory,owner:signer.address,steps:{}};
try{j=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(j.chainId!==31611||!eq(j.factory,c.factory)||!eq(j.owner,signer.address)||!j.steps)throw Error('Journal/config mismatch.');
const save=async()=>{const f=await open(path+'.tmp','w',0o600);try{await f.writeFile(JSON.stringify(j,(_,v)=>typeof v==='bigint'?String(v):v,2));await f.sync();}finally{await f.close();}await rename(path+'.tmp',path);};
const read=(address,abi,functionName,args=[],blockNumber)=>p.readContract({address,abi,functionName,args,blockNumber});
async function fresh(){const b=await p.getBlock({blockTag:'latest'});if(!snapshotFreshness(b.timestamp).fresh||b.number<BigInt(c.lastVerifiedBlock)||keccak256(await p.getCode({address:c.factory,blockNumber:b.number}))!==c.factoryCodeHash)throw Error('Stale chain or unexpected factory.');return b;}
async function maybeReceipt(hash){try{return await p.getTransactionReceipt({hash});}catch(e){if(e.name==='TransactionReceiptNotFoundError')return null;throw e;}}
async function step(name,address,abi,fn,args=[],value=0n){
 let saved=j.steps[name];
 if(!saved){
  await fresh();let data='0x';
  if(fn!=='fundKeeper'){const result=await p.simulateContract({address,abi,functionName:fn,args,account:signer.address,value});if(['transfer','approve'].includes(fn)&&result.result!==true)throw Error('Token simulation failed.');data=encodeFunctionData({abi,functionName:fn,args});}
  else if(value!==100000000000000n)throw Error('Exact test gas funding only.');
  const base={account:signer.address,to:address,data,value};
  const estimate=await p.estimateGas(base),minimum=fn==='createAccount'?3500000n:fn==='openLoan'?1600000n:fn==='DEPLOY'?1800000n:500000n;
  const gas=estimate*12n/10n+25000n>minimum?estimate*12n/10n+25000n:minimum,gasPrice=await p.getGasPrice();
  if(gas>8000000n||gas*gasPrice>20000000000000n||value>45000000000000000n)throw Error('QA transaction/gas bounds exceeded.');
  if(await p.getBalance({address:signer.address})<value+gas*gasPrice)throw Error('Dedicated wallet needs faucet test BTC.');
  const nonce=await p.getTransactionCount({address:signer.address,blockTag:'latest'});
  if(await p.getTransactionCount({address:signer.address,blockTag:'pending'})!==nonce)throw Error('Unreconciled dedicated-wallet nonce; no new signature.');
  const request=await w.prepareTransactionRequest({...base,nonce,gas,gasPrice,type:'legacy'});
  // The prepared request may carry an address-only account. Explicitly retain
  // the dedicated local signer; never request eth_signTransaction from the RPC.
  const raw=await w.signTransaction({...request,account:signer});saved={hash:keccak256(raw),raw,input:data,to:address??null,value:String(value),nonce,action:fn};j.steps[name]=saved;await save();
 }
 const expectedInput=fn==='fundKeeper'?'0x':encodeFunctionData({abi,functionName:fn,args});
 const tx=parseTransaction(saved.raw);
 if(keccak256(saved.raw)!==saved.hash||Number(tx.chainId)!==31611||!eq(await recoverTransactionAddress({serializedTransaction:saved.raw}),signer.address)||(tx.to??null)?.toLowerCase()!==(address??null)?.toLowerCase()||(tx.data??'0x')!==saved.input||saved.input!==expectedInput||String(tx.value??0n)!==String(value)||saved.value!==String(value)||saved.action!==fn)throw Error('Persisted QA transaction mismatch.');
 let receipt=await maybeReceipt(saved.hash);
 if(!receipt){let seen;try{seen=await p.getTransaction({hash:saved.hash});}catch(e){if(e.name!=='TransactionNotFoundError')throw e;}if(!seen)await p.sendRawTransaction({serializedTransaction:saved.raw});receipt=await p.waitForTransactionReceipt({hash:saved.hash,timeout:90000,confirmations:2});}
 if(receipt.status!=='success'||(await p.getBlock({blockNumber:receipt.blockNumber})).hash!==receipt.blockHash)throw Error(name+' not canonically successful; keep original journal.');
 saved.block=String(receipt.blockNumber);saved.contractAddress=receipt.contractAddress;await save();
 console.log(JSON.stringify({step:name,hash:saved.hash,block:saved.block,contractAddress:receipt.contractAddress??undefined}));return receipt;
}
await fresh();
const unit=10n**18n,buffer='0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5';
if(stage==='setup'){
 let account=await read(c.factory,factoryAbi,'accountOf',[signer.address]);
 if(account===zeroAddress){await step('createAccount',c.factory,factoryAbi,'createAccount');account=await read(c.factory,factoryAbi,'accountOf',[signer.address]);}
 if(!await read(c.factory,factoryAbi,'isAccount',[account])||!eq(await read(account,accountArtifact.abi,'owner'),signer.address)||await read(account,accountArtifact.abi,'accountVersion')!==3n)throw Error('Own V3 account not proven.');
 j.account=account;await save();
}
if(!j.account)throw Error('Run setup first.');
if(!eq(await read(j.account,accountArtifact.abi,'owner'),signer.address))throw Error('Business owner mismatch.');
if(stage==='loan'){
 const legacy=c.legacyDeployments.find(x=>x.accountVersion===1);
 if(!legacy||keccak256(await p.getCode({address:legacy.factory}))!==legacy.factoryCodeHash||!await read(legacy.factory,factoryAbi,'isAccount',[buffer])||!eq(await read(buffer,accountArtifact.abi,'owner'),signer.address))throw Error('Own temporary buffer source mismatch.');
 if(!j.steps.bufferWithdraw){
  const block=await fresh();j.bufferBefore={block:String(block.number),balance:String(await read(c.musd,tokenAbi,'balanceOf',[buffer],block.number))};await save();
  if(await read(buffer,accountArtifact.abi,'availableToWithdraw',[],block.number)<600n*unit)throw Error('Temporary buffer unavailable.');
 }
 await step('bufferWithdraw',buffer,accountArtifact.abi,'withdraw',[600n*unit]);
 if(!j.loanPlan){
  const block=await fresh(),risk=await readLoanRisk(p,c,j.account,block.number),borrow=2000n*unit,collateral=45000000000000000n;
  const fee=await read(c.borrowerOperations,nativeAbi,'getBorrowingFee',[borrow],block.number),reserve=await read(c.borrowerOperations,nativeAbi,'MUSD_GAS_COMPENSATION',[],block.number);
  if(risk.recoveryMode||fee>10n*unit||collateral*risk.price/(borrow+fee+reserve)<1500000000000000000n)throw Error('QA loan conditions outside bounds.');
  const hints=await insertionHints(p,c,j.account,'open',borrow,collateral);j.loanPlan={borrow:String(borrow),collateral:String(collateral),hints,fee:String(fee)};await save();
 }
 await step('loanOpen',j.account,accountArtifact.abi,'openLoan',[BigInt(j.loanPlan.borrow),...j.loanPlan.hints],BigInt(j.loanPlan.collateral));
 await step('loanWithdraw',j.account,accountArtifact.abi,'withdraw',[2000n*unit]);
 await step('policy80',j.account,accountArtifact.abi,'setPolicy',[8000,0n,false]);
 await step('enableService',j.account,accountArtifact.abi,'setServiceEnabled',[true]);
}
if(stage==='invoice'||stage==='post-close'){
 const post=stage==='post-close',key=post?'postCloseInvoice':'invoice';
 if(post&&(await read(j.account,accountArtifact.abi,'debtState'))[4])throw Error('Loan must be closed.');
 if(!j[key]){const block=await fresh();j[key]={id:keccak256(new TextEncoder().encode(post?'Wave2 V3 receipt after closure QA':'Wave2 V3 oversized 80% QA')),amount:String((post?1n:2600n)*unit),expiry:String(block.timestamp+86400n)};await save();}
 const invoice=j[key];
 await step(post?'postCloseInvoiceCreate':'invoiceCreate',j.account,accountArtifact.abi,'createInvoice',[invoice.id,post?'Wave 2 V3 receipt after closure QA':'Wave 2 V3 oversized 80% QA',BigInt(invoice.amount),BigInt(invoice.expiry)]);
 if(post){
  await step('postCloseApprove',c.musd,tokenAbi,'approve',[j.account,unit]);
  await step('postClosePay',j.account,accountArtifact.abi,'payInvoice',[invoice.id]);
  if(await read(j.account,accountArtifact.abi,'pendingRepayment')!==0n||await read(j.account,accountArtifact.abi,'feeReserve')!==0n)throw Error('Post-close receipt trapped.');
 }
}
if(stage==='fund-keeper'){
 const k=JSON.parse(await readFile('deployments/keeper-v3-enrollment.json','utf8'));
 if(k.chainId!==31611||!eq(k.factory,c.factory)||!/^0x[0-9a-fA-F]{40}$/.test(k.signer))throw Error('V3 gas signer metadata mismatch.');
 await step('keeperGasFund',k.signer,undefined,'fundKeeper',[],100000000000000n);
}
if(stage==='pay'){
 if(!j.invoice||await read(j.account,accountArtifact.abi,'repaymentBps')!==8000||!await read(j.account,accountArtifact.abi,'serviceEnabled'))throw Error('Verified 80% consent required.');
 await step('invoiceApprove',c.musd,tokenAbi,'approve',[j.account,2600n*unit]);
 await step('invoicePay',j.account,accountArtifact.abi,'payInvoice',[j.invoice.id]);
}
if(stage==='close'){
 if(!j.steps.invoicePay||await read(j.account,accountArtifact.abi,'totalServiceRepaid')===0n)throw Error('Hosted repayment proof required before closure.');
 await step('loanClose',j.account,accountArtifact.abi,'closeLoan');
 const state=await read(j.account,accountArtifact.abi,'debtState');
 if(state[4]||state[0]!==0n||await read(j.account,accountArtifact.abi,'pendingRepayment')!==0n||await read(j.account,accountArtifact.abi,'feeReserve')!==0n)throw Error('Close left debt or reservations.');
}
if(stage==='recover'){
 if(!j.steps.loanClose||!j.steps.postClosePay)throw Error('Closure and post-close receipt required.');
 if(!j.recoveryAmount){j.recoveryAmount=String(await read(j.account,accountArtifact.abi,'availableToWithdraw'));await save();}
 await step('cashRecover',j.account,accountArtifact.abi,'withdraw',[BigInt(j.recoveryAmount)]);
 await step('bufferRestore',c.musd,tokenAbi,'transfer',[buffer,600n*unit]);
 await step('btcRecover',j.account,accountArtifact.abi,'withdrawBTC',[45000000000000000n]);
 if(await p.getBalance({address:j.account})!==0n||await read(c.musd,tokenAbi,'balanceOf',[j.account])!==0n)throw Error('Business balances not fully recovered.');
}
const progress={chainId:31611,factory:c.factory,owner:signer.address,account:j.account,treasury:c.feeTreasury,buffer,bufferBefore:j.bufferBefore,loanPlan:j.loanPlan,invoice:j.invoice,postCloseInvoice:j.postCloseInvoice,recoveryAmount:j.recoveryAmount,transactions:Object.fromEntries(Object.entries(j.steps).map(([name,s])=>[name,{hash:s.hash,block:s.block,action:s.action,value:s.value}]))};
await writeFile('deployments/wave2-v3-flow.json',JSON.stringify(progress,null,2)+'\n');
}finally{await lock.close();await unlink(lockPath);}
process.exit(0);
