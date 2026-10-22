import test from 'node:test';
import assert from 'node:assert/strict';
import {settlementPlan,gasBudget} from '../scripts/keeper.mjs';
test('executor never proposes more than a quote or its cap',()=>{
 assert.deepEqual(settlementPlan(0n,100n),{amount:0n,eligible:false});
 assert.deepEqual(settlementPlan(80n,100n),{amount:80n,eligible:true});
 assert.deepEqual(settlementPlan(180n,100n),{amount:100n,eligible:true});
 assert.throws(()=>settlementPlan(-1n,100n));
});
test('keeper refuses transaction and daily gas budget overruns',()=>{
 assert.equal(gasBudget(20n,10n,2n,30n,50n),40n);
 assert.throws(()=>gasBudget(20n,10n,4n,30n,100n),/budget exceeded/);
 assert.throws(()=>gasBudget(40n,10n,2n,30n,50n),/budget exceeded/);
 assert.throws(()=>gasBudget(0n,10n,0n),/Invalid/);
});
