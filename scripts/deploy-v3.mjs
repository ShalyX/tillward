// Explicitly authorized Mezo TESTNET deployment. Secrets and signed intent stay outside Git.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createPublicClient,createWalletClient,http,webSocket,fallback,defineChain,encodeDeployData,keccak256,parseTransaction,recoverTransactionAddress,parseAbi,isAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {readWithRetry} from '../src/read-retry.mjs';
const walletPath=resolve(process.argv[2]||''),treasury=process.argv[3];
if(!isAddress(treasury||'')||walletPath.startsWith(resolve('.')+'\\'))throw Error('Provide an external dedicated test wallet and explicit treasury.');
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
if(treasury.toLowerCase()!=='0x1dcb045123730e606a88380bce534332f50332d2')throw Error('Approved testnet treasury only.');
if(c.chainId!==31611)throw Error('Mezo testnet only.');
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const transport=fallback([webSocket(c.ws,{timeout:20000,retryCount:1}),http(c.rpc,{timeout:20000,retryCount:1})]);
const p=createPublicClient({chain,transport});
if(await p.getChainId()!==31611)throw Error('RPC chain mismatch.');
const signer=privateKeyToAccount(JSON.parse(await readFile(walletPath,'utf8')).privateKey);
if(signer.address.toLowerCase()!=='0x25db120d4c36977e57cb360f30e6c6028b8d3935')throw Error('Dedicated QA signer only.');
const w=createWalletClient({chain,transport,account:signer});
const artifact=JSON.parse(await readFile('out/RevenueFactoryV3.sol/RevenueFactoryV3.json','utf8'));
const data=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode.object,args:[c.borrowerOperations,treasury]});
const journalPath=resolve(dirname(walletPath),'tillward-v3-deploy-intent.json');
let journal;try{journal=JSON.parse(await readFile(journalPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(!journal){
 const estimate=await p.estimateGas({account:signer.address,data}),gas=estimate*12n/10n,gasPrice=await p.getGasPrice();
 if(gas>12000000n||gas*gasPrice>20000000000000n)throw Error('Deployment gas cap exceeded.');
 if(await p.getBalance({address:signer.address})<gas*gasPrice)throw Error('Insufficient dedicated test BTC.');
 const request=await w.prepareTransactionRequest({data,gas,gasPrice,type:'legacy',value:0n});
 const latest=await p.getTransactionCount({address:signer.address,blockTag:'latest'});
 if(await p.getTransactionCount({address:signer.address,blockTag:'pending'})!==latest)throw Error('Unreconciled nonce.');
 const raw=await w.signTransaction({...request,account:signer});
 journal={chainId:31611,hash:keccak256(raw),raw,treasury,createdAt:new Date().toISOString()};
 await writeFile(journalPath,JSON.stringify(journal,null,2)+'\n',{flag:'wx',mode:0o600});
}
const tx=parseTransaction(journal.raw);
if(journal.hash!==keccak256(journal.raw)||Number(tx.chainId)!==31611||tx.to||tx.data!==data||(tx.value??0n)!==0n||
 (await recoverTransactionAddress({serializedTransaction:journal.raw})).toLowerCase()!==signer.address.toLowerCase())throw Error('Saved deployment intent mismatch.');
let receipt;try{receipt=await p.getTransactionReceipt({hash:journal.hash});}catch{}
if(!receipt){
 let known;try{known=await p.getTransaction({hash:journal.hash});}catch{}
 if(!known)await p.sendRawTransaction({serializedTransaction:journal.raw});
 console.log(JSON.stringify({state:'submitted',hash:journal.hash,treasury}));
 receipt=await p.waitForTransactionReceipt({hash:journal.hash,confirmations:2,timeout:180000});
}
if(receipt.status!=='success'||!receipt.contractAddress)throw Error('Deployment failed. Saved intent retained.');
if((await p.getBlock({blockNumber:receipt.blockNumber})).hash!==receipt.blockHash)throw Error('Deployment receipt is not canonical.');
const factory=receipt.contractAddress,abi=parseAbi(['function borrowerOperations() view returns(address)','function feeTreasury() view returns(address)']);
const [code,operations,recipient]=await Promise.all([readWithRetry(()=>p.getCode({address:factory})),p.readContract({address:factory,abi,functionName:'borrowerOperations'}),p.readContract({address:factory,abi,functionName:'feeTreasury'})]);
if(!code||operations.toLowerCase()!==c.borrowerOperations.toLowerCase()||recipient.toLowerCase()!==treasury.toLowerCase())throw Error('Deployed terms mismatch.');
if(c.accountVersion===3&&c.factory.toLowerCase()!==factory.toLowerCase())throw Error('Different V3 factory already configured.');
const {legacyDeployments:previousLegacy=[],...previous}=c;
const legacy=c.accountVersion===3?previousLegacy:[previous,...previousLegacy];
const next={...c,accountVersion:3,feeTreasury:treasury,factory,factoryCodeHash:keccak256(code),deploymentBlock:Number(receipt.blockNumber),lastVerifiedBlock:Number(receipt.blockNumber),deploymentTransaction:journal.hash,deployer:signer.address,legacyDeployments:legacy};
await writeFile('deployments/testnet-factory-v3.json',JSON.stringify({...next,verifiedAt:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({state:'verified_staged',chainId:31611,factory,treasury,hash:journal.hash,block:Number(receipt.blockNumber)}));process.exit(0);
