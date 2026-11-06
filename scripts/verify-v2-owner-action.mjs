// Read-only verification of explicitly handed-off V2 owner actions.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbi,decodeFunctionData,decodeEventLog,keccak256} from 'viem';
import {parseJournal,transactionIntent,reconcileTransaction} from '../src/transaction-recovery.mjs';
const [kind,requestedHash]=process.argv.slice(2);
let hash=requestedHash;
const methods={manual:'settleDirect',close:'closeLoan',withdraw:'withdrawBTC'};
if(!methods[kind]||(hash!==undefined&&!/^0x[\da-fA-F]{64}$/.test(hash)))throw Error('Usage: verify-v2-owner-action.mjs <manual|close|withdraw> [confirmed-hash]');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const base=JSON.parse(await readFile('deployments/wave2-live-fee-proof.json','utf8'));
const pause=JSON.parse(await readFile('deployments/wave2-v2-pause-proof.json','utf8'));
const abi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','event Transfer(address indexed from,address indexed to,uint256 value)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
const eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(c.chainId!==31611||c.accountVersion!==2||await p.getChainId()!==31611||!eq(base.factory,c.factory)||!eq(pause.account,base.account)||!pause.verified)throw Error('Pinned V2 testnet account/pause required.');
if(!hash){
 if(kind==='withdraw'){
  const closed=JSON.parse(await readFile('deployments/wave2-v2-close-proof.json','utf8'));
  if(!closed.verified||!eq(closed.account,base.account))throw Error('Verified closure required before withdrawal discovery.');
  const closeTx=await p.getTransaction({hash:closed.transaction.hash});
  const nonce=closeTx.nonce+1;
  let low=BigInt(closed.transaction.block),high=await p.getBlockNumber({cacheTime:0});
  if(await p.getTransactionCount({address:base.owner,blockNumber:high})<=nonce)throw Error('Waiting for owner withdrawal nonce.');
  while(low<high){const mid=(low+high)/2n;if(await p.getTransactionCount({address:base.owner,blockNumber:mid})>nonce)high=mid;else low=mid+1n;}
  const consumed=await p.getBlock({blockNumber:low,includeTransactions:true});
  const candidate=consumed.transactions.find(t=>typeof t!=='string'&&eq(t.from,base.owner)&&t.nonce===nonce);
  if(!candidate)throw Error('Consumed nonce unavailable; supply confirmed withdrawal hash.');
  hash=candidate.hash; // Sender, selector, value and exact amount are checked below.
 }else{
 const head=await p.getBlockNumber({cacheTime:0}),matches=[];
 const eventName=kind==='manual'?'RepaymentSettled':'LoanClosed';
 for(let from=BigInt(pause.pause.block)+1n;from<=head;from+=1000n){const to=from+999n<head?from+999n:head;matches.push(...await p.getContractEvents({address:base.account,abi,eventName,fromBlock:from,toBlock:to,strict:true}));}
 const expected=matches.filter(e=>kind==='close'||eq(e.args.caller,base.owner)&&e.args.amount===9900000000000000000n);
 if(expected.length!==1)throw Error('Waiting for one unambiguous owner '+kind+' action; supply a hash to disambiguate.');
 hash=expected[0].transactionHash;
 }
}
const [tx,r]=await Promise.all([p.getTransaction({hash}),p.getTransactionReceipt({hash})]);
const block=await p.getBlock({blockNumber:r.blockNumber});
const call=decodeFunctionData({abi,data:tx.input});
if(r.status!=='success'||r.blockNumber<=BigInt(pause.pause.block)||block.hash!==r.blockHash||!eq(tx.from,base.owner)||!eq(tx.to,base.account)||tx.value!==0n||call.functionName!==methods[kind])throw Error('Canonical owner action not proven.');
if(keccak256(await p.getCode({address:c.factory,blockNumber:r.blockNumber}))!==c.factoryCodeHash)throw Error('Factory code mismatch.');
const registered=await p.readContract({address:c.factory,abi:parseAbi(['function isAccount(address) view returns(bool)']),functionName:'isAccount',args:[base.account],blockNumber:r.blockNumber});
const read=(functionName,blockNumber=r.blockNumber)=>p.readContract({address:base.account,abi,functionName,blockNumber});
if(!registered||!eq(await read('owner'),base.owner))throw Error('Registry/owner mismatch.');
const journal=parseJournal(JSON.stringify(transactionIntent(tx,BigInt(pause.pause.block),methods[kind])));
const recovered=await reconcileTransaction(p,journal);
if(recovered.outcome!=='confirmed'||recovered.receipt?.transactionHash!==hash)throw Error('Persisted-intent recovery failed.');
const before=r.blockNumber-1n;
const balance=(a,b)=>p.readContract({address:c.musd,abi:tokenAbi,functionName:'balanceOf',args:[a],blockNumber:b});
const [feesBefore,feesAfter,serviceRepaid,enabled,debt,pending,musdBefore,musdAfter,btcBefore,btcAfter]=await Promise.all([
 read('totalFeesPaid',before),read('totalFeesPaid'),read('totalServiceRepaid'),read('serviceEnabled'),read('debtState'),read('pendingRepayment'),balance(base.account,before),balance(base.account,r.blockNumber),p.getBalance({address:base.account,blockNumber:before}),p.getBalance({address:base.account,blockNumber:r.blockNumber})]);
