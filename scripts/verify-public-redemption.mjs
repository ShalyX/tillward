// Independent canonical proof that one controlled borrower produced real surplus.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbi,decodeFunctionData,decodeEventLog,encodeDeployData,keccak256} from 'viem';
const c=JSON.parse(await readFile('public/deployment-v2.json','utf8'));
const flow=JSON.parse(await readFile('deployments/wave2-surplus-flow.json','utf8'));
const guardArtifact=JSON.parse(await readFile('out/OwnedSurplusGuard.sol/OwnedSurplusGuard.json','utf8'));
const accountAbi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const native=parseAbi(['function troveManager() view returns(address)','function collSurplusPool() view returns(address)','function getCollateral(address) view returns(uint256)','function getTroveStatus(address) view returns(uint256)','function getEntireDebtAndColl(address) view returns(uint256,uint256,uint256,uint256,uint256,uint256)','event Redemption(uint256 attempted,uint256 actual,uint256 collateralSent,uint256 collateralFee)','event TroveUpdated(address indexed borrower,uint256 principal,uint256 interest,uint256 collateral,uint256 stake,uint16 interestRate,uint256 lastInterestUpdateTime,uint8 operation)','event CollBalanceUpdated(address indexed account,uint256 balance)']);
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
const eq=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
if(c.chainId!==31611||await p.getChainId()!==31611||!eq(flow.owner,'0x25Db120d4c36977E57cb360f30E6C6028b8d3935'))throw Error('Dedicated Mezo testnet proof only.');
async function canonical(hash){const [tx,r]=await Promise.all([p.getTransaction({hash}),p.getTransactionReceipt({hash})]);if(r.status!=='success'||tx.value!==0n||!eq(tx.from,flow.owner)||(await p.getBlock({blockNumber:r.blockNumber})).hash!==r.blockHash)throw Error('Canonical owner action missing.');return {tx,r};}
const deployment=await canonical(flow.transactions.guardDeploy.hash);
if(deployment.tx.to||!eq(deployment.r.contractAddress,flow.guard)||deployment.tx.input!==encodeDeployData({abi:guardArtifact.abi,bytecode:guardArtifact.bytecode.object,args:[c.factory,flow.account]}))throw Error('Guard source/constructor deployment mismatch.');
const {tx,r}=await canonical(flow.transactions.guardRedeem.hash),block=r.blockNumber;
if(!eq(tx.to,flow.guard)||decodeFunctionData({abi:guardArtifact.abi,data:tx.input}).functionName!=='redeem')throw Error('Wrong guarded redemption call.');
if(keccak256(await p.getCode({address:c.factory,blockNumber:block}))!==c.factoryCodeHash)throw Error('Factory code mismatch.');
const registered=await p.readContract({address:c.factory,abi:parseAbi(['function isAccount(address) view returns(bool)']),functionName:'isAccount',args:[flow.account],blockNumber:block});
const read=(address,abi,functionName,args=[],blockNumber=block)=>p.readContract({address,abi,functionName,args,blockNumber});
const [owner,manager]=await Promise.all([read(flow.account,accountAbi,'owner'),read(c.borrowerOperations,native,'troveManager')]);
const pool=await read(manager,native,'collSurplusPool');
if(!registered||!eq(owner,flow.owner)||!eq(await read(flow.guard,guardArtifact.abi,'business'),flow.account)||!eq(await read(flow.guard,guardArtifact.abi,'owner'),owner)||!eq(await read(flow.guard,guardArtifact.abi,'manager'),manager)||!eq(await read(flow.guard,guardArtifact.abi,'pool'),pool))throw Error('Guard/account/native binding mismatch.');
const decode=(address,abi)=>r.logs.filter(l=>eq(l.address,address)).flatMap(l=>{try{return [decodeEventLog({abi,data:l.data,topics:l.topics})];}catch{return [];}});
const guarded=decode(flow.guard,guardArtifact.abi).find(e=>e.eventName==='OwnBorrowerRedeemed');
const nativeLogs=decode(manager,native),redemption=nativeLogs.find(e=>e.eventName==='Redemption'),updates=nativeLogs.filter(e=>e.eventName==='TroveUpdated');
if(!guarded||!eq(guarded.args.business,flow.account)||!redemption||redemption.args.actual!==guarded.args.amount||!updates.length||updates.some(e=>!eq(e.args.borrower,flow.account))||!updates.some(e=>e.args.principal===0n&&e.args.collateral===0n))throw Error('Single owned-borrower redemption not proven.');
const [beforeSurplus,afterSurplus,status,guardBefore,guardAfter,musdBefore,musdAfter,businessBefore,businessAfter,oldLoan]=await Promise.all([
 read(pool,native,'getCollateral',[flow.account],block-1n),read(pool,native,'getCollateral',[flow.account]),read(manager,native,'getTroveStatus',[flow.account]),
 p.getBalance({address:flow.guard,blockNumber:block-1n}),p.getBalance({address:flow.guard,blockNumber:block}),read(c.musd,tokenAbi,'balanceOf',[flow.guard],block-1n),read(c.musd,tokenAbi,'balanceOf',[flow.guard]),p.getBalance({address:flow.account,blockNumber:block-1n}),p.getBalance({address:flow.account,blockNumber:block}),read(manager,native,'getEntireDebtAndColl',[flow.account],block-1n)]);
if(beforeSurplus!==0n||afterSurplus<=0n||afterSurplus!==guarded.args.surplus||status!==4n||musdBefore-musdAfter!==guarded.args.amount||businessAfter!==businessBefore||businessAfter!==0n||guardAfter-guardBefore!==redemption.args.collateralSent-redemption.args.collateralFee||oldLoan[0]!==afterSurplus+redemption.args.collateralSent)throw Error('Exact native surplus/redemption accounting mismatch.');
const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,owner,account:flow.account,guard:flow.guard,factory:c.factory,manager,pool,guardDeployment:{hash:deployment.tx.hash,block:deployment.r.blockNumber,source:'contracts/qa/OwnedSurplusGuard.sol',deployedCodeHash:keccak256(await p.getCode({address:flow.guard,blockNumber:block}))},redemption:{hash:tx.hash,block,amount:guarded.args.amount,collateralDrawn:redemption.args.collateralSent,protocolCollateralFee:redemption.args.collateralFee,redeemerBtcReceived:guardAfter-guardBefore,gasUsed:r.gasUsed},beforeSurplus,afterSurplus,statusAfter:status,borrowersUpdated:[...new Set(updates.map(e=>e.args.borrower))],nativeCollateralBefore:oldLoan[0],businessBtcBefore:businessBefore,businessBtcAfter:businessAfter,scope:'Real public-testnet redemption touched only the dedicated owned borrower and created positive native surplus. Surplus is not yet claimed at this snapshot. Test funds are recycled QA assets, not customer activity.'};
await writeFile('deployments/wave2-surplus-redemption.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n');
console.log(JSON.stringify({verified:true,redemption:tx.hash,account:flow.account,surplusBtcWei:String(afterSurplus),onlyBorrowerUpdated:flow.account}));process.exit(0);
