import {parseAbi,zeroAddress} from 'viem';
import {readWithRetry} from './read-retry.mjs';
import {snapshotFreshness} from './transaction-recovery.mjs';

// Read the deployed protocol's own ratios, including accrued interest and
// pending redistributions. Never reconstruct ICR from rounded UI balances.
export const riskAbi=parseAbi([
 'function troveManager() view returns(address)',
 'function borrowerOperations() view returns(address)',
 'function priceFeed() view returns(address)',
 'function collSurplusPool() view returns(address)',
 'function fetchPrice() view returns(uint256)',
 'function MCR() view returns(uint256)',
 'function CCR() view returns(uint256)',
 'function getCurrentICR(address,uint256) view returns(uint256)',
 'function getTCR(uint256) view returns(uint256)',
 'function checkRecoveryMode(uint256) view returns(bool)',
 'function getCollateral(address) view returns(uint256)'
]);
export async function readLoanRisk(client,config,account,blockNumber){
 const read=(address,functionName,args=[])=>readWithRetry(()=>client.readContract({address,abi:riskAbi,functionName,args,blockNumber}));
 const manager=await read(config.borrowerOperations,'troveManager');
 if(manager===zeroAddress)throw Error('Native loan manager unavailable.');
 const [operations,feed,pool,mcr,ccr,block]=await Promise.all([
  read(manager,'borrowerOperations'),read(manager,'priceFeed'),read(manager,'collSurplusPool'),
  read(manager,'MCR'),read(manager,'CCR'),client.getBlock({blockNumber})
 ]);
 if(operations.toLowerCase()!==config.borrowerOperations.toLowerCase()||feed===zeroAddress||pool===zeroAddress)throw Error('Native risk contracts do not match the configured protocol.');
 const price=await read(feed,'fetchPrice');
 if(price<=0n||mcr<=0n||ccr<=mcr)throw Error('Invalid native price or collateral thresholds.');
 const [icr,tcr,recoveryMode,surplus]=await Promise.all([
  read(manager,'getCurrentICR',[account,price]),read(manager,'getTCR',[price]),
  read(manager,'checkRecoveryMode',[price]),read(pool,'getCollateral',[account])
 ]);
 if(tcr<=0n||recoveryMode!==(tcr<ccr))throw Error('Inconsistent native system ratio.');
 return {manager,feed,pool,price,icr,tcr,mcr,ccr,recoveryMode,surplus,block:blockNumber,timestamp:block.timestamp};
}
export function ratioPercent(value){return `${value*10000n/10n**18n/100n}.${String(value*10000n/10n**18n%100n).padStart(2,'0')}%`;}
export function loanRiskStatus(risk,active,now=Date.now()/1000){
 if(!risk)return {kind:'unknown',label:'Loan risk unavailable',message:'Refresh to load the native BTC price, collateral ratios and system mode. No current risk assessment is available.'};
 if(!snapshotFreshness(risk.timestamp,now).fresh)return {kind:'unknown',label:'Loan risk snapshot expired',message:'Refresh before relying on these figures. They describe an older block.'};
 if(!active)return {kind:'inactive',label:'No active loan',message:'There is no active loan at this snapshot. Any claimable surplus is separate from BTC already held by your business account.'};
 if(risk.icr<risk.mcr)return {kind:'critical',label:'Below minimum collateral ratio',message:'Your position is exposed to liquidation. Review adding BTC collateral now; receipt repayments depend on eligible funds and native debt limits.'};
 if(risk.recoveryMode&&risk.icr<risk.tcr)return {kind:'critical',label:'Recovery Mode: liquidation exposure',message:'Your ratio is below the system ratio. Recovery Mode can expose positions above the normal minimum to liquidation. Review adding BTC collateral now.'};
 if(risk.recoveryMode)return {kind:'attention',label:'Recovery Mode active',message:'Native borrowing and closure restrictions apply. Review your collateral and repayment rule; system conditions can change.'};
 if(risk.icr<risk.ccr)return {kind:'attention',label:'Review your collateral buffer',message:'Your ratio is below the protocol’s critical system ratio, used here as an early review prompt, not an extra liquidation threshold. Consider adding BTC or reviewing your receipt share.'};
 return {kind:'monitor',label:'Monitor your loan',message:'BTC prices and interest can change your ratio. Receipt-linked repayment does not prevent liquidation or redemption.'};
}
