// Read-only gate before requesting the owner's manual repayment.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbi,decodeFunctionData,keccak256} from 'viem';
import {readWithRetry} from '../src/read-retry.mjs';
const c=JSON.parse(await readFile('public/deployment-v2.json','utf8'));
const invoice=JSON.parse(await readFile('deployments/wave2-v2-manual-invoice.json','utf8'));
const base=JSON.parse(await readFile('deployments/wave2-live-fee-proof.json','utf8'));
const abi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','function allowance(address,address) view returns(uint256)','function approve(address,uint256) returns(bool)','event Approval(address indexed owner,address indexed spender,uint256 value)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
const eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(c.chainId!==31611||c.accountVersion!==2||await p.getChainId()!==31611||!eq(invoice.account,base.account)||!eq(invoice.owner,base.owner))throw Error('Pinned V2 testnet checkout required.');
const head=await p.getBlockNumber({cacheTime:0}),account=base.account;
if(keccak256(await p.getCode({address:c.factory,blockNumber:head}))!==c.factoryCodeHash)throw Error('Factory mismatch.');
const registered=await p.readContract({address:c.factory,abi:parseAbi(['function isAccount(address) view returns(bool)']),functionName:'isAccount',args:[account],blockNumber:head});
const read=(functionName,args=[])=>readWithRetry(()=>p.readContract({address:account,abi,functionName,args,blockNumber:head}));
if(!registered||!eq(await read('owner'),base.owner))throw Error('Owner/registry mismatch.');
const payments=[],approvals=[];
for(let from=BigInt(invoice.block);from<=head;from+=1000n){
 const to=from+999n<head?from+999n:head;
 const results=await Promise.all([
  p.getContractEvents({address:account,abi,eventName:'ReceiptCollected',args:{id:invoice.id},fromBlock:from,toBlock:to,strict:true}),
  p.getContractEvents({address:c.musd,abi:tokenAbi,eventName:'Approval',args:{owner:base.owner,spender:account},fromBlock:from,toBlock:to,strict:true})]);
 payments.push(...results[0]);approvals.push(...results[1]);
}
const payment=payments.find(e=>e.args.id===invoice.id);
const amount=10000000000000000000n,allocated=9900000000000000000n;
if(!payment||payment.args.amount!==amount||payment.args.allocated!==allocated||!eq(payment.args.payer,base.owner))throw Error('Waiting for exact 10 MUSD payment / 9.9 MUSD allocation.');
const approval=approvals.find(e=>e.args.value===amount&&e.blockNumber<=payment.blockNumber);
if(!approval||approvals.some(e=>e.args.value>amount))throw Error('Exact bounded 10 MUSD approval not proven.');
async function verify(hash,target,action,useAbi){
 const [tx,r]=await Promise.all([p.getTransaction({hash}),p.getTransactionReceipt({hash})]);
 const decoded=decodeFunctionData({abi:useAbi,data:tx.input});
 if(r.status!=='success'||(await p.getBlock({blockNumber:r.blockNumber})).hash!==r.blockHash||!eq(tx.from,base.owner)||!eq(tx.to,target)||tx.value!==0n||decoded.functionName!==action)throw Error('Canonical '+action+' not proven.');
 return {hash,block:r.blockNumber,args:decoded.args};
}
const [approvalProof,paymentProof]=await Promise.all([verify(approval.transactionHash,c.musd,'approve',tokenAbi),verify(payment.transactionHash,account,'payInvoice',abi)]);
if(!eq(approvalProof.args[0],account)||approvalProof.args[1]!==amount||paymentProof.args[0]!==invoice.id)throw Error('Checkout approval/payment intent mismatch.');
const [enabled,paused,bps,pending,fees,repaid,retained,quote,item,balance,allowance]=await Promise.all([
 read('serviceEnabled'),read('paused'),read('repaymentBps'),read('pendingRepayment'),read('totalFeesPaid'),read('totalServiceRepaid'),read('retainedReceiptFunds'),read('repaymentQuote'),read('invoices',[invoice.id]),
 p.readContract({address:c.musd,abi:tokenAbi,functionName:'balanceOf',args:[account],blockNumber:head}),p.readContract({address:c.musd,abi:tokenAbi,functionName:'allowance',args:[base.owner,account],blockNumber:head})]);
if(enabled||paused||bps!==9900||pending!==allocated||fees!==BigInt(base.settlement.fee)||repaid!==BigInt(base.settlement.amount)||retained!==150000000000000000n||balance!==10050000000000000000n||quote[0]!==allocated||quote[1]!==0||!item[4]||allowance!==0n)throw Error('Manual repayment preconditions or unchanged hosted fees not proven.');
const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,block:head,account,owner:base.owner,invoiceId:invoice.id,approval:approvalProof,payment:paymentProof,amount,allocated,serviceEnabled:enabled,allocationPaused:paused,pending,totalFeesPaid:fees,totalServiceRepaid:repaid,retained,balance,allowance,quote,scope:'Canonical exact payment, exhausted allowance and pending manual repayment while hosted routing disabled; not yet repayment proof.'};
await writeFile('deployments/wave2-v2-manual-payment.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n');
console.log(JSON.stringify({verified:true,payment:payment.transactionHash,pendingMUSD:'9.9',businessMUSD:'10.05',additionalServiceFee:'0'}));process.exit(0);
