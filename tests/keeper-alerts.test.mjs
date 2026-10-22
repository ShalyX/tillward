import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {sendTelegram,notifyHealth} from '../scripts/keeper-alerts.mjs';
const config={botToken:'1234:abcdefghijklmnopqrstuv',chatId:'-1234'};
async function cleanup(directory){
 const target=resolve(directory);if(dirname(target)!==resolve(tmpdir())||!basename(target).startsWith('tillward-alerts-'))throw Error('Unexpected temporary directory.');
 await rm(target,{recursive:true,force:true});
}
test('Telegram sends only bounded plain text and redacts network errors',async()=>{
 const request=async(url,options)=>{assert.ok(url.startsWith('https://api.telegram.org/'));assert.equal(options.redirect,'error');assert.deepEqual(JSON.parse(options.body),{chat_id:'-1234',text:'check'});return {ok:true,json:async()=>({ok:true,result:{message_id:2}})};};
 assert.equal(await sendTelegram(config,'check',request),2);
 await assert.rejects(sendTelegram(config,'check',async()=>{throw Error(config.botToken);}),e=>!e.message.includes(config.botToken));
 await assert.rejects(sendTelegram({botToken:'bad',chatId:'bad'},'check',request),/Invalid/);
});
test('alerts deduplicate, remind after 30 minutes, and send one recovery',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'tillward-alerts-'));try{
  await writeFile(join(directory,'telegram.json'),JSON.stringify(config));let sent=0;
  const send=async()=>++sent,health={enrolled:3},options={send,now:10000000};
  assert.equal((await notifyHealth(directory,health,[],options)).sent,false);
  assert.equal((await notifyHealth(directory,health,['gas_low'],options)).sent,true);
  assert.equal((await notifyHealth(directory,health,['gas_low'],{...options,now:10000001})).sent,false);
  assert.equal((await notifyHealth(directory,health,['gas_low'],{...options,now:11800001})).sent,true);
  assert.equal((await notifyHealth(directory,health,[],{...options,now:11800002})).sent,true);
  assert.equal((await notifyHealth(directory,health,[],{...options,now:11800003})).sent,false);assert.equal(sent,3);
 }finally{await cleanup(directory);}
});
test('failed delivery retains alert and backs off before retry',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'tillward-alerts-'));try{
  await writeFile(join(directory,'telegram.json'),JSON.stringify(config));let attempts=0;
  const send=async()=>{attempts++;if(attempts===1)throw Error('offline');return 5;},health={enrolled:3};
  await assert.rejects(notifyHealth(directory,health,['disk_low'],{send,now:10000000}),/retry scheduled/);
  assert.equal((await notifyHealth(directory,health,['disk_low'],{send,now:10000001})).sent,false);
  assert.equal((await notifyHealth(directory,health,['disk_low'],{send,now:10120001})).sent,true);assert.equal(attempts,2);
 }finally{await cleanup(directory);}
});
