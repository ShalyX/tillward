import test from 'node:test';
import assert from 'node:assert/strict';
import {settlementPlan,gasBudget,validatePending} from '../scripts/keeper.mjs';
import {privateKeyToAccount} from 'viem/accounts';
import {parseAbi,encodeFunctionData,keccak256,zeroAddress} from 'viem';
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
test('pending journal accepts only this signer, chain, target and bounded settlement',async()=>{
 const signer=privateKeyToAccount('0x'+'01'.repeat(32)),target='0x1111111111111111111111111111111111111111';
 const abi=parseAbi(['function settle(uint256 maximum,address upper,address lower)']);
 const base={chainId:31611,to:target,gas:800000n,gasPrice:1n,nonce:0,type:'legacy',value:0n,data:encodeFunctionData({abi,functionName:'settle',args:[1n,zeroAddress,zeroAddress]})};
 const make=async change=>{const raw=await signer.signTransaction({...base,...change});return {chainId:31611,account:target,raw,hash:keccak256(raw)};};
 const valid=await make({});await validatePending(valid,signer.address,abi);
 await assert.rejects(validatePending({...valid,hash:'0x'+'00'.repeat(32)},signer.address,abi));
 await assert.rejects(validatePending(valid,target,abi));
 await assert.rejects(validatePending(await make({chainId:1}),signer.address,abi));
 await assert.rejects(validatePending(await make({to:zeroAddress}),signer.address,abi));
 await assert.rejects(validatePending(await make({value:1n}),signer.address,abi));
 await assert.rejects(validatePending(await make({gasPrice:1000000000n}),signer.address,abi));
});
