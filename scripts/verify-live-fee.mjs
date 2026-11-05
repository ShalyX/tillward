// Independent read-only verification of a public-testnet V2 receipt and keeper settlement.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbi,decodeEventLog,decodeFunctionData,keccak256} from 'viem';
import {readWithRetry} from '../src/read-retry.mjs';
import {readServiceState} from '../src/service-fees.mjs';
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const baseline=JSON.parse(await readFile('../../work/wave2-v2-owner-preflight.json','utf8'));
const invoice=JSON.parse(await readFile('deployments/wave2-v2-invoice.json','utf8'));
const address=baseline.account;
const abi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','function approve(address,uint256) returns(bool)','event Transfer(address indexed from,address indexed to,uint256 value)','event Approval(address indexed owner,address indexed spender,uint256 value)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
if(c.chainId!==31611||await p.getChainId()!==31611)throw Error('Testnet only.');
const head=await p.getBlockNumber({cacheTime:0});
async function eventsThrough(eventName,toBlock){
 const events=[];
 for(let from=BigInt(c.deploymentBlock);from<=toBlock;from+=1000n){
  const end=from+999n<toBlock?from+999n:toBlock;
  events.push(...await readWithRetry(()=>p.getContractEvents({address,abi,eventName,fromBlock:from,toBlock:end,strict:true})));
 }
 return events;
}
const events=await eventsThrough('ServiceFeePaid',head);
const match=events.find(e=>e.args.repayment===495n*10n**18n&&e.args.fee===495n*10n**16n);
if(!match)throw Error('No exact 495 repayment / 4.95 fee settlement recorded yet.');
const receipt=await readWithRetry(()=>p.getTransactionReceipt({hash:match.transactionHash}));
const tx=await readWithRetry(()=>p.getTransaction({hash:match.transactionHash}));
const block=await p.getBlock({blockNumber:receipt.blockNumber});
const same=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(receipt.status!=='success'||block.hash!==receipt.blockHash||!same(tx.to,address)||decodeFunctionData({abi,data:tx.input}).functionName!=='settle')throw Error('Canonical V2 settlement not proven.');
const keeper='0x7C93C575bE5ceD60F388D2866991d68aE23e3D42';
if(!same(tx.from,keeper)||!same(match.args.caller,keeper)||!same(match.args.treasury,c.feeTreasury))throw Error('Unexpected keeper or fee recipient.');
const registered=await p.readContract({address:c.factory,abi:parseAbi(['function isAccount(address) view returns(bool)']),functionName:'isAccount',args:[address],blockNumber:receipt.blockNumber});
const owner=await p.readContract({address,abi,functionName:'owner',blockNumber:receipt.blockNumber});
if(!registered||!same(owner,baseline.owner))throw Error('Owner or V2 registry mismatch.');
await readServiceState(p,c,address,receipt.blockNumber,0n);
const logs=receipt.logs.filter(x=>same(x.address,address)).flatMap(log=>{try{return [decodeEventLog({abi,data:log.data,topics:log.topics})];}catch{return [];}});
const repayment=logs.find(x=>x.eventName==='RepaymentSettled');
if(!repayment||repayment.args.amount!==495n*10n**18n||repayment.args.debtBefore-repayment.args.debtAfter!==495n*10n**18n)throw Error('Full native repayment not proven.');
const transfer=receipt.logs.filter(x=>same(x.address,c.musd)).flatMap(log=>{try{return [decodeEventLog({abi:tokenAbi,data:log.data,topics:log.topics})];}catch{return [];}}).find(x=>same(x.args.from,address)&&same(x.args.to,c.feeTreasury)&&x.args.value===495n*10n**16n);
if(!transfer)throw Error('Exact MUSD treasury transfer absent.');
const read=functionName=>p.readContract({address,abi,functionName,blockNumber:receipt.blockNumber});
const balance=(a,n)=>p.readContract({address:c.musd,abi:tokenAbi,functionName:'balanceOf',args:[a],blockNumber:n});
const [beforeBalance,afterBalance,treasuryBefore,treasuryAfter,pending,paid,repaid,retained,floor,debt]=await Promise.all([
 balance(address,receipt.blockNumber-1n),balance(address,receipt.blockNumber),balance(c.feeTreasury,receipt.blockNumber-1n),balance(c.feeTreasury,receipt.blockNumber),read('pendingRepayment'),read('totalFeesPaid'),read('totalServiceRepaid'),read('retainedReceiptFunds'),read('cashFloor'),read('debtState')]);
