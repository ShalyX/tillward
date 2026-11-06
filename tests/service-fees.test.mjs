import test from 'node:test';
import assert from 'node:assert/strict';
import {readServiceState,feePreview} from '../src/service-fees.mjs';
const treasury='0x'+'ab'.repeat(20),account='0x'+'cd'.repeat(20);
const config={accountVersion:2,feeTreasury:treasury};
test('V2 reads and validates terms at a fixed block and exposes exact 99% split',async()=>{
 const calls=[];const values={accountVersion:2n,SERVICE_FEE_BPS:100,MAX_REPAYMENT_BPS:9900,feeTreasury:treasury,serviceEnabled:true,retainedReceiptFunds:5n*10n**18n,feeReserve:495n*10n**16n,totalFeesPaid:0n,serviceQuote:[495n*10n**18n,495n*10n**16n,true]};
 const p={readContract:async req=>{calls.push(req);return values[req.functionName];}};
 const s=await readServiceState(p,config,account,10n,495n*10n**18n);
 assert.equal(s.enabled,true);assert.equal(s.funded,true);assert.equal(s.fee,495n*10n**16n);
 assert.ok(calls.every(x=>x.blockNumber===10n&&x.address===account));
 assert.deepEqual(feePreview(500n*10n**18n,9900,true),{repayment:495n*10n**18n,fee:495n*10n**16n,operations:5n*10n**16n});
});
test('fee reads fail closed on changed treasury, unavailable terms or unsupported version',async()=>{
 await assert.rejects(readServiceState({}, {accountVersion:3},account,1n,1n));
 await assert.rejects(readServiceState({}, {accountVersion:2},account,1n,1n));
 const p={readContract:async()=>{throw Error('RPC offline');}};
 await assert.rejects(readServiceState(p,config,account,1n,1n));
 const wrong={readContract:async ({functionName})=>({accountVersion:2n,SERVICE_FEE_BPS:100,MAX_REPAYMENT_BPS:9900,feeTreasury:account,serviceQuote:[100n,1n,true]}[functionName])};
 await assert.rejects(readServiceState(wrong,config,account,1n,100n));
});
test('V1 remains fee-free and preview cannot accept 100% on V2',async()=>{
 assert.equal(await readServiceState({}, {},account,1n,1n),undefined);
 assert.throws(()=>feePreview(500n,10000,true));
 assert.deepEqual(feePreview(1n,9900,true),{repayment:0n,fee:0n,operations:1n});
 assert.deepEqual(feePreview(500n,2000,false),{repayment:100n,fee:0n,operations:400n});
});

test('V3 requires the matching revision and preserves exact hosted fee terms',async()=>{
 const values={accountVersion:3n,SERVICE_FEE_BPS:100,MAX_REPAYMENT_BPS:9900,feeTreasury:treasury,serviceEnabled:true,retainedReceiptFunds:3000n,feeReserve:20n,totalFeesPaid:0n,serviceQuote:[200n,2n,true]};
 const client={readContract:async ({functionName})=>values[functionName]};
 const state=await readServiceState(client,{accountVersion:3,feeTreasury:treasury},account,10n,200n);
 assert.equal(state.repayment,200n);assert.equal(state.fee,2n);assert.equal(state.funded,true);
 await assert.rejects(readServiceState(client,{accountVersion:2,feeTreasury:treasury},account,10n,200n));
 await assert.rejects(readServiceState(client,{accountVersion:4,feeTreasury:treasury},account,10n,200n));
});
