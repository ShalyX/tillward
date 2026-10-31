// Read-only, fixed-block Mezo testnet evidence. No wallet or signing.
import {readFile,writeFile} from 'node:fs/promises';
import {createPublicClient,http,webSocket,fallback,isAddress,parseAbi} from 'viem';
import {readLoanRisk,loanRiskStatus} from '../src/loan-risk.mjs';
const config=JSON.parse(await readFile('public/deployment.json','utf8'));
const account=process.argv.slice(2).find(arg=>!arg.startsWith('--'))??'0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5';
if(config.chainId!==31611||!isAddress(account))throw Error('Valid Mezo testnet account required.');
const client=createPublicClient({transport:fallback([...(config.ws?[webSocket(config.ws,{timeout:20000,retryCount:1})]:[]),http(config.rpc,{timeout:20000,retryCount:1})])});
if(await client.getChainId()!==31611)throw Error('RPC chain mismatch.');
const block=await client.getBlockNumber({cacheTime:0});
const risk=await readLoanRisk(client,config,account,block);
const active=await client.readContract({address:risk.manager,abi:parseAbi(['function getTroveStatus(address) view returns(uint256)']),functionName:'getTroveStatus',args:[account],blockNumber:block})===1n;
const result={checkedAt:new Date().toISOString(),chainId:31611,account,active,...risk,status:loanRiskStatus(risk,active)};
const json=JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';
if(process.argv.includes('--save'))await writeFile('deployments/wave2-loan-risk.json',json);
console.log(json);
// This one-shot CLI has finished all reads/writes; release WebSocket listeners.
process.exit(0);
