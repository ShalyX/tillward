import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverAccounts,accountBatch,operationalIssues} from '../scripts/keeper-registry.mjs';
const a='0x1111111111111111111111111111111111111111',b='0x2222222222222222222222222222222222222222';
const event=account=>({args:{account,owner:a}});
test('discovery resumes bounded backfill, deduplicates and enrolls later accounts',async()=>{
 const registry={},saved=[];
 const run=head=>discoverAccounts({registry,head,start:10n,pageSize:2n,maxPages:1,
  fetchLogs:async(from)=>from===10n?[event(a),event(a)]:[event(b)],validate:async()=>true,save:async r=>saved.push(structuredClone(r))});
 assert.equal((await run(13n)).synced,false);assert.equal(registry.nextBlock,'12');assert.deepEqual(registry.accounts,[a]);
 assert.equal((await run(13n)).synced,true);assert.deepEqual(registry.accounts,[a,b]);
 assert.equal(saved.length,2);assert.equal(registry.nextBlock,'14');
});
test('failed RPC, validation or disk write never advances a discovery page',async()=>{
 for(const failure of ['rpc','validation','save']){
  const registry={nextBlock:'10',accounts:[a]};
  await assert.rejects(discoverAccounts({registry,head:11n,start:10n,
   fetchLogs:async()=>{if(failure==='rpc')throw Error('rpc');return [event(b)];},
   validate:async()=>failure!=='validation',save:async()=>{if(failure==='save')throw Error('disk');}}));
  assert.equal(registry.nextBlock,'10');assert.deepEqual(registry.accounts,[a]);
 }
});
test('removed and malformed discovery events fail closed',async()=>{
 for(const log of [{...event(b),removed:true},event('bad')])await assert.rejects(discoverAccounts({registry:{},head:1n,start:1n,fetchLogs:async()=>[log],validate:async()=>true,save:async()=>{}}));
});
test('account batches rotate fairly across restart cursors',()=>{
 const accounts=Array.from({length:60},(_,i)=>i),visited=[];let cursor=0;
 for(let i=0;i<3;i++){const batch=accountBatch(accounts,cursor);visited.push(...batch.accounts);cursor=batch.next;}
 assert.equal(new Set(visited).size,60);assert.equal(cursor,15);assert.deepEqual(accountBatch([],0),{accounts:[],next:0});
});
test('health detects stale heartbeat, low gas, low disk and isolated failures',()=>{
 const now=Date.now(),healthy={checkedAt:new Date(now).toISOString(),balance:100000000000000n,freeBytes:1073741824n,now};
 assert.deepEqual(operationalIssues(healthy),[]);
 assert.deepEqual(operationalIssues({...healthy,checkedAt:new Date(now-300001).toISOString(),balance:0n,freeBytes:1n,failures:1}),['heartbeat_stale','gas_low','disk_low','account_failures']);
 assert.ok(operationalIssues({...healthy,checkedAt:'invalid'}).includes('heartbeat_stale'));
});
