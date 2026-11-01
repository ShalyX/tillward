// Independent read-only evidence for an owner-approved public-testnet top-up.
// Usage: node scripts/verify-collateral-topup.mjs <transaction-hash>
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,decodeFunctionData,parseAbi,keccak256} from 'viem';
import {readLoanRisk} from '../src/loan-risk.mjs';
const hash=process.argv[2];
if(!/^0x[0-9a-fA-F]{64}$/.test(hash??''))throw Error('Pass the confirmed addCollateral transaction hash.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
if(c.chainId!==31611)throw Error('Mezo testnet only.');
const abi=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8')).abi;
const p=createPublicClient({transport:fallback([webSocket(c.ws,{timeout:15000,retryCount:1}),http(c.rpc,{timeout:15000,retryCount:1})])});
if(await p.getChainId()!==31611)throw Error('RPC chain mismatch.');
const [tx,receipt]=await Promise.all([p.getTransaction({hash}),p.getTransactionReceipt({hash})]);
if(receipt.status!=='success'||!tx.to||tx.value<=0n||tx.blockHash!==receipt.blockHash)throw Error('Missing successful, value-bearing transaction.');
if(decodeFunctionData({abi,data:tx.input}).functionName!=='addCollateral')throw Error('Transaction is not an account collateral top-up.');
const block=receipt.blockNumber;
const canonical=await p.getBlock({blockNumber:block});
if(canonical.hash!==receipt.blockHash)throw Error('Receipt is not canonical.');
const factoryAbi=parseAbi(['function isAccount(address) view returns(bool)']);
const read=(functionName,blockNumber)=>p.readContract({address:tx.to,abi,functionName,blockNumber});
const [code,registered,owner,operations,before,after,risk]=await Promise.all([
 p.getCode({address:c.factory,blockNumber:block}),
 p.readContract({address:c.factory,abi:factoryAbi,functionName:'isAccount',args:[tx.to],blockNumber:block}),
 read('owner',block),read('borrowerOperations',block),read('debtState',block-1n),read('debtState',block),
 readLoanRisk(p,c,tx.to,block)
]);
if(!code||keccak256(code)!==c.factoryCodeHash||!registered||owner.toLowerCase()!==tx.from.toLowerCase()||operations.toLowerCase()!==c.borrowerOperations.toLowerCase())throw Error('Factory, owner or native protocol mismatch.');
if(!before[4]||!after[4]||after[1]-before[1]!==tx.value)throw Error('Active native collateral delta does not equal the exact top-up. Inspect other activity in this block.');
const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,readOnly:true,account:tx.to,owner,transaction:hash,block,blockHash:receipt.blockHash,addedBtcWei:tx.value,collateralBefore:before[1],collateralAfter:after[1],debtBefore:before[0],debtAfter:after[0],risk,limitation:'Canonical parent/post-block collateral evidence; not proof of surplus claiming, customer usage, or mainnet readiness.'};
await writeFile('deployments/wave2-collateral-topup.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
console.log(JSON.stringify({verified:true,transaction:hash,block:String(block),addedBtcWei:String(tx.value)}));
process.exit(0);
