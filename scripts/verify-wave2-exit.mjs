// Read-only verification of the owner-driven Wave 2 QA cleanup.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,webSocket,http,fallback,decodeFunctionData} from 'viem';
import {readWithRetry} from '../src/read-retry.mjs';
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const topup=JSON.parse(await readFile('deployments/wave2-collateral-topup.json','utf8'));
const abi=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8')).abi;
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
if(c.chainId!==31611||await p.getChainId()!==31611)throw Error('Mezo testnet only.');
const closeHash='0x1ab792f220821a0b472aef5c2404c9bf02b8fcde47ecdf9143c9a71c065c2771';
const [closeTx,closeReceipt]=await Promise.all([readWithRetry(()=>p.getTransaction({hash:closeHash})),readWithRetry(()=>p.getTransactionReceipt({hash:closeHash}))]);
const same=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(closeReceipt.status!=='success'||!same(closeTx.from,topup.owner)||!same(closeTx.to,topup.account)||decodeFunctionData({abi,data:closeTx.input}).functionName!=='closeLoan')throw Error('Owner closure not proven.');
if((await p.getBlock({blockNumber:closeReceipt.blockNumber})).hash!==closeReceipt.blockHash)throw Error('Closure is not canonical.');
const nonce=closeTx.nonce+1;let low=closeReceipt.blockNumber,high=await p.getBlockNumber({cacheTime:0});
if(await p.getTransactionCount({address:topup.owner,blockNumber:high})<=nonce)throw Error('Withdrawal nonce is not mined.');
while(low<high){const mid=(low+high)/2n;if(await p.getTransactionCount({address:topup.owner,blockNumber:mid})>nonce)high=mid;else low=mid+1n;}
const block=await p.getBlock({blockNumber:low,includeTransactions:true});
const tx=block.transactions.find(t=>typeof t!=='string'&&same(t.from,topup.owner)&&t.nonce===nonce);
if(!tx||!same(tx.to,topup.account))throw Error('Expected owner withdrawal not found.');
const decoded=decodeFunctionData({abi,data:tx.input});
if(decoded.functionName!=='withdrawBTC'||decoded.args[0]!==46000000000000000n)throw Error('Unexpected BTC withdrawal amount.');
const receipt=await readWithRetry(()=>p.getTransactionReceipt({hash:tx.hash}));
if(receipt.status!=='success'||receipt.blockHash!==block.hash)throw Error('Withdrawal is not canonically confirmed.');
const [before,after,held,debt,pending]=await Promise.all([
 p.getBalance({address:topup.owner,blockNumber:low-1n}),p.getBalance({address:topup.owner,blockNumber:low}),
 p.getBalance({address:topup.account,blockNumber:low}),
 p.readContract({address:topup.account,abi,functionName:'debtState',blockNumber:low}),
 p.readContract({address:topup.account,abi,functionName:'pendingRepayment',blockNumber:low})
]);
const gasPrice=receipt.effectiveGasPrice??tx.gasPrice;if(typeof gasPrice!=='bigint')throw Error('Gas price unavailable.');
const gas=receipt.gasUsed*gasPrice;
if(after-before+gas!==46000000000000000n||held!==0n||debt[0]!==0n||debt[1]!==0n||debt[4]||pending!==0n)throw Error('Exact owner BTC return and empty native position not proven.');
const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,owner:topup.owner,account:topup.account,closeLoan:{hash:closeHash,block:closeReceipt.blockNumber},withdrawBTC:{hash:tx.hash,block:low,amount:decoded.args[0],gasWei:gas,ownerBefore:before,ownerAfter:after},final:{accountBtc:held,debt:debt[0],collateral:debt[1],active:debt[4],pending},surplusClaimProven:false};
await writeFile('deployments/wave2-loan-exit.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');console.log(JSON.stringify({verified:true,closeLoan:closeHash,withdrawBTC:tx.hash,block:String(low),returnedBtcWei:String(decoded.args[0])}));process.exit(0);
