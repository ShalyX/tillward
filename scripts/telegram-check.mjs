import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
try{
 const config=JSON.parse(await readFile(resolve(process.argv[2],'telegram.json'),'utf8'));
 for(const method of ['getMe','getChat']){
  try{
   const response=await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(method==='getChat'?{chat_id:String(config.chatId)}:{}),signal:AbortSignal.timeout(10000),redirect:'error'});
   const result=await response.json();console.log(JSON.stringify({method,status:response.status,ok:result.ok,username:method==='getMe'?result.result?.username:undefined,errorCode:result.error_code,
    description:result.description?.replaceAll(config.botToken,'[redacted]').slice(0,150)}));
   if(!result.ok)process.exitCode=1;
  }catch{console.log(JSON.stringify({method,ok:false,message:'Network or timeout; token redacted.'}));process.exitCode=1;}
 }
}catch{console.error('Telegram configuration cannot be read.');process.exitCode=1;}
