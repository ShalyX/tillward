// Independent, read-only evidence for the October 31 user-driven Rabby QA.
// Run with --partial before exit, or without it to require complete loan exit.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,webSocket,http,fallback,parseAbi,decodeFunctionData,decodeEventLog,encodeFunctionData,keccak256,zeroAddress} from 'viem';
import {reconcileTransaction} from '../src/transaction-recovery.mjs';
const partial=process.argv.includes('--partial');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const base=JSON.parse(await readFile('deployments/browser-wallet-proof.json','utf8'));
const keeper=JSON.parse(await readFile('deployments/hosted-keeper-proof.json','utf8')).keeper;
const abi=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8')).abi;
const tokenAbi=parseAbi(['event Transfer(address indexed from,address indexed to,uint256 value)','event Approval(address indexed owner,address indexed spender,uint256 value)','function allowance(address,address) view returns(uint256)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
const from=16484245n,amount=5000000000000000001n,allocation=10n**18n,collateral=45000000000000000n;
const invoice='0x70e6ac5c7a0e61d1f00a847dd42bad5b8a77af5d977422dbd835add33d4119ff';
const eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(await p.getChainId()!==31611)throw Error('Wrong chain.');
let end=await p.getBlockNumber({cacheTime:0});
if(keccak256(await p.getCode({address:c.factory,blockNumber:end}))!==c.factoryCodeHash)throw Error('Factory fingerprint mismatch.');
const ranges=[];for(let start=from;start<=end;start+=2000n)ranges.push([start,start+1999n<end?start+1999n:end]);
const events=(await Promise.all(ranges.map(([fromBlock,toBlock])=>p.getContractEvents({address:base.account,abi,fromBlock,toBlock,strict:true})))).flat();
const get=(name,predicate=()=>true)=>events.find(e=>e.eventName===name&&predicate(e));
const opened=get('LoanOpened'),created=get('InvoiceCreated',e=>eq(e.args.id,invoice)),paid=get('ReceiptCollected',e=>eq(e.args.id,invoice));
const settled=get('RepaymentSettled',e=>eq(e.args.caller,keeper)&&e.args.amount===allocation),closed=get('LoanClosed');
if(!opened||opened.args.borrowed!==2000n*10n**18n||opened.args.collateral!==collateral)throw Error('New native loan mismatch.');
if(!created||created.args.amount!==amount||created.args.label!=='Release QA · exact 18-decimal payment')throw Error('Invoice mismatch.');
if(!paid||paid.args.amount!==amount||paid.args.allocated!==allocation||!eq(paid.args.payer,base.owner))throw Error('Exact receipt/allocation mismatch.');
if(!settled||settled.args.debtBefore-settled.args.debtAfter!==allocation)throw Error('Keeper/native debt delta mismatch.');
const approvals=(await Promise.all(ranges.map(([fromBlock,toBlock])=>p.getContractEvents({address:c.musd,abi:tokenAbi,eventName:'Approval',args:{owner:base.owner,spender:base.account},fromBlock,toBlock,strict:true})))).flat();
const approved=approvals.find(e=>e.args.value===amount);if(!approved)throw Error('No exact invoice approval.');
const transactions={};
async function verify(hash,name,address,sender){
 const [tx,r]=await Promise.all([p.getTransaction({hash}),p.getTransactionReceipt({hash})]);
 const useAbi=eq(address,c.musd)?tokenAbi.concat(parseAbi(['function approve(address,uint256)'])):abi;
 const decoded=decodeFunctionData({abi:useAbi,data:tx.input});
 if(r.status!=='success'||!eq(tx.from,sender)||!eq(tx.to,address)||decoded.functionName!==name)throw Error(name+' receipt/sender/call mismatch.');
 if((await p.getBlock({blockNumber:r.blockNumber})).hash!==r.blockHash)throw Error(name+' receipt reorganized.');
 transactions[name]={hash,block:r.blockNumber,nonce:tx.nonce,sender:tx.from};
 return {tx,r,decoded};
}
const [openTx,approval,payment,repayment]=await Promise.all([
 verify(opened.transactionHash,'openLoan',base.account,base.owner),verify(approved.transactionHash,'approve',c.musd,base.owner),
 verify(paid.transactionHash,'payInvoice',base.account,base.owner),verify(settled.transactionHash,'settle',base.account,keeper)
]);
if(openTx.tx.value!==collateral||approval.tx.value!==0n||payment.tx.value!==0n||repayment.tx.value!==0n||approval.decoded.args[1]!==amount||!eq(approval.decoded.args[0],base.account))throw Error('Unexpected transaction value/approval.');
function transfers(receipt){return receipt.logs.flatMap(log=>{if(!eq(log.address,c.musd))return [];try{const e=decodeEventLog({abi:tokenAbi,data:log.data,topics:log.topics});return e.eventName==='Transfer'?[e.args]:[];}catch{return [];}});}
if(!transfers(payment.r).some(t=>eq(t.from,base.owner)&&eq(t.to,base.account)&&t.value===amount))throw Error('Exact MUSD payment transfer missing.');
if(!transfers(repayment.r).some(t=>eq(t.from,base.account)&&eq(t.to,zeroAddress)&&t.value===allocation))throw Error('Native repayment burn missing.');
let recovered=false;
if(closed){
 const close=await verify(closed.transactionHash,'closeLoan',base.account,base.owner);
 if(!transfers(close.r).some(t=>eq(t.from,base.account)&&eq(t.to,zeroAddress)&&t.value===closed.args.repaid))throw Error('Native close burn missing.');
 // The next owner nonce is the explicitly prepared BTC withdrawal. Resolve its
 // canonical receipt using the same persisted-intent recovery code, never sign.
 const journal={hash:'0x'+'00'.repeat(32),sender:base.owner,nonce:close.tx.nonce+1,startBlock:String(closed.blockNumber),to:base.account,input:encodeFunctionData({abi,functionName:'withdrawBTC',args:[collateral]}),value:'0'};
 const result=await reconcileTransaction(p,journal);
 if(result.receipt&&result.outcome==='confirmed'){
  const exit=await verify(result.receipt.transactionHash,'withdrawBTC',base.account,base.owner);end=exit.r.blockNumber;
  const [before,after]=await Promise.all([p.getBalance({address:base.owner,blockNumber:end-1n}),p.getBalance({address:base.owner,blockNumber:end})]);
  const price=exit.r.effectiveGasPrice??exit.tx.gasPrice;
  if(typeof price!=='bigint'||after-before!==collateral-exit.r.gasUsed*price)throw Error('Exact owner BTC recovery net of gas mismatch.');
  recovered=true;
 }
}
const read=(functionName,blockNumber=end,args=[])=>p.readContract({address:base.account,abi,functionName,args,blockNumber});
const [debt,pending,collected,repaid,held,allowance,beforeCollected,beforeRepaid,invoiceState]=await Promise.all([
 read('debtState'),read('pendingRepayment'),read('totalCollected'),read('totalRepaid'),p.getBalance({address:base.account,blockNumber:end}),
 p.readContract({address:c.musd,abi:tokenAbi,functionName:'allowance',args:[base.owner,base.account],blockNumber:end}),
 read('totalCollected',from-1n),read('totalRepaid',from-1n),read('invoices',end,[invoice])
]);
if(allowance!==0n||pending!==0n||!invoiceState[4]||collected!==beforeCollected+amount||repaid!==beforeRepaid+allocation+(closed?.args.repaid??0n))throw Error('Final allowance/receipt/accounting mismatch.');
const complete=!!closed&&recovered&&held===0n&&debt[0]===0n&&debt[1]===0n&&!debt[4];
if(!partial&&!complete)throw Error('Loan exit is not complete.');
const proof={observedAt:new Date().toISOString(),release:'2026-10-31-recovery-3',chainId:31611,account:base.account,owner:base.owner,keeper,invoice,fromBlock:from,snapshotBlock:end,complete,transactions,
 amounts:{borrowed:opened.args.borrowed,collateral,paid:amount,allocated:allocation,settled:allocation,closed:closed?.args.repaid??null},
 verified:{exactApproval:true,exactPayment:true,allowanceZero:true,keeperSender:true,exactNativeRepayment:true,invoicePaid:true,pendingZero:true,nativeLoanClosed:!!closed,ownerBtcIncreaseNetOfGas:recovered,accountBtcZero:held===0n},
 disclosure:'Owner paid the test invoice with test MUSD. This is integration QA, not customer revenue. Live rejection/replacement were not exercised; fixture coverage is separate.'};
const json=JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2);await writeFile('deployments/recovery-browser-lifecycle.json',json+'\n');console.log(json);process.exit(0);
