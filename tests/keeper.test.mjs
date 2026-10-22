import test from 'node:test';
import assert from 'node:assert/strict';
import {settlementPlan} from '../scripts/keeper.mjs';
test('executor never proposes more than a quote or its cap',()=>{
 assert.deepEqual(settlementPlan(0n,100n),{amount:0n,eligible:false});
 assert.deepEqual(settlementPlan(80n,100n),{amount:80n,eligible:true});
 assert.deepEqual(settlementPlan(180n,100n),{amount:100n,eligible:true});
 assert.throws(()=>settlementPlan(-1n,100n));
});
