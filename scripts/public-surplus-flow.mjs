// Controlled QA with the dedicated test wallet only. Never touches the Rabby owner key.
// Stages are separate so preconditions and public proof can be inspected between them.
import {readFile,writeFile,mkdir,open,rename,unlink} from 'node:fs/promises';
import {createPublicClient,createWalletClient,defineChain,http,webSocket,fallback,parseAbi,encodeFunctionData,encodeDeployData,keccak256,parseTransaction,recoverTransactionAddress,zeroAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {snapshotFreshness} from '../src/transaction-recovery.mjs';
import {readLoanRisk} from '../src/loan-risk.mjs';
import {insertionHints} from '../src/native-hints.mjs';
const stage=process.argv[2];
if(!['setup','loan','redeem','claim','recover'].includes(stage))throw Error('Choose setup, loan, redeem, claim or recover.');
const dir='../../work/surplus-v2-private';await mkdir(dir,{recursive:true,mode:0o700});
const lockPath=dir+'/runner.lock',lock=await open(lockPath,'wx',0o600);await lock.writeFile(String(process.pid));
try{
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const transport=fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})]);
const p=createPublicClient({chain,transport});
const signer=privateKeyToAccount(JSON.parse(await readFile('../../work/paydown-test-wallet.json','utf8')).privateKey);
const expectedOwner='0x25Db120d4c36977E57cb360f30E6C6028b8d3935',eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(c.chainId!==31611||c.accountVersion!==2||!eq(signer.address,expectedOwner)||await p.getChainId()!==31611)throw Error('Dedicated public-testnet wallet only.');
const w=createWalletClient({chain,account:signer,transport});
const accountArtifact=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8'));
const guardArtifact=JSON.parse(await readFile('out/OwnedSurplusGuard.sol/OwnedSurplusGuard.json','utf8'));
const factoryAbi=parseAbi(['function createAccount() returns(address)','function accountOf(address) view returns(address)','function isAccount(address) view returns(bool)']);
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','function transfer(address,uint256) returns(bool)']);
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
  await fresh();let data;
  if(fn==='DEPLOY')data=encodeDeployData({abi,bytecode:guardArtifact.bytecode.object,args});
  else{const result=await p.simulateContract({address,abi,functionName:fn,args,account:signer.address,value});if(fn==='transfer'&&result.result!==true)throw Error('Token transfer simulation failed.');data=encodeFunctionData({abi,functionName:fn,args});}
  const base={account:signer.address,to:address,data,value};
  const estimate=await p.estimateGas(base),minimum=fn==='createAccount'?3500000n:fn==='openLoan'?1600000n:fn==='DEPLOY'?1800000n:500000n;
  const gas=estimate*12n/10n+25000n>minimum?estimate*12n/10n+25000n:minimum,gasPrice=await p.getGasPrice();
  if(gas>8000000n||gas*gasPrice>20000000000000n||value>40000000000000000n)throw Error('QA transaction/gas bounds exceeded.');
  if(await p.getBalance({address:signer.address})<value+gas*gasPrice)throw Error('Dedicated wallet needs faucet test BTC.');
  const nonce=await p.getTransactionCount({address:signer.address,blockTag:'latest'});
  if(await p.getTransactionCount({address:signer.address,blockTag:'pending'})!==nonce)throw Error('Unreconciled dedicated-wallet nonce; no new signature.');
  const request=await w.prepareTransactionRequest({...base,nonce,gas,gasPrice,type:'legacy'});
  // The prepared request may carry an address-only account. Explicitly retain
  // the dedicated local signer; never request eth_signTransaction from the RPC.
  const raw=await w.signTransaction({...request,account:signer});saved={hash:keccak256(raw),raw,input:data,to:address??null,value:String(value),nonce,action:fn};j.steps[name]=saved;await save();
 }
 const tx=parseTransaction(saved.raw);
 if(keccak256(saved.raw)!==saved.hash||Number(tx.chainId)!==31611||!eq(await recoverTransactionAddress({serializedTransaction:saved.raw}),signer.address)||(tx.to??null)?.toLowerCase()!==(address??null)?.toLowerCase()||tx.data!==saved.input||String(tx.value??0n)!==saved.value||saved.action!==fn)throw Error('Persisted QA transaction mismatch.');
 let receipt=await maybeReceipt(saved.hash);
 if(!receipt){let seen;try{seen=await p.getTransaction({hash:saved.hash});}catch(e){if(e.name!=='TransactionNotFoundError')throw e;}if(!seen)await p.sendRawTransaction({serializedTransaction:saved.raw});receipt=await p.waitForTransactionReceipt({hash:saved.hash,timeout:90000,confirmations:2});}
 if(receipt.status!=='success'||(await p.getBlock({blockNumber:receipt.blockNumber})).hash!==receipt.blockHash)throw Error(name+' not canonically successful; keep original journal.');
 saved.block=String(receipt.blockNumber);saved.contractAddress=receipt.contractAddress;await save();
 console.log(JSON.stringify({step:name,hash:saved.hash,block:saved.block,contractAddress:receipt.contractAddress??undefined}));return receipt;
}
await fresh();
if(stage==='setup'){
 let account=await read(c.factory,factoryAbi,'accountOf',[signer.address]);
 if(account===zeroAddress){await step('createAccount',c.factory,factoryAbi,'createAccount');account=await read(c.factory,factoryAbi,'accountOf',[signer.address]);}
 if(!await read(c.factory,factoryAbi,'isAccount',[account])||!eq(await read(account,accountArtifact.abi,'owner'),signer.address))throw Error('Own V2 account not proven.');
 j.account=account;await save();
 const deployment=await step('guardDeploy',undefined,guardArtifact.abi,'DEPLOY',[c.factory,account]);j.guard=deployment.contractAddress;await save();
 if(!eq(await read(j.guard,guardArtifact.abi,'owner'),signer.address)||!eq(await read(j.guard,guardArtifact.abi,'business'),account))throw Error('Guard binding mismatch.');
 const legacy=c.legacyDeployments.find(x=>x.accountVersion===1),source='0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5';
 if(!legacy||keccak256(await p.getCode({address:legacy.factory}))!==legacy.factoryCodeHash||!await read(legacy.factory,factoryAbi,'isAccount',[source])||!eq(await read(source,accountArtifact.abi,'owner'),signer.address))throw Error('Dedicated buffer source mismatch.');
 await step('bufferWithdraw',source,accountArtifact.abi,'withdraw',[10n*10n**18n]);
}
if(!j.account||!j.guard)throw Error('Run setup first.');
if(!eq(await read(j.account,accountArtifact.abi,'owner'),signer.address))throw Error('Business owner changed.');
if(stage==='loan'){
 if(!j.steps.loanOpen){
  const b=await fresh(),risk=await readLoanRisk(p,c,j.account,b.number),borrow=2000n*10n**18n,target=1101000000000000000n;
  if(risk.recoveryMode)throw Error('No QA borrowing in Recovery Mode.');
  const hints=await read(c.hintHelpers,nativeAbi,'getRedemptionHints',[2100n*10n**18n,risk.price,1n],b.number);
  if(hints[0]!==zeroAddress&&await read(risk.manager,nativeAbi,'getCurrentICR',[hints[0],risk.price],b.number)<=target+500000000000000n)throw Error('No safe own-borrower insertion gap; no loan opened.');
  const fee=await read(c.borrowerOperations,nativeAbi,'getBorrowingFee',[borrow],b.number),reserve=await read(c.borrowerOperations,nativeAbi,'MUSD_GAS_COMPENSATION',[],b.number);
  const collateral=((borrow+fee+reserve)*target+risk.price-1n)/risk.price;
  const positions=await insertionHints(p,c,j.account,'open',borrow,collateral);j.openPlan={block:b.number,borrow,collateral,price:risk.price,targetICR:target};await save();
  await step('loanOpen',j.account,accountArtifact.abi,'openLoan',[borrow,...positions],collateral);
 }else await step('loanOpen',j.account,accountArtifact.abi,'openLoan');
 await step('loanWithdraw',j.account,accountArtifact.abi,'withdraw',[2000n*10n**18n]);
 await step('guardFund',c.musd,tokenAbi,'transfer',[j.guard,2005n*10n**18n]);
}
if(stage==='redeem'){
 const b=await fresh();
 const redeemed=await step('guardRedeem',j.guard,guardArtifact.abi,'redeem',[b.timestamp+120n]);
 const risk=await readLoanRisk(p,c,j.account,redeemed.blockNumber);
 if(risk.surplus<=0n||await read(risk.manager,nativeAbi,'getTroveStatus',[j.account],redeemed.blockNumber)!==4n)throw Error('Actual own surplus not established.');
 j.entitlement=String(risk.surplus);await save();
}
if(stage==='claim'){
 if(!j.entitlement||!j.steps.guardRedeem?.block)throw Error('Verified public redemption required.');
 await step('claim',j.account,accountArtifact.abi,'claimSurplus');
}
if(stage==='recover'){
 if(!j.steps.claim?.block||!j.entitlement)throw Error('Actual claim required before BTC recovery.');
 await step('surplusWithdraw',j.account,accountArtifact.abi,'withdrawBTC',[BigInt(j.entitlement)]);
 await step('guardRecover',j.guard,guardArtifact.abi,'recoverFunds');
}
await writeFile('../../work/wave2-surplus-public-progress.json',JSON.stringify({chainId:31611,owner:signer.address,account:j.account,guard:j.guard,openPlan:j.openPlan,entitlement:j.entitlement,transactions:Object.fromEntries(Object.entries(j.steps).map(([name,s])=>[name,{hash:s.hash,block:s.block,contractAddress:s.contractAddress}]))},(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n');
console.log(JSON.stringify({stage,account:j.account,guard:j.guard,entitlement:j.entitlement,ownerBtcWei:String(await p.getBalance({address:signer.address}))}));
}finally{await lock.close();await unlink(lockPath);}
process.exit(0);
