import {parseAbi,isAddress} from 'viem';
export const serviceAbi=parseAbi([
 'function accountVersion() pure returns(uint256)',
 'function SERVICE_FEE_BPS() view returns(uint16)',
 'function MAX_REPAYMENT_BPS() view returns(uint16)',
 'function feeTreasury() view returns(address)',
 'function serviceEnabled() view returns(bool)',
 'function retainedReceiptFunds() view returns(uint256)',
 'function feeReserve() view returns(uint256)',
 'function totalFeesPaid() view returns(uint256)',
 'function serviceQuote(uint256) view returns(uint256,uint256,bool)',
 'function setServiceEnabled(bool)',
 'function settleDirect(uint256,address,address) returns(uint256)',
 'event ServiceFeePaid(address indexed caller,address indexed treasury,uint256 repayment,uint256 fee)',
 'error ServiceDisabled()', 'error InsufficientFeeFunds()'
]);
export async function readServiceState(client,config,account,block,maximum){
 if(config.accountVersion===undefined||config.accountVersion===1)return undefined;
 if(![2,3].includes(config.accountVersion)||!isAddress(config.feeTreasury||''))throw Error('Unsupported or incomplete fee deployment configuration.');
 const names=['accountVersion','SERVICE_FEE_BPS','MAX_REPAYMENT_BPS','feeTreasury','serviceEnabled','retainedReceiptFunds','feeReserve','totalFeesPaid','serviceQuote'];
 const v=await Promise.all(names.map(functionName=>client.readContract({address:account,abi:serviceAbi,functionName,args:functionName==='serviceQuote'?[maximum]:[],blockNumber:block})));
 if(v[0]!==BigInt(config.accountVersion)||Number(v[1])!==100||Number(v[2])!==9900||v[3]?.toLowerCase()!==config.feeTreasury.toLowerCase())throw Error('Onchain fee terms do not match the approved deployment.');
 if(v[8][0]>maximum||v[8][1]!==v[8][0]/100n)throw Error('Invalid service repayment/fee quote.');
 return {enabled:v[4],treasury:v[3],retained:v[5],reserved:v[6],paid:v[7],repayment:v[8][0],fee:v[8][1],funded:v[8][2]};
}
// Receipt illustration only: actual repayment is additionally constrained by native debt/floor.
export function feePreview(amount,bps,enabled){
 if(typeof amount!=='bigint'||amount<0n||!Number.isInteger(bps)||bps<0||bps>9900)throw Error('Use an allocation between 0% and 99%.');
 const repayment=amount*BigInt(bps)/10000n,fee=enabled?repayment/100n:0n;
 return {repayment,fee,operations:amount-repayment-fee};
}
