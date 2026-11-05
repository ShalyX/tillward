// Mainnet reads only. No wallet, signing, deployment or paid plan changes.
import {writeFile,stat,readdir} from 'node:fs/promises';
import {createPublicClient,http,parseAbi,formatUnits} from 'viem';
const rpc='https://mezo-mainnet.boar.network';
const p=createPublicClient({transport:http(rpc,{timeout:20000,retryCount:2})});
if(await p.getChainId()!==31612)throw Error('Expected mainnet reads');
const head=await p.getBlockNumber({cacheTime:0});
const abi=parseAbi(['function troveManager() view returns(address)','function priceFeed() view returns(address)','function fetchPrice() returns(uint256)']);
const manager=await p.readContract({address:'0x44b1bac67dDA612a41a58AAf779143B181dEe031',abi,functionName:'troveManager',blockNumber:head});
const feed=await p.readContract({address:manager,abi,functionName:'priceFeed',blockNumber:head});
const price=await p.readContract({address:feed,abi,functionName:'fetchPrice',blockNumber:head});
if(price<=0n)throw Error('Invalid oracle price');
const quote=await p.getGasPrice();
const blocks=[];
for(let i=0;i<24;i+=3){
 blocks.push(...await Promise.all([i,i+1,i+2].map(n=>p.getBlock({blockNumber:head-BigInt(n*1800),includeTransactions:true}))));
}
const prices=blocks.flatMap(b=>b.transactions.filter(t=>typeof t!=='string'&&typeof t.gasPrice==='bigint').map(t=>t.gasPrice));
prices.sort((a,b)=>a<b?-1:a>b?1:0);
const percentile=q=>prices.length?prices[Math.min(prices.length-1,Math.ceil(q*prices.length)-1)]:null;
const independent=createPublicClient({transport:http('https://rpc_evm-mezo.imperator.co',{timeout:15000,retryCount:1})});
let crossCheck;
try{const chain=await independent.getChainId();if(chain!==31612)throw Error('Wrong chain');crossCheck={chainId:chain,gasPriceWei:String(await independent.getGasPrice())};}catch{crossCheck={unavailable:true};}
const btcUSD=Number(formatUnits(price,18));
// Round above the observed 403,568 maximum; not a mainnet settle estimate.
const gasUnits=450000;
const paidGasAllowance=1.1; // Hypothetical extra attempts consuming full gas.
const unitGasUSD=gasUnits*Number(quote)/1e18*btcUSD;
const assumptions={vpsMonthlyUSD:5,frontendVercelMonthlyUSD:20,frontendStaticAlternativeMonthlyUSD:0,operationsReserveMonthlyUSD:10,supportHourlyUSD:25,supportMinutesPerBusinessMonthly:20,fixedOperationsMinutesMonthly:60,onboardingMinutesPerNewBusiness:45,settlementsPerBusinessMonthly:20,gasUnitsPerAttempt:gasUnits,paidAttemptMultiplier:paidGasAllowance,musdUSD:1,gasStressMultiplier:10,rpcCyclesPerMonth:43200,rpcReadsPerCheckedBusiness:5,rpcFixedReadsPerCycle:10,rpcCUPerRequest:20,rpcUSDPerMillionCU:.3};
const rows=[];
for(const businesses of [10,25,100])for(const repaymentPerBusiness of [1000,3000]){
 const repayment=businesses*repaymentPerBusiness;
 const settlements=businesses*assumptions.settlementsPerBusinessMonthly;
 const supportHours=(businesses*assumptions.supportMinutesPerBusinessMonthly+assumptions.fixedOperationsMinutesMonthly)/60;
 const support=supportHours*assumptions.supportHourlyUSD;
 const gas=settlements*unitGasUSD*paidGasAllowance;
 const rpcRequests=(Math.min(25,businesses)*assumptions.rpcReadsPerCheckedBusiness+assumptions.rpcFixedReadsPerCycle)*assumptions.rpcCyclesPerMonth;
 const rpcUSD=rpcRequests*assumptions.rpcCUPerRequest/1e6*assumptions.rpcUSDPerMillionCU;
 const cost=5+20+10+support+gas+rpcUSD;
 rows.push({businesses,repaymentPerBusinessMUSD:repaymentPerBusiness,monthlyRepaymentMUSD:repayment,settlements,supportHours,supportUSD:support,gasUSD:gas,rpcRequests,rpcUSD,totalRecurringUSD:cost,totalAt10xGasUSD:cost+9*gas,breakEvenFeePercent:cost/repayment*100,breakEvenAt10xGasPercent:(cost+9*gas)/repayment*100,feeFor50PercentContributionMarginPercent:2*cost/repayment*100,contributionAtHalfPercentUSD:repayment*.005-cost,contributionAtOnePercentUSD:repayment*.01-cost});
}
const assets=await readdir('dist/assets');let assetBytes=0;for(const f of assets)assetBytes+=(await stat('dist/assets/'+f)).size;
const videoBytes=(await stat('public/media/tillward-pitch.mp4')).size;
const report={observedAt:new Date().toISOString(),chainId:31612,rpc,head:String(head),priceFeed:feed,btcUSD,priceBasis:'Native Mezo oracle eth_call at fixed head; not a guaranteed realizable exchange price',gasQuoteWei:String(quote),crossCheck,sample:{blocks:blocks.length,oldestBlock:String(blocks.at(-1).number),oldestTimestamp:new Date(Number(blocks.at(-1).timestamp)*1000).toISOString(),newestTimestamp:new Date(Number(blocks[0].timestamp)*1000).toISOString(),transactionsWithGasPrice:prices.length,minWei:prices[0]?.toString(),medianWei:percentile(.5)?.toString(),p95Wei:percentile(.95)?.toString(),maxWei:prices.at(-1)?.toString(),method:'24 evenly spaced block samples at 1800-block intervals; transaction offered gasPrice, not paid receipts or full-day percentiles'},gasPer450kAttemptUSD:unitGasUSD,gasPer450kAttempt10xUSD:10*unitGasUSD,assumptions,frontend:{builtAssetBytes:assetBytes,videoBytes,tenThousandColdAssetLoadsGB:assetBytes*10000/1e9,oneThousandFullVideoLoadsGB:videoBytes*1000/1e9,limitations:'Uncompressed local file-size scenarios; not observed CDN traffic. Excludes fonts, HTML, headers and cache/compression effects.'},scenarios:rows,limitations:['Tillward is not deployed on mainnet; testnet gas-size proxy with headroom, not a mainnet settlement receipt.','Fee-transfer overhead is not implemented or benchmarked.','Gas and BTC price snapshots are not future price guarantees.','Support, onboarding, volume, paid-attempt multiplier and operations reserve are explicit unvalidated planning assumptions.','No dedicated RPC SLA quote, security audit, legal, taxes, full engineering payroll, acquisition or fee-collection costs included.','No plan purchase, host migration, financial signing or fee enablement.']};
report.supportSensitivity=[{name:'lean',minutesPerBusiness:10,fixedMinutes:30,hourlyUSD:15},{name:'base',minutesPerBusiness:20,fixedMinutes:60,hourlyUSD:25},{name:'heavy',minutesPerBusiness:45,fixedMinutes:120,hourlyUSD:40}].map(s=>({...s,monthlySupportForTenBusinessesUSD:(10*s.minutesPerBusiness+s.fixedMinutes)/60*s.hourlyUSD}));
report.onboardingCostPerNewBusinessUSD=assumptions.onboardingMinutesPerNewBusiness/60*assumptions.supportHourlyUSD;
report.rpcPricingBasis={source:'https://drpc.org/docs/pricing/compute-units',basis:'Illustrative metered usage at 20 CU/request and USD 0.30/million CU; no plan credits/base charges assumed. Not a purchased plan, provider selection or SLA quote. Real request load, browser usage, retries and startup discovery need measurement.',boarAlternative:'https://boar.network/rpc/pricing: 50M CU/month free, 10 req/s; paid USD 0.40/million CU. Do not transfer dRPC CU weights to Boar.'};
await writeFile('deployments/wave2-production-economics.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({gasPerAttemptUSD:unitGasUSD,gasQuoteWei:String(quote),btcUSD,transactionsSampled:prices.length,scenarios:rows,supportSensitivity:report.supportSensitivity},null,2));
