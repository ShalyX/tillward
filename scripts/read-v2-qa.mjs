// Read-only fixed-block owner/account preflight for public Mezo testnet QA.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,parseAbi,zeroAddress,formatUnits} from 'viem';
import {readServiceState} from '../src/service-fees.mjs';
import {readWithRetry} from '../src/read-retry.mjs';
const c=JSON.parse(await readFile('public/deployment-v2.json','utf8'));
const owner='0x1dcb045123730e606a88380bce534332f50332d2';
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
if(c.chainId!==31611||c.accountVersion!==2||await p.getChainId()!==31611)throw Error('Expected V2 Mezo testnet deployment.');
const block=await p.getBlockNumber({cacheTime:0});
const factoryAbi=parseAbi(['function accountOf(address) view returns(address)','function isAccount(address) view returns(bool)']);
const abi=JSON.parse(await readFile('out/RevenueAccountV2.sol/RevenueAccountV2.json','utf8')).abi;
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)']);
const account=await readWithRetry(()=>p.readContract({address:c.factory,abi:factoryAbi,functionName:'accountOf',args:[owner],blockNumber:block}));
const [ownerBTC,ownerMUSD]=await Promise.all([p.getBalance({address:owner,blockNumber:block}),p.readContract({address:c.musd,abi:tokenAbi,functionName:'balanceOf',args:[owner],blockNumber:block})]);
let state;
if(account!==zeroAddress){
 const names=['owner','debtState','pendingRepayment','cashFloor','repaymentBps','totalRepaid','invoiceCount','retainedReceiptFunds','totalFeesPaid'];
 const values=await Promise.all(names.map(functionName=>readWithRetry(()=>p.readContract({address:account,abi,functionName,blockNumber:block}))));
 if(values[0].toLowerCase()!==owner.toLowerCase()||!await p.readContract({address:c.factory,abi:factoryAbi,functionName:'isAccount',args:[account],blockNumber:block}))throw Error('V2 owner/registry mismatch.');
 const quote=await p.readContract({address:account,abi,functionName:'repaymentQuote',blockNumber:block});
 const fees=await readServiceState(p,c,account,block,quote[0]);
 const balance=await p.readContract({address:c.musd,abi:tokenAbi,functionName:'balanceOf',args:[account],blockNumber:block});
 state={owner:values[0],debt:values[1][0],collateral:values[1][1],minimum:values[1][2],reserve:values[1][3],active:values[1][4],pending:values[2],floor:values[3],bps:values[4],repaid:values[5],invoiceCount:values[6],retainedReceiptFunds:values[7],totalFeesPaid:values[8],balance,fees};
}
const report={observedAt:new Date().toISOString(),chainId:31611,block,owner,account,ownerBTC,ownerMUSD,state};
const text=JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v,2);
if(process.argv[2])await writeFile(process.argv[2],text+'\n');
console.log(text);console.log(JSON.stringify({ownerBTC:formatUnits(ownerBTC,18),ownerMUSD:formatUnits(ownerMUSD,18)}));process.exit(0);
