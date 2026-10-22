// Real public TESTNET integration proof; sample customer uses recycled test MUSD, not business revenue.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createPublicClient,createWalletClient,defineChain,http,encodeFunctionData,keccak256,parseAbi,parseTransaction,toHex,zeroAddress} from 'viem';
import {privateKeyToAccount,generatePrivateKey} from 'viem/accounts';
import {readWithRetry} from '../src/read-retry.mjs';
import {insertionHints} from '../src/native-hints.mjs';
const walletPath=resolve(process.argv[2]||'');if(!process.argv[2])throw new Error('Provide the dedicated test-wallet JSON path.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));if(!c.factory||c.chainId!==31611)throw new Error('Deploy on Mezo testnet first.');
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const p=createPublicClient({chain,transport:http(c.rpc,{timeout:25000,retryCount:2})});if(await p.getChainId()!==31611)throw new Error('Wrong network.');
const makeWallet=s=>createWalletClient({chain,account:privateKeyToAccount(s.privateKey),transport:http(c.rpc,{timeout:25000,retryCount:2})});
const owner=makeWallet(JSON.parse(await readFile(walletPath,'utf8')));
const customerPath=resolve(dirname(walletPath),'paydown-sample-customer.json');let customerSecret;try{customerSecret=JSON.parse(await readFile(customerPath,'utf8'));}catch{customerSecret={privateKey:generatePrivateKey(),purpose:'TESTNET sample customer only'};await writeFile(customerPath,JSON.stringify(customerSecret));}const customer=makeWallet(customerSecret);
const progressPath=resolve(dirname(walletPath),'paydown-proof-progress.json');let journal={};try{journal=JSON.parse(await readFile(progressPath,'utf8'));}catch{}
const factory=JSON.parse(await readFile('out/RevenueFactory.sol/RevenueFactory.json','utf8'));
const accountArtifact=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8'));
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','function approve(address,uint256) returns(bool)','function transfer(address,uint256) returns(bool)']);
const save=()=>writeFile(progressPath,JSON.stringify(journal,null,2));
async function act(key,w,address,abi,fn,args=[],value=0n){
 const gasFloor=fn==='createAccount'?3500000n:fn==='openLoan'?1600000n:fn?800000n:25000n;
 if(key==='settle'&&journal[key]&&!journal[key].confirmed&&process.argv.includes('--retry-reverted-settlement')){
  const previous=await p.getTransactionReceipt({hash:journal[key].hash});
  if(previous.status==='reverted'){journal.failedAttempts??=[];journal.failedAttempts.push({hash:journal[key].hash,block:Number(previous.blockNumber),reason:'Native sorted-list traversal exhausted the gas allowance with zero insertion hints.'});delete journal[key];await save();}
 }
 if(!journal[key]){
   if(fn==='settle'||fn==='openLoan'){const hints=await insertionHints(p,c,address,fn==='settle'?'repay':'open',args[0],value);args=[args[0],...hints];}
   const data=fn?encodeFunctionData({abi,functionName:fn,args}):'0x';
   if(fn)await p.simulateContract({address,abi,functionName:fn,args,value,account:w.account});
   const req=await w.prepareTransactionRequest({account:w.account,to:address,data,value,gas:gasFloor});
   const raw=await w.signTransaction(req);journal[key]={hash:keccak256(raw),raw};await save();
 }
 const tx=journal[key];let seen;try{seen=await p.getTransaction({hash:tx.hash});}catch{}
 // Recover the initial RPC-underestimated transaction only if it is unseen and
 // its nonce is still unused. Same action/value/nonce, larger gas allowance.
 const parsed=parseTransaction(tx.raw);
 if(!seen&&!tx.confirmed&&parsed.gas<gasFloor){
   if(await p.getTransactionCount({address:w.account.address,blockTag:'pending'})!==parsed.nonce)throw new Error('Nonce changed; inspect before replacing gas-underestimated transaction.');
   const req=await w.prepareTransactionRequest({account:w.account,to:address,data:parsed.data,value,nonce:parsed.nonce,gas:gasFloor});
   const raw=await w.signTransaction(req);tx.rejectedGasEstimateHash=tx.hash;tx.hash=keccak256(raw);tx.raw=raw;await save();
 }
 if(!seen){const submitted=await p.sendRawTransaction({serializedTransaction:tx.raw});if(submitted!==tx.hash)throw new Error('Submitted hash mismatch.');}
 const receipt=await p.waitForTransactionReceipt({hash:tx.hash,timeout:180000,confirmations:1});
 if(receipt.status!=='success')throw new Error(`${key} reverted: ${tx.hash}. Inspect before any replacement.`);
 tx.confirmed=true;tx.block=Number(receipt.blockNumber);await save();console.log(`${key}: confirmed ${tx.hash}`);return receipt;
}
const fr=(fn,args=[])=>readWithRetry(()=>p.readContract({address:c.factory,abi:factory.abi,functionName:fn,args}));
let account=await fr('accountOf',[owner.account.address]);if(account===zeroAddress){await act('createAccount',owner,c.factory,factory.abi,'createAccount');account=await fr('accountOf',[owner.account.address]);}
const ar=(fn,args=[])=>readWithRetry(()=>p.readContract({address:account,abi:accountArtifact.abi,functionName:fn,args}));
const unit=10n**18n;
if(!(await ar('debtState'))[4]){
 const balance=await p.getBalance({address:owner.account.address});
 // Keep 10% in the dedicated owner wallet for deployment and sample-customer gas.
 const collateral=balance*90n/100n;
 await act('openLoan',owner,account,accountArtifact.abi,'openLoan',[2000n*unit,zeroAddress,zeroAddress],collateral);
}
if(!journal.setPolicy?.confirmed)await act('setPolicy',owner,account,accountArtifact.abi,'setPolicy',[2000,500n*unit,false]);
const id=keccak256(toHex('Public testnet sample final invoice 001'));
let inv=await ar('invoices',[id]);
if(inv[1]===0n){const b=await p.getBlock();await act('createInvoice',owner,account,accountArtifact.abi,'createInvoice',[id,'Sample final payment 001',500n*unit,b.timestamp+30n*86400n]);inv=await ar('invoices',[id]);}
if(!inv[4]){
 if(!journal.withdrawSample?.confirmed)await act('withdrawSample',owner,account,accountArtifact.abi,'withdraw',[500n*unit]);
 if(!journal.fundCustomerMusd?.confirmed)await act('fundCustomerMusd',owner,c.musd,tokenAbi,'transfer',[customer.account.address,500n*unit]);
 if(!journal.fundCustomerGas?.confirmed)await act('fundCustomerGas',owner,customer.account.address,[],null,[],100000000000000n);
 if(!journal.approveInvoice?.confirmed)await act('approveInvoice',customer,c.musd,tokenAbi,'approve',[account,500n*unit]);
 if(!journal.payInvoice?.confirmed)await act('payInvoice',customer,account,accountArtifact.abi,'payInvoice',[id]);
}
if(!journal.debtBeforeSettlement){journal.debtBeforeSettlement=(await ar('debtState'))[0].toString();journal.pendingBefore=(await ar('pendingRepayment')).toString();await save();}
// A different wallet can execute the bounded repayment without owner permissions.
if(!journal.settle?.confirmed)await act('settle',customer,account,accountArtifact.abi,'settle',[100n*unit,zeroAddress,zeroAddress]);
const [debt,collateral,minimum,reserve,active]=await ar('debtState');
const collected=await ar('totalCollected'),repaid=await ar('totalRepaid'),pending=await ar('pendingRepayment');
if(collected!==500n*unit||repaid!==100n*unit||pending!==0n||!active)throw new Error('Unexpected final native repayment state.');
const output={environment:'Mezo public testnet',chainId:31611,verifiedAt:new Date().toISOString(),factory:c.factory,account,owner:owner.account.address,sampleCustomer:customer.account.address,invoice:id,customerReceiptMusd:'500',receiptAllocationMusd:'100',totalCollected:collected.toString(),totalRepaid:repaid.toString(),pendingRepayment:pending.toString(),debtBeforeSettlement:journal.debtBeforeSettlement,debtAfterRead:debt.toString(),collateral:collateral.toString(),minimum:minimum.toString(),reserve:reserve.toString(),active,transactions:Object.fromEntries(Object.entries(journal).filter(([,v])=>v?.confirmed).map(([k,v])=>[k,{hash:v.hash,block:v.block}])),disclosure:'Sample customer funded from the test loan for integration proof. This is not customer revenue or adoption. Debt read at a later block includes newly accrued interest; the settlement event records exact same-transaction debt reduction.'};
await mkdir('deployments',{recursive:true});await writeFile('deployments/public-testnet-proof.json',JSON.stringify(output,null,2)+'\n');
await writeFile('public/proof.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:'verified',account,receipt:'500 MUSD',nativeRepayment:'100 MUSD',pending:'0',settlement:journal.settle.hash}));
