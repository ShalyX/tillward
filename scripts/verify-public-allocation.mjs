// Read-only canonical verification of V3 debt-capped receipts, hosted repayment and exit.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbi,decodeFunctionData,decodeEventLog,keccak256} from 'viem';
import {readWithRetry} from '../src/read-retry.mjs';
const mode=process.argv[2]||'repayment';if(!['repayment','closure','recovery'].includes(mode))throw Error('Unknown proof stage.');
const c=JSON.parse(await readFile('deployments/testnet-factory-v3.json','utf8')),f=JSON.parse(await readFile('deployments/wave2-v3-flow.json','utf8')),k=JSON.parse(await readFile('deployments/keeper-v3-enrollment.json','utf8'));
const abi=JSON.parse(await readFile('out/RevenueAccountV3.sol/RevenueAccountV3.json','utf8')).abi;
const tAbi=parseAbi(['function balanceOf(address) view returns(uint256)','event Transfer(address indexed from,address indexed to,uint256 value)','event Approval(address indexed owner,address indexed spender,uint256 value)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
const same=(a,b)=>a?.toLowerCase()===b?.toLowerCase(),serialize=o=>JSON.stringify(o,(_,x)=>typeof x==='bigint'?String(x):x,2)+'\n';
if(c.chainId!==31611||c.accountVersion!==3||await p.getChainId()!==31611||!same(f.factory,c.factory)||!same(k.factory,c.factory))throw Error('Pinned V3 testnet only.');
const head=await p.getBlockNumber({cacheTime:0});
const read=(fn,b,args=[])=>readWithRetry(()=>p.readContract({address:f.account,abi,functionName:fn,args,blockNumber:b}));
const balance=(address,b)=>readWithRetry(()=>p.readContract({address:c.musd,abi:tAbi,functionName:'balanceOf',args:[address],blockNumber:b}));
const logs=(r,address,logAbi)=>r.logs.filter(l=>same(l.address,address)).flatMap(l=>{try{return [decodeEventLog({abi:logAbi,data:l.data,topics:l.topics})];}catch{return [];}});
async function canonical(hash,address,fn,owner=f.owner,callAbi=abi){
 const r=await readWithRetry(()=>p.getTransactionReceipt({hash})),tx=await readWithRetry(()=>p.getTransaction({hash}));
 if(r.status!=='success'||!same(tx.to,address)||!same(tx.from,owner)||tx.value!==0n||(await p.getBlock({blockNumber:r.blockNumber})).hash!==r.blockHash||decodeFunctionData({abi:callAbi,data:tx.input}).functionName!==fn)throw Error('Canonical action mismatch: '+fn);
 return {r,tx,call:decodeFunctionData({abi:callAbi,data:tx.input})};
}
if(keccak256(await p.getCode({address:c.factory,blockNumber:head}))!==c.factoryCodeHash||await read('accountVersion',head)!==3n||!same(await read('owner',head),f.owner)||!same(await read('feeTreasury',head),c.feeTreasury))throw Error('Deployment/version/owner terms mismatch.');
let output;
if(mode==='repayment'){
 if(!f.transactions.invoicePay)throw Error('Receipt not recorded.');
 const pay=await canonical(f.transactions.invoicePay.hash,f.account,'payInvoice'),b=pay.r.blockNumber;
 if(pay.call.args[0]!==f.invoice.id)throw Error('Wrong invoice.');
 const receipt=logs(pay.r,f.account,abi).find(e=>e.eventName==='ReceiptCollected');
 const ds=await read('debtState',b),allocated=ds[0]-ds[3];
 if(!receipt||receipt.args.amount!==2600n*10n**18n||receipt.args.allocated!==allocated||allocated>=2080n*10n**18n||await read('pendingRepayment',b)!==allocated||await read('retainedReceiptFunds',b)!==receipt.args.amount-allocated)throw Error('Exact oversized allocation cap not proven.');
 const approval=await canonical(f.transactions.invoiceApprove.hash,c.musd,'approve',f.owner,parseAbi(['function approve(address,uint256) returns(bool)']));
 if(!same(approval.call.args[0],f.account)||approval.call.args[1]!==receipt.args.amount)throw Error('Exact token approval mismatch.');
 let paid=[];
 for(let from=b;from<=head;from+=1000n)paid.push(...await readWithRetry(()=>p.getContractEvents({address:f.account,abi,eventName:'ServiceFeePaid',fromBlock:from,toBlock:from+999n<head?from+999n:head,strict:true})));
 if(paid.length!==1)throw Error('Expected exactly one hosted settlement; observed '+paid.length);
 const event=paid[0],s=await canonical(event.transactionHash,f.account,'settle',k.signer),sb=s.r.blockNumber;
 const settled=logs(s.r,f.account,abi).find(e=>e.eventName==='RepaymentSettled');
 if(!same(event.args.caller,k.signer)||!same(event.args.treasury,c.feeTreasury)||event.args.fee!==event.args.repayment/100n||!settled||settled.args.amount!==event.args.repayment||settled.args.debtBefore-settled.args.debtAfter!==event.args.repayment)throw Error('Full native repayment / fee mismatch.');
 const state=await read('debtState',sb),beforeBalance=await balance(f.account,sb-1n),afterBalance=await balance(f.account,sb),feeBefore=await balance(c.feeTreasury,sb-1n),feeAfter=await balance(c.feeTreasury,sb);
 if(state[0]!==settled.args.debtAfter||beforeBalance-afterBalance!==event.args.repayment+event.args.fee||feeAfter-feeBefore!==event.args.fee||await read('pendingRepayment',sb)!==allocated-event.args.repayment||await read('totalFeesPaid',sb)!==event.args.fee||await read('totalServiceRepaid',sb)!==event.args.repayment)throw Error('Settlement state/token conservation mismatch.');
 const burns=logs(s.r,c.musd,tAbi).filter(e=>e.eventName==='Transfer'&&same(e.args.from,f.account)&&same(e.args.to,'0x0000000000000000000000000000000000000000')).reduce((n,e)=>n+e.args.value,0n);
 if(burns!==event.args.repayment)throw Error('Native MUSD burn mismatch.');
 output={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,account:f.account,factory:c.factory,owner:f.owner,keeper:k.signer,treasury:c.feeTreasury,payment:{hash:pay.tx.hash,block:b,amount:receipt.args.amount,desiredAllocation:2080n*10n**18n,actualAllocation:allocated,retained:receipt.args.amount-allocated},settlement:{hash:s.tx.hash,block:sb,amount:event.args.repayment,fee:event.args.fee,debtBefore:settled.args.debtBefore,debtAfter:settled.args.debtAfter,pendingAfter:await read('pendingRepayment',sb),balanceAfter:afterBalance,availableAfter:await read('availableToWithdraw',sb),gasUsed:s.r.gasUsed},scope:'Real public testnet receipt and VPS keeper settlement. Dedicated QA owner is payer; approved separate QA treasury receives test fees. Not customer traction or Rabby signing acceptance.'};
}
if(mode==='closure'){
 const prior=JSON.parse(await readFile('deployments/wave2-v3-repayment-proof.json','utf8'));if(!prior.verified||!f.transactions.loanClose)throw Error('Verified repayment and closure required.');
 const x=await canonical(f.transactions.loanClose.hash,f.account,'closeLoan'),b=x.r.blockNumber,ds=await read('debtState',b),events=logs(x.r,f.account,abi),close=events.find(e=>e.eventName==='LoanClosed');
 const before=await balance(f.account,b-1n),after=await balance(f.account,b),btcBefore=await p.getBalance({address:f.account,blockNumber:b-1n}),btcAfter=await p.getBalance({address:f.account,blockNumber:b});
 if(!close||ds[4]||ds[0]!==0n||ds[1]!==0n||await read('pendingRepayment',b)!==0n||await read('feeReserve',b)!==0n||before-after!==close.args.repaid||btcAfter-btcBefore!==45000000000000000n||await read('availableToWithdraw',b)!==after||await read('totalFeesPaid',b)!==BigInt(prior.settlement.fee)||events.some(e=>e.eventName==='ServiceFeePaid'))throw Error('Closure or automatic release not proven.');
 output={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,account:f.account,close:{hash:x.tx.hash,block:b,repaid:close.args.repaid,collateralReturned:btcAfter-btcBefore},after:{debt:ds[0],pending:0n,feeReserve:0n,availableMUSD:after,retained:await read('retainedReceiptFunds',b),totalFeesPaid:await read('totalFeesPaid',b)},releaseAllocationTransactions:Object.values(f.transactions).filter(s=>s.action==='releaseAllocation').length,scope:'Owner closure after hosted repayment, no allocation-release transaction and no closure service fee. Dedicated QA CLI wallet signed; browser reads separately.'};
}
if(mode==='recovery'){
 const prior=JSON.parse(await readFile('deployments/wave2-v3-repayment-proof.json','utf8'));if(!f.transactions.btcRecover||!f.transactions.postClosePay)throw Error('Post-close payment and recovery required.');
 const post=await canonical(f.transactions.postClosePay.hash,f.account,'payInvoice'),postReceipt=logs(post.r,f.account,abi).find(e=>e.eventName==='ReceiptCollected');
 if(!postReceipt||postReceipt.args.amount!==10n**18n||postReceipt.args.allocated!==0n||await read('pendingRepayment',post.r.blockNumber)!==0n||await read('feeReserve',post.r.blockNumber)!==0n)throw Error('Post-close receipt not freely retained.');
 const cash=await canonical(f.transactions.cashRecover.hash,f.account,'withdraw'),btc=await canonical(f.transactions.btcRecover.hash,f.account,'withdrawBTC');
 if(cash.call.args[0]!==BigInt(f.recoveryAmount)||btc.call.args[0]!==45000000000000000n)throw Error('Exact recovery amount mismatch.');
 const ownerBefore=await p.getBalance({address:f.owner,blockNumber:btc.r.blockNumber-1n}),ownerAfter=await p.getBalance({address:f.owner,blockNumber:btc.r.blockNumber});
 const gasPrice=btc.r.effectiveGasPrice??btc.tx.gasPrice;
 if(typeof gasPrice!=='bigint')throw Error('Canonical gas price unavailable.');
 if(ownerAfter-ownerBefore+btc.r.gasUsed*gasPrice!==45000000000000000n)throw Error('Exact owner BTC return not proven.');
 const restore=await canonical(f.transactions.bufferRestore.hash,c.musd,'transfer',f.owner,parseAbi(['function transfer(address,uint256) returns(bool)']));
 if(!same(restore.call.args[0],f.buffer)||restore.call.args[1]!==600n*10n**18n||await balance(f.buffer,restore.r.blockNumber)!==BigInt(f.bufferBefore.balance))throw Error('Temporary buffer not fully restored.');
 const final=await read('debtState',head),fees=await read('totalFeesPaid',head);
 if(final[4]||final[0]!==0n||final[1]!==0n||await read('pendingRepayment',head)!==0n||await read('feeReserve',head)!==0n||await balance(f.account,head)!==0n||await p.getBalance({address:f.account,blockNumber:head})!==0n||fees!==BigInt(prior.settlement.fee))throw Error('Final cleanup or fee totals mismatch.');
 output={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,account:f.account,postCloseReceipt:{hash:post.tx.hash,block:post.r.blockNumber,amount:postReceipt.args.amount,allocated:0n},cashRecovery:{hash:cash.tx.hash,amount:cash.call.args[0]},btcRecovery:{hash:btc.tx.hash,amount:btc.call.args[0],ownerIncreaseNetGas:ownerAfter-ownerBefore},buffer:{hash:restore.tx.hash,amount:600n*10n**18n,originalBalance:BigInt(f.bufferBefore.balance),restored:true},after:{debt:0n,postedCollateral:0n,pending:0n,feeReserve:0n,businessMUSD:0n,businessBTC:0n,totalFeesPaid:fees},scope:'Controlled public-testnet QA completed, all business funds recovered, 600 test MUSD buffer restored, no excess-allocation cleanup transaction.'};
}
await writeFile('deployments/wave2-v3-'+(mode==='closure'?'close':mode)+'-proof.json',serialize(output));console.log(serialize(output));process.exit(0);
