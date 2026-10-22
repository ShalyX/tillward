// Read-only verification of the account created through the visible Rabby browser session.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,defineChain,webSocket,parseAbi} from 'viem';
const c=JSON.parse(await readFile('public/deployment.json','utf8'));
const chain=defineChain({id:31611,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[c.rpc]}}});
const p=createPublicClient({chain,transport:webSocket(c.ws,{timeout:15000,retryCount:1})});
const abi=parseAbi(['function accountOf(address) view returns(address)','event AccountCreated(address indexed owner,address indexed account)']);
const owner='0x1dcb045123730e606a88380bce534332f50332d2';
if(await p.getChainId()!==31611)throw Error('Chain mismatch.');
const account=await p.readContract({address:c.factory,abi,functionName:'accountOf',args:[owner],blockNumber:16298853n});
const logs=await p.getLogs({address:c.factory,event:abi[1],args:{owner},fromBlock:16298853n,toBlock:16298853n});
if(logs.length!==1||logs[0].args.account.toLowerCase()!==account.toLowerCase())throw Error('Account event mismatch.');
const receipt=await p.getTransactionReceipt({hash:logs[0].transactionHash});if(receipt.status!=='success'||receipt.from.toLowerCase()!==owner)throw Error('Creation receipt mismatch.');
const proof={chainId:31611,wallet:'Rabby in Chrome',owner,account,creation:logs[0].transactionHash,block:Number(receipt.blockNumber),observedAt:new Date().toISOString(),browserObserved:'Visible connected owner wallet, account created, 2-of-4 guided setup, zero debt and zero invoices. Network added and transaction approved by owner in Rabby. Extension pages are not accessible to the agent.',remaining:'Browser borrowing/payment/loan exit still separate acceptance scenarios.'};
await writeFile('deployments/browser-wallet-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));process.exit(0);
