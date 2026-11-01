// Read-only proof of an actual native surplus claim, distinct from loan closure.
// Usage: node scripts/verify-surplus-claim.mjs <transaction-hash>
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,decodeFunctionData,parseAbi,keccak256} from 'viem';
const hash=process.argv[2];if(!/^0x[0-9a-fA-F]{64}$/.test(hash??''))throw Error('Pass the confirmed claimSurplus transaction hash.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
if(c.chainId!==31611)throw Error('Mezo testnet only.');
const abi=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8')).abi;
const native=parseAbi(['function troveManager() view returns(address)','function collSurplusPool() view returns(address)','function getCollateral(address) view returns(uint256)','function isAccount(address) view returns(bool)']);
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
if(await p.getChainId()!==31611)throw Error('RPC chain mismatch.');
const [tx,receipt]=await Promise.all([p.getTransaction({hash}),p.getTransactionReceipt({hash})]);
if(receipt.status!=='success'||!tx.to||tx.value!==0n||tx.blockHash!==receipt.blockHash||decodeFunctionData({abi,data:tx.input}).functionName!=='claimSurplus')throw Error('Not a successful account surplus claim.');
const block=receipt.blockNumber;
if((await p.getBlock({blockNumber:block})).hash!==receipt.blockHash)throw Error('Receipt is not canonical.');
const read=(address,functionName,args=[],blockNumber=block,readAbi=native)=>p.readContract({address,abi:readAbi,functionName,args,blockNumber});
const [code,registered,owner,operations,manager]=await Promise.all([
 p.getCode({address:c.factory,blockNumber:block}),read(c.factory,'isAccount',[tx.to]),
 read(tx.to,'owner',[],block,abi),read(tx.to,'borrowerOperations',[],block,abi),read(c.borrowerOperations,'troveManager')
]);
if(!code||keccak256(code)!==c.factoryCodeHash||!registered||owner.toLowerCase()!==tx.from.toLowerCase()||operations.toLowerCase()!==c.borrowerOperations.toLowerCase())throw Error('Factory, owner or native protocol mismatch.');
const pool=await read(manager,'collSurplusPool');
const [entitlementBefore,entitlementAfter,btcBefore,btcAfter]=await Promise.all([
 read(pool,'getCollateral',[tx.to],block-1n),read(pool,'getCollateral',[tx.to]),
 p.getBalance({address:tx.to,blockNumber:block-1n}),p.getBalance({address:tx.to,blockNumber:block})
]);
if(entitlementBefore<=0n||entitlementAfter!==0n||btcAfter-btcBefore!==entitlementBefore)throw Error('Positive native entitlement and exact account BTC increase not proven. Inspect other activity in this block.');
const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,readOnly:true,account:tx.to,owner,transaction:hash,block,blockHash:receipt.blockHash,pool,entitlementBefore,entitlementAfter,accountBtcBefore:btcBefore,accountBtcAfter:btcAfter,claimedBtcWei:entitlementBefore,limitation:'Claim returns BTC to the business account; owner withdrawal is a separate action. No mainnet or customer-usage claim.'};
await writeFile('deployments/wave2-surplus-claim.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
console.log(JSON.stringify({verified:true,transaction:hash,block:String(block),claimedBtcWei:String(entitlementBefore)}));process.exit(0);
