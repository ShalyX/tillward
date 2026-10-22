import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,webSocket,decodeEventLog,decodeFunctionData,parseAbi,zeroAddress,keccak256} from 'viem';
import {readWithRetry} from '../src/read-retry.mjs';
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const proof=JSON.parse(await readFile('public/proof.json','utf8'));
const a=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8')).abi;
const tokenAbi=parseAbi(['event Transfer(address indexed from,address indexed to,uint256 value)']);
const p=createPublicClient({transport:webSocket(c.ws,{timeout:20000,retryCount:2,reconnect:false})});
if(await p.getChainId()!==31611)throw new Error('Chain mismatch.');
const head=await p.getBlockNumber({cacheTime:0});
if(head<BigInt(proof.transactions.settle.block))throw new Error('RPC head is behind the confirmed proof. Retry on a synchronized endpoint.');
const eq=(x,y)=>String(x).toLowerCase()===String(y).toLowerCase();
const amount=100n*10n**18n,gross=500n*10n**18n;
const receiptHash=proof.transactions.payInvoice.hash,settleHash=proof.transactions.settle.hash;
function requireThat(ok,why){if(!ok)throw new Error(why);}
const r=await readWithRetry(()=>p.getTransactionReceipt({hash:receiptHash}),5);
const s=await readWithRetry(()=>p.getTransactionReceipt({hash:settleHash}),5);
const [rt,st,code]=await Promise.all([
 readWithRetry(()=>p.getTransaction({blockNumber:r.blockNumber,index:r.transactionIndex}),5),
 readWithRetry(()=>p.getTransaction({blockNumber:s.blockNumber,index:s.transactionIndex}),5),
 readWithRetry(async()=>{const code=await p.getCode({address:c.factory,blockNumber:s.blockNumber});if(!code||keccak256(code)!==c.factoryCodeHash)throw new Error('Factory code not available at confirmed block.');return code;},5)
]);
requireThat(code&&keccak256(code)===c.factoryCodeHash,'Factory code mismatch');
requireThat(r.status==='success'&&s.status==='success','Receipts must both succeed');
requireThat(eq(rt.to,proof.account)&&eq(rt.from,proof.sampleCustomer),'Wrong customer payment parties');
requireThat(eq(st.to,proof.account)&&eq(st.from,proof.sampleCustomer),'Settlement must demonstrate a separate nonowner executor');
const rd=decodeFunctionData({abi:a,data:rt.input}),sd=decodeFunctionData({abi:a,data:st.input});
requireThat(rd.functionName==='payInvoice'&&eq(rd.args[0],proof.invoice),'Wrong invoice calldata');
requireThat(sd.functionName==='settle'&&sd.args[0]===amount,'Wrong repayment calldata');
function events(receipt,address,abi){return receipt.logs.filter(l=>eq(l.address,address)).flatMap(l=>{try{return[decodeEventLog({abi,data:l.data,topics:l.topics})];}catch{return[];}});}
const received=events(r,proof.account,a).find(e=>e.eventName==='ReceiptCollected');
const settled=events(s,proof.account,a).find(e=>e.eventName==='RepaymentSettled');
requireThat(received&&received.args.amount===gross&&received.args.allocated===amount&&eq(received.args.payer,proof.sampleCustomer)&&eq(received.args.id,proof.invoice),'Receipt event mismatch');
requireThat(settled&&settled.args.amount===amount&&settled.args.debtBefore-settled.args.debtAfter===amount,'Native debt reduction must equal exact repayment');
const incoming=events(r,c.musd,tokenAbi).find(e=>eq(e.args.from,proof.sampleCustomer)&&eq(e.args.to,proof.account)&&e.args.value===gross);
const burned=events(s,c.musd,tokenAbi).find(e=>eq(e.args.from,proof.account)&&eq(e.args.to,zeroAddress)&&e.args.value===amount);
requireThat(incoming&&burned,'MUSD transfer/burn evidence missing');
const native=await readWithRetry(()=>p.readContract({address:proof.account,abi:a,functionName:'borrowerOperations'}));
requireThat(eq(native,c.borrowerOperations),'Wrong native loan contract');
proof.independentVerification={verifiedAt:new Date().toISOString(),paymentStatus:r.status,settlementStatus:s.status,tokenTransferExact:true,tokenBurnExact:true,nativeDebtBefore:settled.args.debtBefore.toString(),nativeDebtAfter:settled.args.debtAfter.toString(),nativeDebtReduction:amount.toString(),nonownerExecutor:true,settlementBlock:Number(s.blockNumber)};
proof.failedAttempts=[{hash:'0x96e5229c537c5e6f05f4ce3d89fa787a9f6798a916e8e1c303805a661ceb7348',status:'reverted',reason:'Sorted-list reinsertion exhausted gas with zero hints. Replaced with native computed hints; no financial effect from the failed attempt.'}];
c.lastVerifiedBlock=Number(s.blockNumber);
await writeFile('public/proof.json',JSON.stringify(proof,null,2)+'\n');
await writeFile('deployments/public-testnet-proof.json',JSON.stringify(proof,null,2)+'\n');
await writeFile('public/deployment.json',JSON.stringify(c,null,2)+'\n');
console.log(JSON.stringify(proof.independentVerification));
const socket=await p.transport.getSocket();socket.close();
process.exit(0);
