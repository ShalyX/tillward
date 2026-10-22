import {readFile,writeFile,rename} from 'node:fs/promises';
import {resolve} from 'node:path';

export async function sendTelegram(config,text,request=fetch){
 if(!/^\d+:[A-Za-z0-9_-]{20,}$/.test(config.botToken||'')||!/^\-?\d+$/.test(String(config.chatId)))throw Error('Invalid Telegram configuration.');
 let response;
 try{response=await request(`https://api.telegram.org/bot${config.botToken}/sendMessage`,{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:String(config.chatId),text}),
  redirect:'error',signal:AbortSignal.timeout(10000)});}catch{throw Error('Telegram delivery failed: network or timeout.');}
 let body;try{body=await response.json();}catch{throw Error('Telegram delivery failed: invalid response.');}
 if(!response.ok||body.ok!==true)throw Error(`Telegram delivery failed: HTTP ${response.status}.`);
 return body.result?.message_id;
}

export async function notifyHealth(directory,health,issues,{now=Date.now(),send=sendTelegram,test=false}={}){
 let config;try{config=JSON.parse(await readFile(resolve(directory,'telegram.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return {configured:false};throw Error('Telegram configuration unreadable.');}
 const path=resolve(directory,'keeper-alerts.json');let previous={};
 try{previous=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('Alert state unreadable.');}
 const failed=Object.entries(health.accounts??{}).filter(([,a])=>a.state==='degraded').map(([address])=>address).sort();
 const key=issues.length?JSON.stringify({issues:[...issues].sort(),failed}):'';
 if(!test&&(previous.retryAfter>now||(!key&&!previous.key)||(key===previous.key&&now-(previous.sentAt||0)<1800000)))return {configured:true,sent:false};
 const text=test?'Tillward testnet: Telegram alert connection verified.':
  key?`Tillward testnet needs attention: ${issues.join(', ')}.\nEnrolled accounts: ${health.enrolled??'unknown'}. Failed accounts: ${failed.length}.\nCheck systemctl status tillward-keeper and keeper-health.json.`:
  'Tillward testnet recovered: keeper heartbeat, accounts, gas and disk checks are healthy.';
 try{
  const messageId=await send(config,text);
  const next=test?{...previous,retryAfter:0,failures:0,testMessageId:messageId,testedAt:now}:{key,sentAt:now,messageId};
  await writeFile(path+'.tmp',JSON.stringify(next),{mode:0o600});await rename(path+'.tmp',path);
  return {configured:true,sent:true,messageId};
 }catch{
  // Never print the bot token, request URL, or upstream error body.
  const failures=(previous.failures||0)+1;
  await writeFile(path+'.tmp',JSON.stringify({...previous,failures,retryAfter:now+Math.min(900000,120000*2**Math.min(failures-1,3))}),{mode:0o600});await rename(path+'.tmp',path);
  throw Error('Telegram alert failed; retry scheduled. Check bot configuration and connectivity.');
 }
}
