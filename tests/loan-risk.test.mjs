import test from 'node:test';
import assert from 'node:assert/strict';
import {readLoanRisk,loanRiskStatus,ratioPercent} from '../src/loan-risk.mjs';
const unit=10n**18n,operations='0x'+'11'.repeat(20),manager='0x'+'22'.repeat(20),feed='0x'+'33'.repeat(20),pool='0x'+'44'.repeat(20),account='0x'+'55'.repeat(20);
const base={price:80000n*unit,icr:2n*unit,tcr:3n*unit,mcr:11n*unit/10n,ccr:15n*unit/10n,recoveryMode:false,surplus:0n,timestamp:1000n};
test('risk reads use the native price and the same fixed block for every dependency',async()=>{
 const calls=[];
 const values={troveManager:manager,borrowerOperations:operations,priceFeed:feed,collSurplusPool:pool,MCR:base.mcr,CCR:base.ccr,fetchPrice:base.price,getCurrentICR:base.icr,getTCR:base.tcr,checkRecoveryMode:false,getCollateral:123n};
 const client={async getBlock({blockNumber}){assert.equal(blockNumber,99n);return {timestamp:1000n};},async readContract(call){calls.push(call);return values[call.functionName];}};
 const r=await readLoanRisk(client,{borrowerOperations:operations},account,99n);
 assert.equal(r.surplus,123n);assert.equal(r.icr,base.icr);assert.equal(r.block,99n);
 assert(calls.every(c=>c.blockNumber===99n));
 assert.deepEqual(calls.find(c=>c.functionName==='getCurrentICR').args,[account,base.price]);
 assert.equal(calls.find(c=>c.functionName==='fetchPrice').address,feed);
 assert.equal(calls.find(c=>c.functionName==='getCollateral').address,pool);
});
test('mismatched protocol links and failed oracle reads never produce an assessment',async()=>{
 const client={async getBlock(){return {timestamp:1000n};},async readContract({functionName}){return {troveManager:manager,borrowerOperations:account,priceFeed:feed,collSurplusPool:pool,MCR:base.mcr,CCR:base.ccr}[functionName];}};
 await assert.rejects(readLoanRisk(client,{borrowerOperations:operations},account,99n),/do not match/);
 client.readContract=async({functionName})=>{if(functionName==='fetchPrice')return 0n;return {troveManager:manager,borrowerOperations:operations,priceFeed:feed,collSurplusPool:pool,MCR:base.mcr,CCR:base.ccr}[functionName];};
 await assert.rejects(readLoanRisk(client,{borrowerOperations:operations},account,99n),/Invalid native price/);
});
test('Recovery Mode warns above the ordinary minimum when below the system ratio',()=>{
 const r={...base,icr:12n*unit/10n,tcr:14n*unit/10n,recoveryMode:true};
 assert.equal(loanRiskStatus(r,true,1010).kind,'critical');
 assert.match(loanRiskStatus(r,true,1010).message,/above the normal minimum/);
 assert.equal(loanRiskStatus({...r,icr:r.tcr},true,1010).kind,'attention');
});
test('missing, stale and future-dated snapshots never imply a current healthy position',()=>{
 assert.equal(loanRiskStatus(undefined,true,1010).kind,'unknown');
 assert.equal(loanRiskStatus(base,true,1181).kind,'unknown');
 assert.equal(loanRiskStatus(base,true,900).kind,'unknown');
 assert.equal(loanRiskStatus({...base,icr:unit},true,1010).kind,'critical');
 assert.equal(loanRiskStatus({...base,icr:14n*unit/10n},true,1010).kind,'attention');
 assert.equal(loanRiskStatus(base,true,1010).kind,'monitor');
 assert.equal(loanRiskStatus(base,false,1010).kind,'inactive');
 assert.equal(ratioPercent(1100123456789123456n),'110.01%');
});
