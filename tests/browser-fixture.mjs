// Local-only browser QA fixture. No signing, public RPC or real funds.
// Run: node tests/browser-fixture.mjs, then use the printed URLs.
import {createServer} from 'vite';
import {keccak256,decodeFunctionData,encodeFunctionResult,encodeFunctionData} from 'viem';
const owner='0x'+'11'.repeat(20),account='0x'+'22'.repeat(20),factory='0x'+'33'.repeat(20),musd='0x'+'44'.repeat(20),bo='0x'+'55'.repeat(20),hash='0x'+'aa'.repeat(32),other='0x'+'bb'.repeat(32),bh='0x'+'cc'.repeat(32),invoice='0x'+'dd'.repeat(32);
let scenario='pending',abi,server;
const h=n=>'0x'+BigInt(n).toString(16),unit=10n**18n;
const tx=()=>({hash:['pending','ambiguous','reject'].includes(scenario)?hash:other,from:owner,to:scenario==='cancel'?owner:account,nonce:'0x3',input:scenario==='cancel'?'0x':'0x1234',value:scenario==='cancel'?'0x0':'0x5',blockNumber:['pending','ambiguous','reject'].includes(scenario)?null:h(80),blockHash:['pending','ambiguous','reject'].includes(scenario)?null:bh,transactionIndex:'0x0',gas:'0x61a80',gasPrice:'0x1',v:'0x1b',r:hash,s:hash,type:'0x0'});
const config={chainId:31611,network:'LOCAL QA FIXTURE — no funds',rpc:'http://127.0.0.1:5174/fixture-rpc',explorer:'https://explorer.test.mezo.org',borrowerOperations:bo,musd,hintHelpers:bo,factory,factoryCodeHash:keccak256('0x6000'),deploymentBlock:10,lastVerifiedBlock:10};
async function rpc(method,params){
 if(method==='eth_estimateGas')return h(400000);
 if(method==='eth_chainId')return h(31611);
 if(method==='eth_blockNumber')return h(100);
 if(method==='eth_getCode')return '0x6000';
 if(method==='eth_getBalance')return h(unit);
 if(method==='eth_getTransactionCount'&&params[1]==='pending')return h(3);
 if(method==='eth_getTransactionCount')return h(['pending','ambiguous','reject'].includes(scenario)||BigInt(params[1]==='latest'?100:params[1])<80n?3:4);
 if(method==='eth_getTransactionByHash')return params[0]===hash&&!['pending','ambiguous','reject'].includes(scenario)?null:tx();
 if(method==='eth_getTransactionReceipt')return ['pending','ambiguous','reject'].includes(scenario)||params[0]===hash?null:{transactionHash:other,transactionIndex:'0x0',blockNumber:h(80),blockHash:bh,from:owner,to:tx().to,contractAddress:null,cumulativeGasUsed:h(100000),gasUsed:h(100000),effectiveGasPrice:'0x1',logs:[],logsBloom:'0x'+'00'.repeat(256),status:scenario==='revert'?'0x0':'0x1',type:'0x0'};
 if(method==='eth_getBlockByNumber'){const n=params[0]==='latest'?100:Number(BigInt(params[0]));return {number:h(n),hash:bh,parentHash:bh,timestamp:h(Math.floor(Date.now()/1000)-(scenario==='stale'?3600:0)),gasLimit:h(30000000),gasUsed:h(100000),difficulty:'0x0',totalDifficulty:'0x0',size:'0x0',extraData:'0x',miner:owner,nonce:'0x0000000000000000',transactions:n===80&&!['pending','ambiguous','reject'].includes(scenario)?[params[1]?tx():other]:[]};}
 if(method==='eth_getLogs'){if(scenario==='slowhistory')await new Promise(resolve=>setTimeout(resolve,60000));return [];}
 if(method==='eth_call'){
  const call=decodeFunctionData({abi,data:params[0].data});if(scenario==='slowinvoice'&&call.functionName==='invoices')await new Promise(resolve=>setTimeout(resolve,60000));
  const values={accountOf:account,isAccount:true,owner,musd,borrowerOperations:bo,repaymentBps:2000,cashFloor:500n*unit,paused:false,pendingRepayment:100n*unit,totalCollected:500n*unit,totalRepaid:100n*unit,availableToWithdraw:400n*unit,debtState:[2000n*unit,unit,1800n*unit,200n*unit,true],repaymentQuote:[0n,4],invoiceCount:1n,invoiceIds:invoice,invoices:['Exact fixture payment',9999999999999999n,BigInt(Math.floor(Date.now()/1000)+86400),owner,false,false],balanceOf:1000n*unit,allowance:0n};
  if(call.functionName==='setPolicy')return '0x';
  if(!(call.functionName in values))throw Error('Unsupported fixture call '+call.functionName);
  return encodeFunctionResult({abi,functionName:call.functionName,result:values[call.functionName]});
 }
 throw Error('Unsupported fixture RPC '+method);
}
server=await createServer({server:{host:'127.0.0.1',port:5174,strictPort:true},plugins:[{name:'tillward-local-qa',configureServer(v){v.middlewares.use(async(req,res,next)=>{try{
 if(req.url.startsWith('/deployment.json')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(config));return;}
 if(req.url.startsWith('/fixture-rpc')){let text='';for await(const chunk of req)text+=chunk;const request=JSON.parse(text);const execute=async r=>{try{return {jsonrpc:'2.0',id:r.id,result:await rpc(r.method,r.params)};}catch(e){return {jsonrpc:'2.0',id:r.id,error:{code:-32000,message:e.message}};}};res.setHeader('Content-Type','application/json');res.end(JSON.stringify(Array.isArray(request)?await Promise.all(request.map(execute)):await execute(request)));return;}
 if(req.url.startsWith('/?')){const q=new URL(req.url,'http://localhost').searchParams;scenario=q.get('scenario')||'pending';if(!['pending','speedup','cancel','revert','stale','checkout','reject','ambiguous','slowhistory','slowinvoice'].includes(scenario))throw Error('Bad fixture scenario');}
 next();}catch(e){res.statusCode=500;res.end(e.message);}});},transformIndexHtml(html){
 const j={hash,sender:owner,nonce:3,startBlock:'10',to:account,input:'0x1234',value:'5',action:'fixture-payment'};
 return {html,tags:[{tag:'script',injectTo:'head-prepend',children:`localStorage.removeItem('paydown.anchor.31611');localStorage.${['stale','checkout','reject','ambiguous','slowhistory','slowinvoice'].includes(scenario)?"removeItem('paydown.pending.31611')":"setItem('paydown.pending.31611',"+JSON.stringify(JSON.stringify(j))+")"};window.ethereum={on(){},async request({method}){if(method==='eth_accounts'||method==='eth_requestAccounts')return ['${owner}'];if(method==='eth_estimateGas')return h(400000);
 if(method==='eth_chainId')return '0x7b7b';if(method==='eth_sendTransaction')throw Object.assign(Error('${scenario==='reject'?'User rejected the request.':'Ambiguous wallet transport error.'}'),{code:${scenario==='reject'?4001:-32000}});throw Error('Fixture prohibits signing: '+method);}};sessionStorage.setItem('tillward.live','1');`} ]};}}]});
const module=await server.ssrLoadModule('/src/abi.ts');abi=[...module.accountAbi,...module.factoryAbi,...module.tokenAbi];
await server.listen();console.log(`LOCAL QA ONLY http://127.0.0.1:5174/?account=${account}&scenario=cancel\nScenarios: pending, speedup, cancel, revert, stale, checkout. For checkout append &invoice=${invoice}`);
