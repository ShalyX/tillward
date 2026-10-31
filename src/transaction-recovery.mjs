import {isAddress,keccak256,parseTransaction,recoverTransactionAddress} from 'viem';
const hashPattern=/^0x[0-9a-fA-F]{64}$/;
export function parseJournal(raw){
 if(!raw)return undefined;
 if(hashPattern.test(raw))return {hash:raw}; // Legacy journal: hydrate from the original transaction when available.
 const j=JSON.parse(raw);
 if(!j||!hashPattern.test(j.hash)||!isAddress(j.sender)||!Number.isSafeInteger(j.nonce)||j.nonce<0||!/^\d+$/.test(j.startBlock)||!isAddress(j.to)||!/^0x[0-9a-fA-F]*$/.test(j.input)||!/^\d+$/.test(j.value))throw Error('Invalid transaction recovery journal. Writes remain blocked; restore the journal before continuing.');
 return j;
}
export function transactionIntent(tx,startBlock,action){return {hash:tx.hash,sender:tx.from,nonce:tx.nonce,startBlock:String(startBlock),to:tx.to,input:tx.input,value:String(tx.value),action};}
export function sameIntent(j,tx){return j.to?.toLowerCase()===tx.to?.toLowerCase()&&j.input?.toLowerCase()===tx.input?.toLowerCase()&&BigInt(j.value)===tx.value;}
// Only a receipt in the canonical chain releases the lock. Absence, elapsed time,
// or a pending nonce never proves that a financial action cannot still execute.
export async function reconcileTransaction(client,journal){
 let j=journal;
 if(j.sender===undefined){const tx=await client.getTransaction({hash:j.hash});j=transactionIntent(tx,0n,'legacy');}
 const head=await client.getBlockNumber({cacheTime:0});
 let receipt;try{receipt=await client.getTransactionReceipt({hash:j.hash});}catch(e){if(e.name!=='TransactionReceiptNotFoundError')throw e;}
 if(!receipt){
  if(await client.getTransactionCount({address:j.sender,blockNumber:head})<=j.nonce)return {journal:j};
  // Binary search the canonical block where this nonce was consumed. This also
  // recovers replacements after reload without scanning every intervening block.
  let low=BigInt(j.startBlock),high=head;
  if(low>head)return {journal:j};
  while(low<high){const mid=(low+high)/2n;const n=await client.getTransactionCount({address:j.sender,blockNumber:mid});if(n>j.nonce)high=mid;else low=mid+1n;}
  const block=await client.getBlock({blockNumber:low,includeTransactions:true});
  const tx=block.transactions.find(t=>typeof t!=='string'&&t.from.toLowerCase()===j.sender.toLowerCase()&&t.nonce===j.nonce);
  if(!tx)throw Error('Consumed nonce could not be reconciled. Pending transaction retained.');
  receipt=await client.getTransactionReceipt({hash:tx.hash});
 }
 if(receipt.blockNumber>head)return {journal:j};
 const block=await client.getBlock({blockNumber:receipt.blockNumber});
 if(block.hash!==receipt.blockHash)throw Error('Transaction receipt reorganized. Pending transaction retained.');
 const tx=await client.getTransaction({hash:receipt.transactionHash});
 if(tx.from.toLowerCase()!==j.sender.toLowerCase()||tx.nonce!==j.nonce)throw Error('Recovery transaction does not match sender and nonce.');
 return {journal:j,receipt,outcome:receipt.status!=='success'?'reverted':sameIntent(j,tx)?'confirmed':'replaced'};
}
export function snapshotFreshness(timestamp,now=Date.now()/1000,maxAge=180){const age=now-Number(timestamp);return {fresh:Number.isFinite(age)&&age>=-30&&age<=maxAge,age};}

// For a legacy hash whose node no longer knows the original: the signed bytes
// prove sender/nonce/intent against that exact hash. No user-entered nonce guess.
export async function restoreLegacyIntent(hash,serialized){
 if(!/^0x[0-9a-fA-F]+$/.test(serialized)||keccak256(serialized).toLowerCase()!==hash.toLowerCase())throw Error('Signed transaction does not match the saved original hash.');
 const tx=parseTransaction(serialized);if(!tx.to||!Number.isSafeInteger(tx.nonce))throw Error('Unsupported original transaction.');
 return transactionIntent({hash,from:await recoverTransactionAddress({serializedTransaction:serialized}),to:tx.to,nonce:tx.nonce,input:tx.data??'0x',value:tx.value??0n},0n,'legacy');
}

export function isUserRejection(error){
 const seen=new Set();let current=error;
 while(current&&typeof current==='object'&&!seen.has(current)){seen.add(current);if(current.code===4001)return true;current=current.cause;}
 return false;
}
