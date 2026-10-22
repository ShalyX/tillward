// Permissionless TESTNET settlement executor. Its wallet pays gas; the contract owns all financial authority.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createPublicClient,createWalletClient,defineChain,http,keccak256,encodeFunctionData,isAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {readWithRetry} from '../src/read-retry.mjs';
import {insertionHints} from '../src/native-hints.mjs';

export function settlementPlan(quote,maximum=1000n*10n**18n){
 if(typeof quote!=='bigint'||typeof maximum!=='bigint'||quote<0n||maximum<=0n)throw new Error('Invalid settlement bounds.');
 return {amount:quote<maximum?quote:maximum,eligible:quote>0n};
}
async function main(){
 const walletPath=process.argv[2],target=process.argv[3];
 if(!walletPath||!isAddress(target||''))throw new Error('Usage: node scripts/keeper.mjs <dedicated-test-wallet.json> <registered-account> [--watch]');
 const c=JSON.parse(await readFile('public/deployment.json','utf8'));if(c.chainId!==31611)throw new Error('Testnet only.');
 const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
 const p=createPublicClient({chain,transport:http(c.rpc,{timeout:20000,retryCount:1})});
 const signer=privateKeyToAccount(JSON.parse(await readFile(resolve(walletPath),'utf8')).privateKey);
 const w=createWalletClient({chain,account:signer,transport:http(c.rpc,{timeout:20000,retryCount:1})});
 const factory=JSON.parse(await readFile('out/RevenueFactory.sol/RevenueFactory.json','utf8'));
 const artifact=JSON.parse(await readFile('out/RevenueAccount.sol/RevenueAccount.json','utf8'));
 const journalPath=resolve(dirname(resolve(walletPath)),'paydown-keeper-journal.json');
 let journal={};try{journal=JSON.parse(await readFile(journalPath,'utf8'));}catch{}
 async function once(){
  if(await p.getChainId()!==31611)throw new Error('Chain mismatch.');
  const code=await p.getCode({address:c.factory});if(!code||keccak256(code)!==c.factoryCodeHash)throw new Error('Factory code mismatch.');
  if(!await readWithRetry(()=>p.readContract({address:c.factory,abi:factory.abi,functionName:'isAccount',args:[target]})))throw new Error('Unregistered account.');
  if(!journal.pending){
   const [quote,reason]=await readWithRetry(()=>p.readContract({address:target,abi:artifact.abi,functionName:'repaymentQuote'}));
   const plan=settlementPlan(quote);if(!plan.eligible){console.log(JSON.stringify({state:'deferred',reason,account:target}));return;}
   const args=[plan.amount,...await insertionHints(p,c,target,'repay',plan.amount)];
   await p.simulateContract({account:signer,address:target,abi:artifact.abi,functionName:'settle',args});
   const request=await w.prepareTransactionRequest({account:signer,to:target,data:encodeFunctionData({abi:artifact.abi,functionName:'settle',args}),gas:800000n});
   const raw=await w.signTransaction(request);journal.pending={chainId:31611,account:target,hash:keccak256(raw),raw};
   await writeFile(journalPath,JSON.stringify(journal,null,2));
  }
  if(journal.pending.account.toLowerCase()!==target.toLowerCase())throw new Error('Another account has a pending keeper transaction. Reconcile it first.');
  const tx=journal.pending;let seen;try{seen=await p.getTransaction({hash:tx.hash});}catch{}
  if(!seen)await p.sendRawTransaction({serializedTransaction:tx.raw});
  const receipt=await p.waitForTransactionReceipt({hash:tx.hash,timeout:120000});
  journal.last={hash:tx.hash,status:receipt.status,block:Number(receipt.blockNumber)};journal.pending=null;
  await writeFile(journalPath,JSON.stringify(journal,null,2));
  if(receipt.status!=='success')throw new Error('Keeper transaction reverted; allocation remains onchain.');
  console.log(JSON.stringify({state:'confirmed',...journal.last}));
 }
 do{try{await once();}catch(e){console.error(e.shortMessage||e.message);if(!process.argv.includes('--watch'))process.exitCode=1;}if(!process.argv.includes('--watch'))break;await new Promise(r=>setTimeout(r,30000));}while(true);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
