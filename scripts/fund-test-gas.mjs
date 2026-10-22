import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createPublicClient,createWalletClient,defineChain,webSocket,isAddress,keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
const [ownerPath,to]=process.argv.slice(2);if(!ownerPath||!isAddress(to||''))throw Error('Provide dedicated test-wallet path and target.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));if(c.chainId!==31611)throw Error('Testnet only.');
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const transport=webSocket(c.ws,{timeout:15000,retryCount:1}),p=createPublicClient({chain,transport});
const signer=privateKeyToAccount(JSON.parse(await readFile(ownerPath,'utf8')).privateKey),w=createWalletClient({chain,transport,account:signer});
if(await p.getChainId()!==31611||await p.getBlockNumber({cacheTime:0})<BigInt(c.lastVerifiedBlock))throw Error('RPC unsynchronized.');
const path=resolve(dirname(resolve(ownerPath)),`gas-funding-${to.toLowerCase()}.json`);let tx;
try{tx=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(!tx){const request=await w.prepareTransactionRequest({to,value:100000000000000n,gas:50000n});const raw=await w.signTransaction(request);tx={to,hash:keccak256(raw),raw};await writeFile(path,JSON.stringify(tx),{flag:'wx',mode:0o600});}
let r;try{r=await p.getTransactionReceipt({hash:tx.hash});}catch{}
if(!r){await p.sendRawTransaction({serializedTransaction:tx.raw});r=await p.waitForTransactionReceipt({hash:tx.hash,timeout:90000});}
if(r.status!=='success')throw Error('Funding reverted.');console.log(JSON.stringify({to,hash:tx.hash,block:Number(r.blockNumber),testBtc:'0.0001'}));process.exit(0);
