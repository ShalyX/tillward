// Independent read-only chain evidence for the visibly driven Rabby QA session.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,webSocket,decodeEventLog,decodeFunctionData,parseAbi,zeroAddress} from 'viem';
const end=BigInt(process.argv[2]||'0');if(end<16301777n)throw Error('Pass the observed BTC-withdrawal confirmation block.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const base=JSON.parse(await readFile('deployments/browser-wallet-proof.json','utf8'));
const abi=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8')).abi;
const p=createPublicClient({transport:webSocket(c.ws,{timeout:20000,retryCount:1})});
const eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(await p.getChainId()!==31611)throw Error('Wrong chain.');
const raw=await p.getLogs({address:base.account,events:abi.filter(e=>e.type==='event'),fromBlock:16301760n,toBlock:end});
const events=raw.flatMap(l=>{try{return [{...decodeEventLog({abi,data:l.data,topics:l.topics}),hash:l.transactionHash,block:l.blockNumber}];}catch{return [];}});
const get=n=>{const e=events.find(x=>x.eventName===n);if(!e)throw Error('Missing '+n);return e;};
const opened=get('LoanOpened'),policy=get('PolicyUpdated'),invoice=get('InvoiceCreated'),paid=get('ReceiptCollected'),settled=get('RepaymentSettled'),closed=get('LoanClosed');
if(opened.args.borrowed!==2000n*10n**18n||opened.args.collateral!==45000000000000000n)throw Error('Unexpected loan.');
if(policy.args.repaymentBps!==2000||policy.args.cashFloor!==0n||policy.args.paused)throw Error('Unexpected policy.');
if(invoice.args.amount!==10n**18n||paid.args.id!==invoice.args.id||paid.args.amount!==10n**18n||paid.args.allocated!==200000000000000000n||!eq(paid.args.payer,base.owner))throw Error('Invoice/payment mismatch.');
if(settled.args.amount!==paid.args.allocated||settled.args.debtBefore-settled.args.debtAfter!==settled.args.amount)throw Error('Native repayment mismatch.');
const transactions={creation:{hash:base.creation,block:base.block}};
for(const [name,e] of Object.entries({openLoan:opened,setPolicy:policy,createInvoice:invoice,payInvoice:paid,settle:settled,closeLoan:closed})){
 const [r,t]=await Promise.all([p.getTransactionReceipt({hash:e.hash}),p.getTransaction({hash:e.hash})]);
 if(r.status!=='success'||!eq(t.from,base.owner)||!eq(t.to,base.account)||decodeFunctionData({abi,data:t.input}).functionName!==name)throw Error(name+' transaction mismatch.');
 transactions[name]={hash:e.hash,block:Number(e.block)};
}
const tokenAbi=parseAbi(['event Transfer(address indexed from,address indexed to,uint256 value)','event Approval(address indexed owner,address indexed spender,uint256 value)','function allowance(address,address) view returns(uint256)']);
const tokenLogs=await p.getLogs({address:c.musd,events:tokenAbi.filter(e=>e.type==='event'),fromBlock:16301760n,toBlock:end});
const approval=tokenLogs.find(l=>l.eventName==='Approval'&&eq(l.args.owner,base.owner)&&eq(l.args.spender,base.account)&&l.args.value===10n**18n);
const topup=tokenLogs.find(l=>l.eventName==='Transfer'&&eq(l.args.from,base.owner)&&eq(l.args.to,base.account)&&l.args.value===3n*10n**18n);
const burned=e=>tokenLogs.some(l=>l.eventName==='Transfer'&&l.transactionHash===e.hash&&eq(l.args.from,base.account)&&eq(l.args.to,zeroAddress)&&l.args.value===(e===closed?closed.args.repaid:settled.args.amount));
if(!approval||!topup||!burned(settled)||!burned(closed))throw Error('Exact approval, top-up or native MUSD burn evidence missing.');
if(await p.readContract({address:c.musd,abi:tokenAbi,functionName:'allowance',args:[base.owner,base.account],blockNumber:end})!==0n)throw Error('Invoice approval was not fully consumed.');
transactions.approve={hash:approval.transactionHash,block:Number(approval.blockNumber)};transactions.topUp={hash:topup.transactionHash,block:Number(topup.blockNumber)};
let exit;
for(let n=end;n>=closed.block&&n+20n>=end;n--){const block=await p.getBlock({blockNumber:n,includeTransactions:true});exit=block.transactions.find(t=>typeof t!=='string'&&eq(t.from,base.owner)&&eq(t.to,base.account)&&decodeFunctionData({abi,data:t.input}).functionName==='withdrawBTC');if(exit)break;}
if(!exit)throw Error('No owner BTC-withdrawal transaction near observed block.');
const decoded=decodeFunctionData({abi,data:exit.input}),receipt=await p.getTransactionReceipt({hash:exit.hash});
if(decoded.args[0]!==45000000000000000n||receipt.status!=='success')throw Error('Wrong BTC withdrawal.');
const exitBlock=exit.blockNumber;
transactions.withdrawBTC={hash:exit.hash,block:Number(exitBlock)};
const [before,after,held,debt,pending,collected,repaid,invoiceState]=await Promise.all([
 p.getBalance({address:base.owner,blockNumber:exitBlock-1n}),p.getBalance({address:base.owner,blockNumber:exitBlock}),p.getBalance({address:base.account,blockNumber:end}),
 ...['debtState','pendingRepayment','totalCollected','totalRepaid'].map(functionName=>p.readContract({address:base.account,abi,functionName,blockNumber:end})),
 p.readContract({address:base.account,abi,functionName:'invoices',args:[invoice.args.id],blockNumber:end})
]);
if(held!==0n||debt[0]!==0n||debt[4]||pending!==0n||!invoiceState[4]||collected!==10n**18n||repaid!==settled.args.amount+closed.args.repaid)throw Error('Exit/accounting mismatch.');
const exitTransaction=await p.getTransaction({hash:exit.hash});
const gasPrice=receipt.effectiveGasPrice??exitTransaction.gasPrice;
if(typeof gasPrice!=='bigint')throw Error('Effective/legacy gas price unavailable; cannot verify exact BTC recovery.');
if(after-before!==45000000000000000n-receipt.gasUsed*gasPrice)throw Error('Owner BTC recovery mismatch.');
const proof={...base,observedAt:new Date().toISOString(),transactions,invoice:invoice.args.id,amounts:{borrowed:'2000 MUSD',collateral:'0.045 BTC',paid:'1 MUSD',allocatedAndSettled:'0.2 MUSD',closed:closed.args.repaid.toString(),recovered:'0.045 BTC'},verified:{ownerTransactions:true,invoicePaid:true,exactNativeRepayment:true,nativeLoanClosed:true,accountBtcZero:true,ownerBtcIncreaseNetOfGas:true,pendingZero:true},browserObserved:'Owner drove Rabby confirmations. App showed onboarding, actual invoice, payment and repayment, native loan close and BTC recovery. Refreshed states matched chain. Payer is the same owner for this browser QA scenario; separate-customer integration evidence exists in the original proof.',remaining:'Public submission materials and judge access; adversarial wallet-change/rejection coverage is not exhaustive.'};
await writeFile('deployments/browser-wallet-proof.json',JSON.stringify(proof,null,2));await writeFile('public/browser-proof.json',JSON.stringify(proof,null,2));
c.lastVerifiedBlock=Math.max(c.lastVerifiedBlock||0,Number(end));await writeFile('public/deployment.json',JSON.stringify(c,null,2));
console.log(JSON.stringify({verified:proof.verified,transactions}));process.exit(0);
