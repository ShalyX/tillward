// Dedicated TESTNET wallet only. Pass a local wallet JSON path, never a key on the command line.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createPublicClient,createWalletClient,defineChain,http,keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
const walletPath=process.argv[2];if(!walletPath)throw new Error('Provide the dedicated local test wallet JSON path.');
const secret=JSON.parse(await readFile(resolve(walletPath),'utf8'));
const account=privateKeyToAccount(secret.privateKey);
const path='public/deployment.json',config=JSON.parse(await readFile(path,'utf8'));
if(config.chainId!==31611)throw new Error('Deployment restricted to Mezo TESTNET.');
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[config.rpc]}}});
const p=createPublicClient({chain,transport:http(config.rpc,{timeout:25000,retryCount:2})});
const w=createWalletClient({chain,account,transport:http(config.rpc,{timeout:25000,retryCount:0})});
if(await p.getChainId()!==31611)throw new Error('RPC chain mismatch.');
const artifact=JSON.parse(await readFile('out/RevenueFactory.sol/RevenueFactory.json','utf8'));
const balance=await p.getBalance({address:account.address});if(balance===0n)throw new Error('Dedicated test wallet is not funded.');
await mkdir('deployments',{recursive:true});
let journal;try{journal=JSON.parse(await readFile('deployments/testnet-journal.json','utf8'));}catch{}
if(config.factory){const code=await p.getCode({address:config.factory});if(code&&keccak256(code)===config.factoryCodeHash){console.log(JSON.stringify({factory:config.factory,status:'already deployed'}));process.exit(0);}throw new Error('Existing deployment code mismatch.');}
if(!journal?.hash){const hash=await w.deployContract({abi:artifact.abi,bytecode:artifact.bytecode.object,args:[config.borrowerOperations]});journal={hash,deployer:account.address,chainId:31611,createdAt:new Date().toISOString()};await writeFile('deployments/testnet-journal.json',JSON.stringify(journal,null,2));console.log('Factory transaction submitted:',hash);}
const receipt=await p.waitForTransactionReceipt({hash:journal.hash,confirmations:1,timeout:180000});
if(receipt.status!=='success'||!receipt.contractAddress)throw new Error('Factory deployment reverted. Inspect the saved transaction; do not automatically deploy again.');
const code=await p.getCode({address:receipt.contractAddress});if(!code)throw new Error('Deployment receipt has no runtime code.');
Object.assign(config,{factory:receipt.contractAddress,factoryCodeHash:keccak256(code),deploymentBlock:Number(receipt.blockNumber),deployer:account.address,deploymentTransaction:receipt.transactionHash});
await writeFile(path,JSON.stringify(config,null,2)+'\n');
await writeFile('deployments/testnet-factory.json',JSON.stringify({...config,verifiedAt:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({status:'confirmed',chainId:31611,factory:config.factory,transaction:receipt.transactionHash,block:config.deploymentBlock}));
