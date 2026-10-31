// Read-only preflight for a user-driven browser QA session. Never signs.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,webSocket,http,fallback,isAddress,keccak256,parseAbi} from 'viem';
import {snapshotFreshness} from '../src/transaction-recovery.mjs';
const [owner,account,output]=process.argv.slice(2);
if(!isAddress(owner||'')||!isAddress(account||''))throw Error('Pass the public owner and business account addresses.');
const config=JSON.parse(await readFile('public/deployment.json','utf8'));
const artifact=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8'));
const factoryAbi=parseAbi(['function isAccount(address) view returns(bool)','function accountOf(address) view returns(address)']);
const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','function allowance(address,address) view returns(uint256)']);
const client=createPublicClient({transport:fallback([webSocket(config.ws,{timeout:15000,retryCount:1}),http(config.rpc,{timeout:15000,retryCount:1})])});
if(await client.getChainId()!==31611)throw Error('Wrong chain.');
const head=await client.getBlockNumber({cacheTime:0}),block=await client.getBlock({blockNumber:head});
if(!snapshotFreshness(block.timestamp).fresh)throw Error('Stale chain snapshot.');
const code=await client.getCode({address:config.factory,blockNumber:head});
if(!code||keccak256(code)!==config.factoryCodeHash)throw Error('Factory fingerprint mismatch.');
const read=(functionName,args=[])=>client.readContract({address:account,abi:artifact.abi,functionName,args,blockNumber:head});
const [registered,mapped,actualOwner,debt,btc,musd,held,collected,repaid,pending,quote,count,allowance]=await Promise.all([
 client.readContract({address:config.factory,abi:factoryAbi,functionName:'isAccount',args:[account],blockNumber:head}),
 client.readContract({address:config.factory,abi:factoryAbi,functionName:'accountOf',args:[owner],blockNumber:head}),
 read('owner'),read('debtState'),client.getBalance({address:owner,blockNumber:head}),
 client.readContract({address:config.musd,abi:tokenAbi,functionName:'balanceOf',args:[owner],blockNumber:head}),
 client.readContract({address:config.musd,abi:tokenAbi,functionName:'balanceOf',args:[account],blockNumber:head}),
 read('totalCollected'),read('totalRepaid'),read('pendingRepayment'),read('repaymentQuote'),read('invoiceCount'),
 client.readContract({address:config.musd,abi:tokenAbi,functionName:'allowance',args:[owner,account],blockNumber:head})
]);
if(!registered||mapped.toLowerCase()!==account.toLowerCase()||actualOwner.toLowerCase()!==owner.toLowerCase())throw Error('Owner/factory account mismatch.');
const result={observedAt:new Date().toISOString(),chainId:31611,block:head,owner,account,walletBtc:btc,walletMusd:musd,accountMusd:held,debtState:debt,totalCollected:collected,totalRepaid:repaid,pendingRepayment:pending,repaymentQuote:quote,invoiceCount:count,allowance,readOnly:true};
const json=JSON.stringify(result,(_,value)=>typeof value==='bigint'?value.toString():value,2);
if(output)await writeFile(output,json+'\n');
console.log(json);process.exit(0);