const logs=r.logs.filter(l=>eq(l.address,base.account)).flatMap(l=>{try{return [decodeEventLog({abi,data:l.data,topics:l.topics})];}catch{return [];}});
if(feesBefore!==BigInt(base.settlement.fee)||feesAfter!==feesBefore||serviceRepaid!==BigInt(base.settlement.amount)||enabled||logs.some(l=>l.eventName==='ServiceFeePaid'))throw Error('Unexpected hosted fee or reenrollment.');
let amount,ownerBtcBefore,ownerBtcAfter,gas;
if(kind==='manual'){
 const invoice=JSON.parse(await readFile('deployments/wave2-v2-manual-invoice.json','utf8'));
 if(!eq(invoice.account,base.account)||invoice.amount!=='10000000000000000000'||invoice.serviceEnabled!==false)throw Error('Verified manual QA checkout required.');
 const receipts=[];
 for(let from=BigInt(invoice.block);from<=r.blockNumber;from+=1000n){const to=from+999n<r.blockNumber?from+999n:r.blockNumber;receipts.push(...await p.getContractEvents({address:base.account,abi,eventName:'ReceiptCollected',fromBlock:from,toBlock:to,strict:true}));}
 const payment=receipts.find(e=>e.args.id===invoice.id);
 if(!payment||payment.args.amount!==10000000000000000000n||payment.args.allocated!==9900000000000000000n||!eq(payment.args.payer,base.owner)||payment.blockNumber>=r.blockNumber)throw Error('Exact 10 MUSD receipt / 9.9 MUSD allocation not proven.');
 const [paymentTx,paymentReceipt]=await Promise.all([p.getTransaction({hash:payment.transactionHash}),p.getTransactionReceipt({hash:payment.transactionHash})]);
 const paymentCall=decodeFunctionData({abi,data:paymentTx.input});
 if(paymentReceipt.status!=='success'||(await p.getBlock({blockNumber:paymentReceipt.blockNumber})).hash!==paymentReceipt.blockHash||!eq(paymentTx.from,base.owner)||!eq(paymentTx.to,base.account)||paymentCall.functionName!=='payInvoice'||paymentCall.args[0]!==invoice.id||await read('serviceEnabled',payment.blockNumber))throw Error('Canonical checkout payment while opted out not proven.');
 const event=logs.find(l=>l.eventName==='RepaymentSettled');
 amount=9900000000000000000n;
 if(!event||!eq(event.args.caller,base.owner)||event.args.amount!==amount||event.args.debtBefore-event.args.debtAfter!==amount||call.args[0]!==amount||musdBefore-musdAfter!==amount||pending!==0n||debt[0]!==event.args.debtAfter||!debt[4])throw Error('Exact 9.9 MUSD owner repayment not proven.');
 const pendingBefore=await read('pendingRepayment',before);
 if(pendingBefore!==amount)throw Error('Manual repayment allocation mismatch.');
}else if(kind==='close'){
 const event=logs.find(l=>l.eventName==='LoanClosed');
 const oldDebt=await read('debtState',before);
 amount=event?.args.repaid;
 if(!event||!oldDebt[4]||amount<=0n||musdBefore-musdAfter!==amount||btcAfter-btcBefore!==45000000000000000n||debt[0]!==0n||debt[1]!==0n||debt[4]||pending!==0n)throw Error('Native closure and exact collateral return not proven.');
}else{
 amount=45000000000000000n;
 [ownerBtcBefore,ownerBtcAfter]=await Promise.all([p.getBalance({address:base.owner,blockNumber:before}),p.getBalance({address:base.owner,blockNumber:r.blockNumber})]);
 const price=r.effectiveGasPrice??tx.gasPrice;
 if(typeof price!=='bigint')throw Error('Gas price unavailable.');
 gas=r.gasUsed*price;
 if(call.args[0]!==amount||btcBefore-btcAfter!==amount||btcAfter!==0n||ownerBtcAfter-ownerBtcBefore!==amount-gas||debt[0]!==0n||debt[1]!==0n||debt[4]||pending!==0n||musdAfter!==musdBefore)throw Error('Exact owner BTC recovery net of gas not proven.');
}
const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,account:base.account,owner:base.owner,kind,transaction:{hash,block:r.blockNumber,amount,gasUsed:r.gasUsed},feesBefore,feesAfter,serviceRepaid,serviceEnabled:enabled,debt,pending,musdBefore,musdAfter,btcBefore,btcAfter,ownerBtcBefore,ownerBtcAfter,gas,persistedIntentRecovery:'Real canonical action reconciled from serialized intent; no browser reload/replacement fault induced.',scope:'Owner-signed public testnet action; fee counters unchanged. No surplus claim or mainnet proof implied.'};
await writeFile(`deployments/wave2-v2-${kind}-proof.json`,JSON.stringify(proof,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n');
console.log(JSON.stringify({verified:true,kind,hash,amount:String(amount),additionalServiceFee:'0'}));process.exit(0);
