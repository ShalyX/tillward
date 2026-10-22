import test from 'node:test';
import assert from 'node:assert/strict';
// R03/R04: exact token units and integer allocation; no JS floating-point money.
test('500 MUSD with 20% allocation leaves 400 for operations',async()=>{
 const {parseAmount,splitReceipt}=await import('../src/money.mjs');
 assert.deepEqual(splitReceipt(parseAmount('500'),2000),{repayment:parseAmount('100'),operations:parseAmount('400')});
});
test('reject exponents, negatives and excessive precision',async()=>{
 const {parseAmount}=await import('../src/money.mjs');
 for(const value of ['1e18','-1','NaN','0.0000000000000000001','1.2.3',''])assert.throws(()=>parseAmount(value));
 assert.equal(parseAmount('0.000000000000000001'),1n);
});
test('one wei rounding and separate floor/allocation preserve cash',async()=>{
 const {splitReceipt,parseAmount,available}=await import('../src/money.mjs');
 assert.deepEqual(splitReceipt(1n,2000),{repayment:0n,operations:1n});
 assert.equal(available(parseAmount('5500'),parseAmount('100'),parseAmount('1000')),parseAmount('4400'));
});
test('format input conversion retains whole trailing zeros',async()=>{
 const {parseAmount,inputAmount}=await import('../src/money.mjs');
 assert.equal(inputAmount(parseAmount('1000')),'1000');
});
