import {keccak256,parseAbi} from 'viem';
const abi=parseAbi(['function isAccount(address) view returns(bool)']);
// Explicitly requested old account links retain their pinned V1 factory/fee semantics.
export async function accountDeployment(client,catalog,target,block){
 const primary=catalog[0];
 for(const candidate of catalog){
  if(candidate.chainId!==primary.chainId||candidate.musd.toLowerCase()!==primary.musd.toLowerCase()||candidate.borrowerOperations.toLowerCase()!==primary.borrowerOperations.toLowerCase())throw Error('Legacy deployment protocol mismatch.');
  const code=await client.getCode({address:candidate.factory,blockNumber:block});
  if(!code||keccak256(code)!==candidate.factoryCodeHash)throw Error('Factory code does not match the pinned deployment.');
  if(await client.readContract({address:candidate.factory,abi,functionName:'isAccount',args:[target],blockNumber:block}))return candidate;
 }
 throw Error('This account was not created by a pinned Tillward factory.');
}
