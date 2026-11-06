import test from 'node:test';
import assert from 'node:assert/strict';
import {keccak256} from 'viem';
import {accountDeployment} from '../src/deployment-routing.mjs';
const base={chainId:31611,musd:'token',borrowerOperations:'operations',factoryCodeHash:keccak256('0x6000')};
const v2={...base,factory:'new',accountVersion:2},v1={...base,factory:'old',accountVersion:1};
test('old checkout links retain old fee-free terms and new links select V2',async()=>{
 const calls=[];const p={getCode:async()=> '0x6000',readContract:async r=>{calls.push(r);return r.address==='old';}};
 assert.equal(await accountDeployment(p,[v2,v1],'account',100n),v1);
 assert.ok(calls.every(r=>r.blockNumber===100n));
 p.readContract=async()=>true;assert.equal(await accountDeployment(p,[v2,v1],'account',100n),v2);
});
test('unknown accounts, code/protocol mismatch and unavailable registries fail closed',async()=>{
 const p={getCode:async()=> '0x6000',readContract:async()=>false};
 await assert.rejects(accountDeployment(p,[v2,v1],'unknown',100n));
 await assert.rejects(accountDeployment(p,[v2,{...v1,musd:'wrong'}],'account',100n));
 await assert.rejects(accountDeployment({...p,getCode:async()=> '0x00'},[v2],'account',100n));
 await assert.rejects(accountDeployment({...p,readContract:async()=>{throw Error('RPC unavailable');}},[v2,v1],'account',100n));
});

test('V3 catalog preserves both historical V2 fees and V1 fee-free accounts',async()=>{
 const v3={...base,factory:'latest',accountVersion:3};
 for(const selected of [v3,v2,v1]){
  const client={getCode:async()=> '0x6000',readContract:async r=>r.address===selected.factory};
  assert.equal(await accountDeployment(client,[v3,v2,v1],'account',200n),selected);
 }
});
