// Create and fund a dedicated TEST BTC gas wallet. Keys/journal live outside the repo.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {createPublicClient,createWalletClient,defineChain,webSocket,keccak256} from 'viem';
const path=resolve(process.argv[2]||''),ownerPath=process.argv[3];
if(!ownerPath||path.startsWith(resolve('.')+'/'))throw Error('Provide external keeper and dedicated test-owner wallet paths.');
let key;try{key=JSON.parse(await readFile(path,'utf8')).privateKey;}catch(e){if(e.code!=='ENOENT')throw e;key=generatePrivateKey();await writeFile(path,JSON.stringify({address:privateKeyToAccount(key).address,privateKey:key}),{mode:0o600,flag:'wx'});}
const account=privateKeyToAccount(key);console.log(JSON.stringify({keeper:account.address}));
const c=JSON.parse(await readFile('public/deployment.json','utf8'));if(c.chainId!==31611)throw Error('Testnet only.');
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const transport=webSocket(c.ws,{timeout:15000,retryCount:1});const p=createPublicClient({chain,transport});
const signer=privateKeyToAccount(JSON.parse(await readFile(ownerPath,'utf8')).privateKey);
const w=createWalletClient({chain,transport,account:signer});
if(await p.getChainId()!==31611)throw Error('Chain mismatch.');
const head=await p.getBlockNumber({cacheTime:0});if(head<BigInt(c.lastVerifiedBlock))throw Error('Stale RPC; no funding signed.');
const journalPath=resolve(dirname(path),'keeper-funding.json');let journal;
try{journal=JSON.parse(await readFile(journalPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(!journal){const request=await w.prepareTransactionRequest({to:account.address,value:100000000000000n,gas:50000n});const raw=await w.signTransaction(request);journal={hash:keccak256(raw),raw,to:account.address};await writeFile(journalPath,JSON.stringify(journal),{mode:0o600,flag:'wx'});}
if(journal.to!==account.address)throw Error('Funding target mismatch.');
let receipt;try{receipt=await p.getTransactionReceipt({hash:journal.hash});}catch{}
if(!receipt){await p.sendRawTransaction({serializedTransaction:journal.raw});receipt=await p.waitForTransactionReceipt({hash:journal.hash,timeout:90000});}
if(receipt.status!=='success')throw Error('Funding reverted.');console.log(JSON.stringify({funded:account.address,hash:journal.hash,block:Number(receipt.blockNumber),testBtc:'0.0001'}));process.exit(0);
