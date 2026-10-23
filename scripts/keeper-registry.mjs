const isAddress=value=>typeof value==='string'&&/^0x[0-9a-fA-F]{40}$/.test(value);

// Advance only after an entire bounded log page has been fetched and validated.
// Injected I/O makes restart, duplicate and partial-RPC behavior testable.
export async function discoverAccounts({registry,head,start,fetchLogs,validate,save,pageSize=2000n,maxPages=10}) {
 if(registry.nextBlock===undefined)registry.nextBlock=start.toString();
 registry.accounts??=[];
 let cursor=BigInt(registry.nextBlock),pages=0;
 while(cursor<=head&&pages++<maxPages){
  const end=cursor+pageSize-1n<head?cursor+pageSize-1n:head;
  const logs=await fetchLogs(cursor,end),additions=[];
  for(const log of logs){
   const address=log.args.account;
   if(log.removed||!isAddress(address||''))throw Error('Invalid account discovery event.');
   if(!await validate(address,log.args.owner))throw Error('Discovered account failed factory verification.');
   if(![...registry.accounts,...additions].some(a=>a.toLowerCase()===address.toLowerCase()))additions.push(address);
  }
  const next={...registry,accounts:[...registry.accounts,...additions],nextBlock:(end+1n).toString()};
  await save(next);Object.assign(registry,next);cursor=end+1n;
 }
 return {synced:cursor>head,accounts:registry.accounts,nextBlock:cursor.toString()};
}

export function accountBatch(accounts,cursor=0,limit=25){
 if(!accounts.length)return {accounts:[],next:0};
 const count=Math.min(limit,accounts.length),start=cursor%accounts.length;
 return {accounts:Array.from({length:count},(_,i)=>accounts[(start+i)%accounts.length]),next:(start+count)%accounts.length};
}

export function operationalIssues({checkedAt,balance,freeBytes,failures=0,now=Date.now()}){
 const issues=[];
 if(!checkedAt||now-Date.parse(checkedAt)>300000||!Number.isFinite(Date.parse(checkedAt)))issues.push('heartbeat_stale');
 if(BigInt(balance)<20000000000000n)issues.push('gas_low');
 if(BigInt(freeBytes)<268435456n)issues.push('disk_low');
 if(failures>0)issues.push('account_failures');
 return issues;
}
