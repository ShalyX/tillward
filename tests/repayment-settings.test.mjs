import test from 'node:test';
import assert from 'node:assert/strict';
import {sharePolicyUpdate} from '../src/repayment-settings.mjs';
test('simplified share form preserves the existing reserve and paused state',()=>{
 assert.deepEqual(sharePolicyUpdate({fees:{},floor:5n*10n**18n,paused:true},9900),[9900,5n*10n**18n,true]);
 assert.deepEqual(sharePolicyUpdate({fees:{},floor:0n,paused:false},2000),[2000,0n,false]);
});
test('simplified form enforces V2 99% limit and preserves V1 compatibility',()=>{
 assert.throws(()=>sharePolicyUpdate({fees:{},floor:0n,paused:false},10000));
 assert.deepEqual(sharePolicyUpdate({floor:500n,paused:false},10000),[10000,500n,false]);
 for(const bps of [-1,9900.5,NaN])assert.throws(()=>sharePolicyUpdate({fees:{},floor:0n,paused:false},bps));
 assert.throws(()=>sharePolicyUpdate({fees:{},paused:false},2000));
});
