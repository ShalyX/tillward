import {parseAbi,zeroAddress} from 'viem';
import {readWithRetry} from './read-retry.mjs';
const boAbi=parseAbi(['function troveManager() view returns(address)','function sortedTroves() view returns(address)','function getBorrowingFee(uint256) view returns(uint256)','function MUSD_GAS_COMPENSATION() view returns(uint256)']);
const tmAbi=parseAbi(['function getTroveOwnersCount() view returns(uint256)','function getEntireDebtAndColl(address) view returns(uint256,uint256,uint256,uint256,uint256,uint256)']);
const helperAbi=parseAbi(['function troveManager() view returns(address)','function getApproxHint(uint256,uint256,uint256) view returns(address,uint256,uint256)']);
const sortedAbi=parseAbi(['function findInsertPosition(uint256,address,address) view returns(address,address)','function getPrev(address) view returns(address)','function getNext(address) view returns(address)']);

export function projectedNicr(collateral,principal,interest,kind,amount,value=0n){
 if(kind==='repay'){const reduction=amount>interest?amount-interest:0n;if(reduction>=principal)throw new Error('Repayment would consume principal floor.');principal-=reduction;}
 if(kind==='add')collateral+=value;
 if(principal<=0n)throw new Error('No principal for insertion hints.');
 return collateral*10n**20n/principal;
}
// Hint parameters only optimize sorted-list traversal. Native contracts validate them again.
export async function insertionHints(client,config,account,kind,amount=0n,value=0n){
 if(!config.hintHelpers)throw new Error('Native hint helper is not configured.');
 const head=await client.getBlockNumber({cacheTime:0});
 const anchor=BigInt(config.lastVerifiedBlock??config.deploymentBlock??0);
 const blockNumber=head>anchor?head:anchor;
 const read=(address,abi,functionName,args=[])=>readWithRetry(()=>client.readContract({address,abi,functionName,args,blockNumber}));
 const [manager,sorted]=await Promise.all([read(config.borrowerOperations,boAbi,'troveManager'),read(config.borrowerOperations,boAbi,'sortedTroves')]);
 const helperManager=await read(config.hintHelpers,helperAbi,'troveManager');if(helperManager.toLowerCase()!==manager.toLowerCase())throw new Error('Hint helper does not match the native loan manager.');
 const count=await read(manager,tmAbi,'getTroveOwnersCount');if(count===0n)return [zeroAddress,zeroAddress];
 let ratio;
 if(kind==='open'){
   const [fee,reserve]=await Promise.all([read(config.borrowerOperations,boAbi,'getBorrowingFee',[amount]),read(config.borrowerOperations,boAbi,'MUSD_GAS_COMPENSATION')]);
   ratio=projectedNicr(value,amount+fee+reserve,0n,'open',0n);
 }else{const [collateral,principal,interest]=await read(manager,tmAbi,'getEntireDebtAndColl',[account]);ratio=projectedNicr(collateral,principal,interest,kind,amount,value);}
 const trials=BigInt(Math.min(512,Math.max(32,Math.ceil(10*Math.sqrt(Number(count))))));
 const [approx]=await read(config.hintHelpers,helperAbi,'getApproxHint',[ratio,trials,BigInt(Date.now())]);
 let [upper,lower]=await read(sorted,sortedAbi,'findInsertPosition',[ratio,approx,approx]);
 if(upper.toLowerCase()===account.toLowerCase())upper=await read(sorted,sortedAbi,'getPrev',[account]);
 if(lower.toLowerCase()===account.toLowerCase())lower=await read(sorted,sortedAbi,'getNext',[account]);
 return [upper,lower];
}
