// Test-only exit fee/interest buffer from the dedicated demo loan. Never use on mainnet.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createPublicClient,createWalletClient,defineChain,webSocket,encodeFunctionData,keccak256,stringToHex} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {snapshotFreshness} from '../src/transaction-recovery.mjs';
const [ownerPath,recipient]=process.argv.slice(2);if(!ownerPath||recipient?.toLowerCase()!=='0x1dcb045123730e606a88380bce534332f50332d2')throw Error('Dedicated TESTNET owner and sample-customer wallet paths required.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));if(c.chainId!==31611)throw Error('Testnet only.');
const target='0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5',chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const transport=webSocket(c.ws,{timeout:15000,retryCount:1}),p=createPublicClient({chain,transport});
const owner=privateKeyToAccount(JSON.parse(await readFile(ownerPath,'utf8')).privateKey);
if(owner.address.toLowerCase()!=='0x25db120d4c36977e57cb360f30e6c6028b8d3935')throw Error('Dedicated demo wallet required.');
const artifact=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8'));
const tokenAbi=[{type:'function',name:'transfer',stateMutability:'nonpayable',inputs:[{type:'address'},{type:'uint256'}],outputs:[{type:'bool'}]},{type:'function',name:'approve',stateMutability:'nonpayable',inputs:[{type:'address'},{type:'uint256'}],outputs:[{type:'bool'}]}];
const journalPath=resolve(dirname(resolve(ownerPath)),'v2-exit-buffer.json');let journal={};try{journal=JSON.parse(await readFile(journalPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const save=()=>writeFile(journalPath,JSON.stringify(journal,null,2),{mode:0o600});
if(await p.getChainId()!==31611||await p.getBlockNumber({cacheTime:0})<BigInt(c.lastVerifiedBlock))throw Error('Unsynchronized testnet connection.');
if((await p.readContract({address:target,abi:artifact.abi,functionName:'owner'})).toLowerCase()!==owner.address.toLowerCase())throw Error('Owner mismatch.');
async function step(name,signer,address,abi,functionName,args){
 if(!journal[name]){const w=createWalletClient({chain,transport,account:signer});await p.simulateContract({address,abi,functionName,args,account:signer});const request=await w.prepareTransactionRequest({to:address,data:encodeFunctionData({abi,functionName,args}),gas:500000n});const raw=await w.signTransaction(request);journal[name]={hash:keccak256(raw),raw};await save();}
 const tx=journal[name];let r;try{r=await p.getTransactionReceipt({hash:tx.hash});}catch{}
 if(!r){await p.sendRawTransaction({serializedTransaction:tx.raw});r=await p.waitForTransactionReceipt({hash:tx.hash,timeout:90000});}
 if(r.status!=='success')throw Error(name+' reverted');tx.block=Number(r.blockNumber);await save();console.log(JSON.stringify({step:name,hash:tx.hash,block:tx.block}));
}
if(!snapshotFreshness((await p.getBlock({blockTag:'latest'})).timestamp).fresh)throw Error('Stale testnet snapshot.');
const legacy=c.legacyDeployments.find(x=>x.accountVersion===1);
if(!legacy||keccak256(await p.getCode({address:legacy.factory}))!==legacy.factoryCodeHash)throw Error('Legacy source factory mismatch.');
const factoryAbi=[{type:'function',name:'isAccount',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'bool'}]}];
if(!await p.readContract({address:legacy.factory,abi:factoryAbi,functionName:'isAccount',args:[target]}))throw Error('Demo source is not registered.');
await step('withdraw',owner,target,artifact.abi,'withdraw',[5n*10n**18n]);
await step('fundBrowser',owner,c.musd,tokenAbi,'transfer',[recipient,5n*10n**18n]);
console.log(JSON.stringify({recipient,testMusd:'5',purpose:'Browser loan exit fee and interest top-up'}));process.exit(0);
