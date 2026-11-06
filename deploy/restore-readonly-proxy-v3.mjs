// Host-side read-only RPC relay over a private Unix socket; never loads a wallet.
import http from 'node:http';
import {writeFile,chmod,chown} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createPublicClient,http as rpcHttp,webSocket} from 'viem';
const [socketPath,upstream,auditPath]=process.argv.slice(2);
const allowed=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_call','eth_getBalance','eth_getLogs','eth_getTransactionCount','eth_getTransactionReceipt','eth_getTransactionByHash','net_version']);
const client=createPublicClient({transport:upstream.startsWith('wss:')?webSocket(upstream,{timeout:20000,retryCount:1}):rpcHttp(upstream,{timeout:20000,retryCount:1})});
const counts={};
const server=http.createServer(async(request,response)=>{
 try{
  let body='';for await(const chunk of request){body+=chunk;if(body.length>2097152)throw Error('Body too large');}
  const payload=JSON.parse(body),items=Array.isArray(payload)?payload:[payload];
  if(!items.length||items.some(r=>!r||typeof r!=='object'))throw Error('Invalid RPC');
  const results=[];
  for(const item of items){
   const method=item.method;counts[method]=(counts[method]??0)+1;
   if(!allowed.has(method))results.push({jsonrpc:'2.0',id:item.id,error:{code:-32601,message:'Restore drill permits read-only RPC only'}});
   else{try{results.push({jsonrpc:'2.0',id:item.id,result:await client.request({method,params:item.params??[]})});}catch{results.push({jsonrpc:'2.0',id:item.id,error:{code:-32000,message:'Restore read RPC unavailable'}});}}
  }
  await writeFile(auditPath,JSON.stringify(counts));
  response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify(Array.isArray(payload)?results:results[0]));
 }catch{response.writeHead(502);response.end('{"error":"restore_proxy_failed"}');}
});
await new Promise(resolve=>server.listen(socketPath,resolve));
await chmod(socketPath,0o600);
await chown(socketPath,Number(execFileSync('id',['-u','tillward-keeper-v3'],{encoding:'utf8'})),Number(execFileSync('id',['-g','tillward-keeper-v3'],{encoding:'utf8'})));
