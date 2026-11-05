// Canonical owner authorization proof, distinct from actual fee collection.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,decodeFunctionData} from 'viem';
import {readServiceState} from '../src/service-fees.mjs';
import {readWithRetry} from '../src/read-retry.mjs';
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const snapshot=JSON.parse(await readFile('../../work/wave2-v2-99-preflight.json','utf8'));
const loan=JSON.parse(await readFile('deployments/wave2-v2-loan-proof.json','utf8'));
const abi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
if(await p.getChainId()!==31611)throw Error('Testnet only');
const head=BigInt(snapshot.block),address=snapshot.account;
const events=[];
for(let from=BigInt(loan.block);from<=head;from+=1000n){const end=from+999n<head?from+999n:head;
 for(const eventName of ['PolicyUpdated','ServiceEnabled'])events.push(...await readWithRetry(()=>p.getContractEvents({address,abi,eventName,fromBlock:from,toBlock:end,strict:true})));}
const policy=events.filter(e=>e.eventName==='PolicyUpdated'&&e.args.repaymentBps===9900&&e.args.cashFloor===0n&&!e.args.paused).at(-1);
const enabled=events.filter(e=>e.eventName==='ServiceEnabled'&&e.args.enabled).at(-1);
if(!policy||!enabled)throw Error('Expected exact policy and service authorization absent.');
const transactions=[];
for(const [event,fn] of [[policy,'setPolicy'],[enabled,'setServiceEnabled']]){
 const tx=await readWithRetry(()=>p.getTransaction({hash:event.transactionHash}));
 const receipt=await readWithRetry(()=>p.getTransactionReceipt({hash:event.transactionHash}));
 const block=await p.getBlock({blockNumber:receipt.blockNumber});
 const call=decodeFunctionData({abi,data:tx.input});
 if(receipt.status!=='success'||receipt.blockHash!==block.hash||tx.from.toLowerCase()!==snapshot.owner.toLowerCase()||tx.to?.toLowerCase()!==address.toLowerCase()||call.functionName!==fn)throw Error('Canonical owner authorization mismatch.');
 transactions.push({action:fn,hash:event.transactionHash,block:receipt.blockNumber});
}
const fees=await readServiceState(p,c,address,head,0n);
const [bps,floor,paused]=await Promise.all(['repaymentBps','cashFloor','paused'].map(functionName=>p.readContract({address,abi,functionName,blockNumber:head})));
if(bps!==9900||floor!==0n||paused||!fees.enabled)throw Error('Terms not active at snapshot.');
const proof={verifiedAt:new Date().toISOString(),chainId:31611,account:address,owner:snapshot.owner,block:head,repaymentBps:bps,floor,paused,serviceEnabled:fees.enabled,feeBps:100,treasury:fees.treasury,transactions,scope:'Owner consent/policy only; no fee collection implied'};
await writeFile('deployments/wave2-v2-policy-proof.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');console.log(JSON.stringify({verified:true,repaymentBps:bps,serviceEnabled:true,transactions:transactions.map(t=>t.hash)}));process.exit(0);
