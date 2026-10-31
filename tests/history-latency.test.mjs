import test from 'node:test';
import assert from 'node:assert/strict';
import {historyPage} from '../src/chain-state.mjs';
test('slow history chunks overlap within the five-request page bound and sort before publication',async()=>{
 let active=0,maximum=0,calls=0;
 const client={async getLogs({toBlock}){active++;calls++;maximum=Math.max(maximum,active);await new Promise(resolve=>setImmediate(resolve));active--;return [{blockNumber:toBlock,logIndex:0}];}};
 const page=await historyPage(client,{address:'account',events:[],deploymentBlock:0n,toBlock:20000n});
 assert.equal(calls,5);assert.equal(maximum,5);assert.equal(active,0);
 assert.deepEqual(page.logs.map(l=>l.blockNumber),[20000n,18000n,16000n,14000n,12000n]);
 assert.equal(page.before,10001n);
});
