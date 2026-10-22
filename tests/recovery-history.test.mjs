import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapshotBoundary,historyPage} from '../src/chain-state.mjs';

test('recovered confirmation advances a stale RPC snapshot before pending is cleared',async()=>{
 const client={getBlockNumber:async()=>100n,getTransactionReceipt:async()=>({blockNumber:140n,status:'success'})};
 const result=await snapshotBoundary(client,120n,'0xpending');
 assert.equal(result.block,140n);assert.equal(result.receipt.status,'success');
});
test('unavailable receipt preserves pending and the last confirmed block',async()=>{
 const result=await snapshotBoundary({getBlockNumber:async()=>100n,getTransactionReceipt:async()=>{throw Error('not found');}},130n,'0xpending');
 assert.equal(result.block,130n);assert.equal(result.receipt,undefined);
});
test('reverted receipts still advance the read boundary',async()=>{
 const result=await snapshotBoundary({getBlockNumber:async()=>100n,getTransactionReceipt:async()=>({blockNumber:150n,status:'reverted'})},120n,'0xpending');
 assert.equal(result.block,150n);assert.equal(result.receipt.status,'reverted');
});
test('history crosses 10000 blocks without gaps and supports older pages',async()=>{
 const ranges=[];const client={getLogs:async r=>{ranges.push([r.fromBlock,r.toBlock]);return [{blockNumber:r.toBlock,logIndex:0}];}};
 const recent=await historyPage(client,{address:'0xaccount',events:[],deploymentBlock:10n,toBlock:25009n});
 assert.equal(recent.before,15010n);
 const older=await historyPage(client,{address:'0xaccount',events:[],deploymentBlock:10n,toBlock:recent.before-1n});
 assert.equal(older.before,5010n);
 const final=await historyPage(client,{address:'0xaccount',events:[],deploymentBlock:10n,toBlock:older.before-1n});
 assert.equal(final.before,undefined);
 const sorted=ranges.sort((a,b)=>Number(a[0]-b[0]));
 assert.equal(sorted[0][0],10n);assert.equal(sorted.at(-1)[1],25009n);
 for(let i=1;i<sorted.length;i++)assert.equal(sorted[i][0],sorted[i-1][1]+1n);
 assert.ok(sorted.every(([a,b])=>b-a<2000n));
});
test('failed history page rejects instead of silently skipping a block range',async()=>{
 await assert.rejects(historyPage({getLogs:async()=>{throw Error('offline');}},{address:'a',events:[],deploymentBlock:0n,toBlock:15000n}),/offline/);
});
