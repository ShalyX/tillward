// Read-only: explorer discovery, canonical RPC receipts and repayment events.
import {writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbiItem,decodeEventLog,formatUnits} from 'viem';
import {readWithRetry} from '../src/read-retry.mjs';
const address='0x625E52F5AB7b6563f83a3b7FB7EB7cC3a148A956';
const api='https://api.explorer.test.mezo.org';
const client=createPublicClient({transport:fallback([webSocket('wss://rpc-ws.test.mezo.org',{timeout:15000,retryCount:1}),http('https://rpc.test.mezo.org',{timeout:15000,retryCount:1})])});
if(await client.getChainId()!==31611)throw Error('Unexpected chain');
const abi=[parseAbiItem('event RepaymentSettled(address indexed caller, uint256 amount, uint256 debtBefore, uint256 debtAfter)')];
let url=`${api}/api/v2/addresses/${address}/transactions?filter=from`,pages=0;
const discovered=new Map();
while(url){
 if(++pages>100)throw Error('Pagination bound exceeded; refusing partial report');
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`Explorer ${response.status}`);
 const page=await response.json();
 if(!Array.isArray(page.items))throw Error('Invalid explorer response');
 for(const tx of page.items)discovered.set(tx.hash,tx);
 url=page.next_page_params?`${api}/api/v2/addresses/${address}/transactions?${new URLSearchParams({...page.next_page_params,filter:'from'})}`:null;
}
const transactions=[];
for(const entry of discovered.values()){
 const receipt=await readWithRetry(()=>client.getTransactionReceipt({hash:entry.hash}));
 const tx=await readWithRetry(()=>client.getTransaction({hash:entry.hash}));
 const block=await client.getBlock({blockNumber:receipt.blockNumber});
 if(tx.from.toLowerCase()!==address.toLowerCase()||receipt.blockHash!==block.hash)throw Error('Sender/canonical block mismatch');
 let repaid=0n;
 for(const log of receipt.logs){
  if(log.address.toLowerCase()!==tx.to?.toLowerCase())continue;
  try{const event=decodeEventLog({abi,data:log.data,topics:log.topics});
   if(event.args.caller.toLowerCase()===address.toLowerCase())repaid+=event.args.amount;
  }catch{}
 }
 // This RPC omits effectiveGasPrice on legacy receipts; their paid price is tx.gasPrice.
 const price=receipt.effectiveGasPrice??(tx.type==='legacy'?tx.gasPrice:undefined);
 if(typeof price!=='bigint')throw Error('Actual gas price unavailable');
 const gasPaid=receipt.gasUsed*price;
 if(entry.fee?.type!=='actual'||BigInt(entry.fee.value)!==gasPaid)throw Error('Explorer/RPC fee mismatch');
 transactions.push({hash:entry.hash,block:Number(receipt.blockNumber),timestamp:new Date(Number(block.timestamp)*1000).toISOString(),status:receipt.status,method:entry.method,gasUsed:receipt.gasUsed.toString(),effectiveGasPriceWei:price.toString(),gasPaidWei:gasPaid.toString(),gasPaidTestBTC:formatUnits(gasPaid,18),repaidMUSD:formatUnits(repaid,18)});
}
const totalGas=transactions.reduce((s,t)=>s+BigInt(t.gasPaidWei),0n);
const report={observedAt:new Date().toISOString(),chainId:31611,keeper:address,discovery:'Explorer outgoing transaction history, all returned pages; independently reconciled canonical RPC receipts',explorerPages:pages,transactionCount:transactions.length,totalGasPaidWei:totalGas.toString(),totalGasPaidTestBTC:formatUnits(totalGas,18),transactions,limitations:['Test assets; not a dollar expense or mainnet gas forecast.','Only this dedicated signer; owner/customer gas excluded.','No VPS invoice, hosting invoice, support time or paid billing evidence included.','Small QA sample; no customer demand, revenue or production load inferred.']};
await writeFile('deployments/wave2-keeper-costs.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
process.exit(0);
