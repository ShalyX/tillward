import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,decodeFunctionData} from 'viem';
import {readWithRetry} from '../src/read-retry.mjs';
const c=JSON.parse(await readFile('public/deployment-v2.json','utf8'));
const snapshot=JSON.parse(await readFile('../../work/wave2-v2-loan-preflight.json','utf8'));
const abi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
if(await p.getChainId()!==31611)throw Error('Testnet only');
const events=[];const head=BigInt(snapshot.block);
for(let from=BigInt(c.deploymentBlock);from<=head;from+=1000n){
 const end=from+999n<head?from+999n:head;
 events.push(...await readWithRetry(()=>p.getContractEvents({address:snapshot.account,abi,eventName:'LoanOpened',fromBlock:from,toBlock:end,strict:true})));
}
const event=events.find(e=>e.args.borrowed===2500n*10n**18n&&e.args.collateral===45n*10n**15n);
if(!event)throw Error('Exact QA loan event absent.');
const tx=await readWithRetry(()=>p.getTransaction({hash:event.transactionHash}));
const receipt=await readWithRetry(()=>p.getTransactionReceipt({hash:event.transactionHash}));
const block=await p.getBlock({blockNumber:receipt.blockNumber});
if(receipt.status!=='success'||block.hash!==receipt.blockHash||tx.from.toLowerCase()!==snapshot.owner.toLowerCase()||tx.to?.toLowerCase()!==snapshot.account.toLowerCase()||tx.value!==45n*10n**15n||decodeFunctionData({abi,data:tx.input}).functionName!=='openLoan')throw Error('Canonical owner loan not proven.');
const proof={verifiedAt:new Date().toISOString(),chainId:31611,account:snapshot.account,owner:snapshot.owner,hash:event.transactionHash,block:receipt.blockNumber,borrowed:event.args.borrowed,collateral:event.args.collateral,source:'Public owner-signed V2 loan, canonical RPC transaction and receipt, LoanOpened event'};
await writeFile('deployments/wave2-v2-loan-proof.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');console.log(JSON.stringify({verified:true,hash:event.transactionHash,borrowedTestMUSD:'2500',collateralTestBTC:'0.045'}));process.exit(0);
