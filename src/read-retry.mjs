// Read-only recovery for RPC timeouts and successful-but-empty responses from lagging nodes.
// Callers retain their normal validation and must not use this for signing or mutations.
export async function readWithRetry(read, attempts=3){
  let last;
  for(let i=0;i<attempts;i++){
    try{return await read();}catch(e){last=e;if(i+1<attempts)await new Promise(resolve=>setTimeout(resolve,300*(i+1)));}
  }
  throw last;
}
