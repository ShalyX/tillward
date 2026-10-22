// Dedicated sample-customer test wallet only. No owner keys are sent to the keeper.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createPublicClient,createWalletClient,defineChain,webSocket,encodeFunctionData,keccak256,zeroAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
const walletPath=process.argv[2];if(!walletPath)throw Error('Provide dedicated TESTNET sample-customer wallet path.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));if(c.chainId!==31611)throw Error('Testnet only.');
const signer=privateKeyToAccount(JSON.parse(await readFile(resolve(walletPath),'utf8')).privateKey);
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const transport=webSocket(c.ws,{timeout:15000,retryCount:1}),p=createPublicClient({chain,transport}),w=createWalletClient({chain,transport,account:signer});
const {abi}=JSON.parse(await readFile('out/RevenueFactory.sol/RevenueFactory.json','utf8'));
if(await p.getChainId()!==31611||await p.getBlockNumber({cacheTime:0})<BigInt(c.lastVerifiedBlock))throw Error('Unsynchronized testnet.');
if(keccak256(await p.getCode({address:c.factory}))!==c.factoryCodeHash)throw Error('Factory mismatch.');
let account=await p.readContract({address:c.factory,abi,functionName:'accountOf',args:[signer.address]});
const path=resolve(dirname(resolve(walletPath)),'keeper-enrollment-creation.json');let transaction;
try{transaction=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(account===zeroAddress){
 if(!transaction){
  await p.simulateContract({account:signer,address:c.factory,abi,functionName:'createAccount'});
  const request=await w.prepareTransactionRequest({to:c.factory,data:encodeFunctionData({abi,functionName:'createAccount'}),gas:4500000n});
  const raw=await w.signTransaction(request);transaction={hash:keccak256(raw),raw};await writeFile(path,JSON.stringify(transaction),{mode:0o600,flag:'wx'});
 }
 let receipt;try{receipt=await p.getTransactionReceipt({hash:transaction.hash});}catch{}
 if(!receipt){await p.sendRawTransaction({serializedTransaction:transaction.raw});receipt=await p.waitForTransactionReceipt({hash:transaction.hash,timeout:90000});}
 if(receipt.status!=='success')throw Error('Account creation reverted.');
 account=await p.readContract({address:c.factory,abi,functionName:'accountOf',args:[signer.address],blockNumber:receipt.blockNumber});
}
if(account===zeroAddress)throw Error('Account not registered.');
console.log(JSON.stringify({account,owner:signer.address,creation:transaction?.hash,awaitingAutomaticEnrollment:true}));process.exit(0);
