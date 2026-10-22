// A confirmed receipt is a lower bound for every subsequent account read.
export async function snapshotBoundary(client,anchor,pendingHash){
 let receipt;
 if(pendingHash){try{receipt=await client.getTransactionReceipt({hash:pendingHash});}catch{/* Keep the pending hash until a receipt is available. */}}
 const confirmed=receipt?.blockNumber??0n;
 const minimum=confirmed>anchor?confirmed:anchor;
 const head=await client.getBlockNumber({cacheTime:0});
 return {block:head>minimum?head:minimum,head,receipt};
}

// Read a recent page in provider-sized chunks. Older pages remain accessible.
// Reject the whole page on a failed chunk so retries never skip missing ranges.
export async function historyPage(client,{address,events,deploymentBlock,toBlock}){
 if(toBlock<deploymentBlock)return {logs:[],before:undefined};
 const start=toBlock-deploymentBlock>=10000n?toBlock-9999n:deploymentBlock;
 const logs=[];
 for(let from=start;from<=toBlock;from+=2000n){
  const end=from+1999n<toBlock?from+1999n:toBlock;
  logs.push(...await client.getLogs({address,events,fromBlock:from,toBlock:end}));
 }
 logs.sort((a,b)=>a.blockNumber===b.blockNumber?(b.logIndex??0)-(a.logIndex??0):a.blockNumber>b.blockNumber?-1:1);
 return {logs,before:start>deploymentBlock?start:undefined};
}
