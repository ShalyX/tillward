// Runs only inside the drill's PrivateNetwork=yes systemd unit.
import http from 'node:http';
import {readFile,writeFile,readlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {privateKeyToAccount} from 'viem/accounts';
const root=process.env.RESTORE_DRILL_ROOT;
if(!/^\/var\/lib\/tillward-restore-drill-v3\/run-[\da-z-]+$/.test(root??''))throw Error('Unexpected drill root.');
const state=root+'/state',runtime=root+'/runtime';
const load=name=>readFile(state+'/'+name,'utf8').then(JSON.parse);
const expected='0x94fD519f7bcc3a11776B101B1CcC284560B7979B';
const wallet=await load('wallet.json'),journal=await load('paydown-keeper-journal.json'),registry=await load('keeper-registry.json');
if(privateKeyToAccount(wallet.privateKey).address.toLowerCase()!==expected.toLowerCase()||journal.pending||registry.chainId!==31611||registry.factory.toLowerCase()!=='0xca5c522850a366769e3f3b07e45f6c7a8980e692')throw Error('Restored wallet/journal/registry mismatch.');
if(await readlink('/proc/self/ns/net')===process.env.RESTORE_HOST_NETWORK_NAMESPACE)throw Error('Network namespace was not isolated.');
function rpc(payload){return new Promise((resolve,reject)=>{
 const request=http.request({socketPath:root+'/rpc.sock',path:'/',method:'POST',headers:{'Content-Type':'application/json'}},response=>{let text='';response.on('data',b=>text+=b);response.on('end',()=>{try{resolve(JSON.parse(text));}catch(e){reject(e);}});});
 request.on('error',reject);request.end(JSON.stringify(payload));
});}
const denied=await rpc({jsonrpc:'2.0',id:1,method:'eth_sendRawTransaction',params:['0x']});
if(denied.error?.code!==-32601)throw Error('Write RPC guard failed.');
const nonceBefore=await rpc({jsonrpc:'2.0',id:2,method:'eth_getTransactionCount',params:[expected,'latest']});
const bridge=http.createServer(async(request,response)=>{
 try{let body='';for await(const chunk of request){body+=chunk;if(body.length>2097152)throw Error('Large body');}const result=await rpc(JSON.parse(body));response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify(result));}
 catch{response.writeHead(502);response.end('{"error":"drill_bridge_failed"}');}
});
await new Promise(resolve=>bridge.listen(18545,'127.0.0.1',resolve));
let output='';
try{
 const child=spawn(process.execPath,['scripts/keeper.mjs',state+'/wallet.json','--all'],{cwd:runtime,env:{...process.env,KEEPER_STATE_DIR:state},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>output+=b);child.stderr.on('data',()=>{});
 const timeout=setTimeout(()=>child.kill('SIGTERM'),90000);
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});clearTimeout(timeout);
 if(code!==0)throw Error('Restored keeper startup failed.');
 const health=await load('keeper-health.json'),after=await load('paydown-keeper-journal.json'),finalRegistry=await load('keeper-registry.json');
 const nonceAfter=await rpc({jsonrpc:'2.0',id:3,method:'eth_getTransactionCount',params:[expected,'latest']});
 if(nonceBefore.error||nonceAfter.error||nonceBefore.result!==nonceAfter.result||health.state!=='healthy'||health.pending||after.pending||health.discovery?.synced!==true||health.enrolled!==finalRegistry.accounts.length||after.last?.hash!==journal.last?.hash)throw Error('Restored runtime health/journal/nonce acceptance failed.');
 const proof={verified:true,verifiedAt:new Date().toISOString(),chainId:31611,signer:expected,networkNamespaceIsolated:true,writeRpcGuardVerified:true,keeperExit:code,health:{state:health.state,enrolled:health.enrolled,discovery:health.discovery,pending:null},signerNonceUnchanged:true,pendingJournalUnchanged:true,lastSettlement:after.last?.hash,scope:'Real V3 snapshot and copied runtime booted in a separate network namespace on the same VPS; only allowlisted read RPC passed through a private Unix socket. No live service restart, signature or broadcast. This is not a second-host or host-loss restore.'};
 await writeFile(state+'/restore-proof.json',JSON.stringify(proof,null,2)+'\n');
 console.log(JSON.stringify({verified:true,state:health.state,enrolled:health.enrolled,nonceUnchanged:true}));
}finally{await new Promise(resolve=>bridge.close(resolve));}