if(beforeBalance-afterBalance!==49995n*10n**16n||afterBalance!==5n*10n**16n||treasuryAfter-treasuryBefore!==495n*10n**16n||pending!==0n||paid!==495n*10n**16n||repaid!==495n*10n**18n||retained!==5n*10n**16n||floor!==0n||debt[0]!==repayment.args.debtAfter)throw Error('Exact fee/balance/debt accounting mismatch.');
const receipts=await eventsThrough('ReceiptCollected',receipt.blockNumber);
const payment=receipts.find(e=>e.args.id===invoice.id&&e.args.amount===500n*10n**18n&&e.args.allocated===495n*10n**18n);
if(!payment)throw Error('Exact 500 receipt allocation not proven.');
const paymentReceipt=await readWithRetry(()=>p.getTransactionReceipt({hash:payment.transactionHash}));
if(paymentReceipt.status!=='success'||(await p.getBlock({blockNumber:paymentReceipt.blockNumber})).hash!==paymentReceipt.blockHash)throw Error('Payment is not canonical.');
const paymentTx=await readWithRetry(()=>p.getTransaction({hash:payment.transactionHash}));
const paymentCall=decodeFunctionData({abi,data:paymentTx.input});
if(!same(paymentTx.from,baseline.owner)||!same(paymentTx.to,address)||paymentCall.functionName!=='payInvoice'||paymentCall.args[0]!==invoice.id)throw Error('Payment does not match the owner-approved checkout.');
const approvals=[];
for(let from=BigInt(invoice.block);from<=payment.blockNumber;from+=1000n){
 const end=from+999n<payment.blockNumber?from+999n:payment.blockNumber;
 approvals.push(...await readWithRetry(()=>p.getContractEvents({address:c.musd,abi:tokenAbi,eventName:'Approval',args:{owner:baseline.owner,spender:address},fromBlock:from,toBlock:end,strict:true})));
}
const approval=approvals.find(e=>e.args.value===500n*10n**18n);
if(!approval||approvals.some(e=>e.args.value>500n*10n**18n))throw Error('Exact bounded invoice approval not proven.');
const approvalReceipt=await readWithRetry(()=>p.getTransactionReceipt({hash:approval.transactionHash}));
if(approvalReceipt.status!=='success'||(await p.getBlock({blockNumber:approvalReceipt.blockNumber})).hash!==approvalReceipt.blockHash)throw Error('Approval is not canonical.');
const approvalTx=await readWithRetry(()=>p.getTransaction({hash:approval.transactionHash}));
const approvalCall=decodeFunctionData({abi:tokenAbi,data:approvalTx.input});
if(!same(approvalTx.from,baseline.owner)||!same(approvalTx.to,c.musd)||approvalCall.functionName!=='approve'||!same(approvalCall.args[0],address)||approvalCall.args[1]!==500n*10n**18n)throw Error('Approval parties, action or amount mismatch.');
const code=await p.getCode({address:c.factory,blockNumber:receipt.blockNumber});if(!code||keccak256(code)!==c.factoryCodeHash)throw Error('Factory mismatch.');
const proof={verifiedAt:new Date().toISOString(),chainId:31611,factory:c.factory,account:address,owner:baseline.owner,treasury:c.feeTreasury,keeper,invoiceId:invoice.id,approval:{hash:approval.transactionHash,block:approval.blockNumber,amount:approval.args.value},payment:{hash:payment.transactionHash,block:payment.blockNumber,amount:payment.args.amount,allocated:payment.args.allocated},settlement:{hash:match.transactionHash,block:receipt.blockNumber,amount:repayment.args.amount,fee:match.args.fee,gasUsed:receipt.gasUsed,gasPrice:receipt.effectiveGasPrice??tx.gasPrice},nativeDebtBefore:repayment.args.debtBefore,nativeDebtAfter:repayment.args.debtAfter,accountBefore:beforeBalance,accountAfter:afterBalance,treasuryBefore,treasuryAfter,pending,retained,floor,scope:'Public testnet receipt, unattended VPS keeper, full native repayment and exact atomic fee; no mainnet or customer traction claim'};
await writeFile('deployments/wave2-live-fee-proof.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
console.log(JSON.stringify({verified:true,payment:payment.transactionHash,settlement:match.transactionHash,repaymentMUSD:'495',feeMUSD:'4.95',retainedMUSD:'0.05'}));process.exit(0);
