import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJournal,reconcileTransaction,transactionIntent,snapshotFreshness,restoreLegacyIntent,isUserRejection} from '../src/transaction-recovery.mjs';
import {exactMoney,parseAmount} from '../src/money.mjs';
import {sponsorshipPlan} from '../scripts/keeper.mjs';
const sender='0x'+'11'.repeat(20),to='0x'+'22'.repeat(20),hash='0x'+'aa'.repeat(32),replacement='0x'+'bb'.repeat(32),blockHash='0x'+'cc'.repeat(32);
const tx={hash,from:sender,to,nonce:3,input:'0x1234',value:5n};
const journal=transactionIntent(tx,10n,'payInvoice');
function rpc({changed=false,reverted=false,reorg=false,pending=false,uncertain=false,legacyMissing=false}={}){
 const mined={...tx,hash:changed?replacement:hash,...changed?{to:sender,input:'0x',value:0n}:{}};
 const receipt={transactionHash:mined.hash,blockNumber:18n,blockHash,status:reverted?'reverted':'success'};
 return {
  async getBlockNumber(){return 20n;},
  async getTransactionReceipt({hash:h}){if(uncertain)throw Error('RPC timeout');if(pending||h!==mined.hash)throw Object.assign(Error('not found'),{name:'TransactionReceiptNotFoundError'});return receipt;},
  async getTransactionCount({blockNumber}){return pending||blockNumber<18n?3:4;},
  async getBlock({blockNumber}){return {hash:reorg?'0xdead':blockHash,transactions:blockNumber===18n?[mined]:[]};},
  async getTransaction({hash:h}){if(legacyMissing&&h===hash)throw Error('not found');return h===replacement?mined:tx;}
 };
}
test('original and repriced same-intent transactions release only with a canonical receipt',async()=>{
 const a=await reconcileTransaction(rpc(),journal);assert.equal(a.outcome,'confirmed');
 const p=rpc({changed:true});const getTx=p.getTransaction;p.getTransaction=async args=>({...await getTx(args),to,input:tx.input,value:tx.value});const getBlock=p.getBlock;p.getBlock=async args=>({...await getBlock(args),transactions:[{...tx,hash:replacement}]});
 assert.equal((await reconcileTransaction(p,journal)).outcome,'confirmed');
});
test('confirmed cancellation/different intent is reconciled without claiming original success',async()=>{
 const result=await reconcileTransaction(rpc({changed:true}),journal);assert.equal(result.outcome,'replaced');assert.equal(result.receipt.transactionHash,replacement);
});
test('reload retains exact sender/nonce/intent, independent of connected wallet',async()=>{
 const saved=parseJournal(JSON.stringify(journal));assert.deepEqual(saved,journal);assert.equal((await reconcileTransaction(rpc({changed:true}),saved)).outcome,'replaced');
});
test('dropped, unknown RPC, reorg and missing legacy original never release the lock',async()=>{
 assert.equal((await reconcileTransaction(rpc({pending:true}),journal)).receipt,undefined);
 await assert.rejects(reconcileTransaction(rpc({uncertain:true}),journal),/timeout/);
 await assert.rejects(reconcileTransaction(rpc({reorg:true}),journal),/reorganized/);
 await assert.rejects(reconcileTransaction(rpc({legacyMissing:true}),{hash}),/not found/);
});
test('reverts are distinguished; legacy hash hydrates safely; corrupt journals reject',async()=>{
 assert.equal((await reconcileTransaction(rpc({reverted:true}),journal)).outcome,'reverted');
 assert.equal((await reconcileTransaction(rpc(),parseJournal(hash))).journal.sender,sender);
 assert.throws(()=>parseJournal(JSON.stringify({...journal,nonce:-1})),/Invalid/);
});
test('stale internally consistent and future-dated snapshots cannot enable writes',()=>{
 assert.equal(snapshotFreshness(1000n,1181).fresh,false);assert.equal(snapshotFreshness(1000n,990).fresh,true);assert.equal(snapshotFreshness(1000n,969).fresh,false);assert.equal(snapshotFreshness(1000n,1100).fresh,true);
});
test('checkout keeps every payable digit including sub-cent and one wei',()=>{
 for(const amount of ['0.009999999999999999','0.000000000000000001','100','100.123456789012345678'])assert.equal(exactMoney(parseAmount(amount)),amount);
});
test('dust batches without consuming sponsored budget and each business has its own cap',()=>{
 const unit=10n**18n,cap=25000000000000n;
 for(let i=0;i<100;i++)assert.equal(sponsorshipPlan(1n).eligible,false);
 assert.equal(sponsorshipPlan(unit).eligible,true);
 assert.equal(sponsorshipPlan(unit,cap,{reserve:1n}).eligible,false);
 assert.equal(sponsorshipPlan(unit,0n,{reserve:1n}).eligible,true);
 assert.equal(sponsorshipPlan(unit-1n).reason,'batching-below-1-MUSD');
});

test('legacy recovery accepts only cryptographic proof of the original sender/nonce',async()=>{
 const {privateKeyToAccount}=await import('viem/accounts');const {keccak256}=await import('viem');
 const signer=privateKeyToAccount('0x'+'01'.repeat(32));
 const raw=await signer.signTransaction({chainId:31611,to,nonce:4,gas:21000n,gasPrice:1n,value:0n,type:'legacy'});
 const j=await restoreLegacyIntent(keccak256(raw),raw);assert.equal(j.sender,signer.address);assert.equal(j.nonce,4);assert.equal(j.to.toLowerCase(),to);
 await assert.rejects(restoreLegacyIntent(hash,raw),/does not match/);
});

test('real viem rejection wrapping clears unsent intent but ambiguous transport stays locked',async()=>{
 const {createWalletClient,custom,defineChain,parseAbi}=await import('viem');
 const chain=defineChain({id:31611,name:'fixture',nativeCurrency:{name:'BTC',symbol:'BTC',decimals:18},rpcUrls:{default:{http:['http://127.0.0.1']}}});
 for(const code of [4001,-32000]){
  const client=createWalletClient({chain,transport:custom({async request({method}){if(method==='eth_chainId')return '0x7b7b';throw Object.assign(Error('wallet error'),{code});}})});
  let error;try{await client.writeContract({account:sender,address:to,abi:parseAbi(['function setPolicy(uint16,uint256,bool)']),functionName:'setPolicy',args:[2000,0n,false],nonce:3,gas:400000n});}catch(e){error=e;}
  assert.ok(error);assert.equal(isUserRejection(error),code===4001);
 }
 const cycle={};cycle.cause=cycle;assert.equal(isUserRejection(cycle),false);
});
