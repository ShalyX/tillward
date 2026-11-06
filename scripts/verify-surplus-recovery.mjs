import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbi,decodeFunctionData} from 'viem';
const c=JSON.parse(await readFile('public/deployment-v2.json','utf8'));
const flow=JSON.parse(await readFile('deployments/wave2-surplus-flow.json','utf8'));
const claim=JSON.parse(await readFile('deployments/wave2-surplus-claim.json','utf8'));
const redemption=JSON.parse(await readFile('deployments/wave2-surplus-redemption.json','utf8'));
const accountAbi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const guardAbi=JSON.parse(await readFile('out/OwnedSurplusGuard.sol/OwnedSurplusGuard.json','utf8')).abi;
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)']);
const nativeAbi=parseAbi(['function getCollateral(address) view returns(uint256)','function getTroveStatus(address) view returns(uint256)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
const eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(c.chainId!==31611||await p.getChainId()!==31611||!claim.verified||!redemption.verified||!eq(flow.account,claim.account)||!eq(flow.account,redemption.account)||!eq(flow.guard,redemption.guard))throw Error('Verified testnet claim/redemption required.');
async function verify(name,target,abi,method){
 const hash=flow.transactions[name].hash,[tx,r]=await Promise.all([p.getTransaction({hash}),p.getTransactionReceipt({hash})]);
 const decoded=decodeFunctionData({abi,data:tx.input});
 if(r.status!=='success'||(await p.getBlock({blockNumber:r.blockNumber})).hash!==r.blockHash||!eq(tx.from,flow.owner)||!eq(tx.to,target)||tx.value!==0n||decoded.functionName!==method)throw Error('Canonical '+method+' not proven.');
 const price=r.effectiveGasPrice??tx.gasPrice;if(typeof price!=='bigint')throw Error('Gas price missing.');
 return {hash,block:r.blockNumber,args:decoded.args??[],gas:r.gasUsed*price};
}
const withdrawal=await verify('surplusWithdraw',flow.account,accountAbi,'withdrawBTC'),recovery=await verify('guardRecover',flow.guard,guardAbi,'recoverFunds');
const amount=BigInt(claim.claimedBtcWei);
if(withdrawal.args[0]!==amount||withdrawal.block<=BigInt(claim.block)||recovery.block<=withdrawal.block)throw Error('Exact claim then withdrawal then guard recovery sequence not proven.');
const btc=(address,blockNumber)=>p.getBalance({address,blockNumber});
const token=(address,blockNumber)=>p.readContract({address:c.musd,abi:tokenAbi,functionName:'balanceOf',args:[address],blockNumber});
const [businessBefore,businessAfter,ownerBefore,ownerAfter,guardBefore,guardAfter,ownerRecoveryBefore,ownerRecoveryAfter,musdBefore,musdAfter,ownerMusdBefore,ownerMusdAfter]=await Promise.all([
 btc(flow.account,withdrawal.block-1n),btc(flow.account,withdrawal.block),btc(flow.owner,withdrawal.block-1n),btc(flow.owner,withdrawal.block),btc(flow.guard,recovery.block-1n),btc(flow.guard,recovery.block),btc(flow.owner,recovery.block-1n),btc(flow.owner,recovery.block),token(flow.guard,recovery.block-1n),token(flow.guard,recovery.block),token(flow.owner,recovery.block-1n),token(flow.owner,recovery.block)]);
if(businessBefore!==amount||businessAfter!==0n||ownerAfter-ownerBefore!==amount-withdrawal.gas||guardBefore!==BigInt(redemption.redemption.redeemerBtcReceived)||guardAfter!==0n||ownerRecoveryAfter-ownerRecoveryBefore!==guardBefore-recovery.gas||musdAfter!==0n||ownerMusdAfter-ownerMusdBefore!==musdBefore)throw Error('Exact owner BTC/token recovery net of gas not proven.');
const block=recovery.block;
const read=functionName=>p.readContract({address:flow.account,abi:accountAbi,functionName,blockNumber:block});
const [debt,pending,fees,service,surplus,status,businessMusd]=await Promise.all([read('debtState'),read('pendingRepayment'),read('totalFeesPaid'),read('serviceEnabled'),p.readContract({address:claim.pool,abi:nativeAbi,functionName:'getCollateral',args:[flow.account],blockNumber:block}),p.readContract({address:redemption.manager,abi:nativeAbi,functionName:'getTroveStatus',args:[flow.account],blockNumber:block}),token(flow.account,block)]);
if(debt[0]!==0n||debt[1]!==0n||debt[4]||pending!==0n||fees!==0n||service||surplus!==0n||status!==4n||businessMusd!==0n)throw Error('Final native/account state not empty and fee-free.');
const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,account:flow.account,owner:flow.owner,guard:flow.guard,claimTransaction:claim.transaction,redemptionTransaction:redemption.redemption.hash,withdrawal,recovery,surplusRecovered:amount,ownerBtcBeforeWithdrawal:ownerBefore,ownerBtcAfterWithdrawal:ownerAfter,redeemerBtcRecovered:guardBefore,guardMusdRecovered:musdBefore,final:{debt:debt[0],postedCollateral:debt[1],active:false,pending,fees,serviceEnabled:false,surplus,accountBtc:businessAfter,accountMusd:businessMusd,guardBtc:guardAfter,guardMusd:musdAfter,nativeStatus:status},scope:'Dedicated wallet executed the public product contracts; app before/after state was read without wallet access. Native redemption fee is separate from Tillward fees. Test assets only; no customer adoption or mainnet claim.'};
await writeFile('deployments/wave2-surplus-recovery.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n');console.log(JSON.stringify({verified:true,account:flow.account,surplusBtcWei:String(amount),withdrawal:withdrawal.hash,recovery:recovery.hash,allRemainingFixtureFundsRecovered:true}));process.exit(0);
