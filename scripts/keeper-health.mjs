import {readFile,statfs} from 'node:fs/promises';
import {resolve} from 'node:path';
import {operationalIssues} from './keeper-registry.mjs';
import {notifyHealth} from './keeper-alerts.mjs';

const directory=process.env.KEEPER_STATE_DIR||process.argv[2];
if(!directory)throw Error('Provide KEEPER_STATE_DIR or state directory argument.');
let health={},issues=[];
try{
 health=JSON.parse(await readFile(resolve(directory,'keeper-health.json'),'utf8'));
 const disk=await statfs(directory,{bigint:true});
 issues=operationalIssues({checkedAt:health.checkedAt,balance:health.balance??'0',freeBytes:disk.bavail*disk.bsize,
  failures:Object.values(health.accounts??{}).filter(a=>a.state==='degraded').length});
 if(health.state==='degraded'&&!issues.includes('service_degraded'))issues.push('service_degraded');
 if(health.pending)issues.push('transaction_pending');
}catch{issues=['health_unavailable'];}
try{
 const backup=JSON.parse(await readFile(resolve(directory,'backup-status.json'),'utf8'));
 if(!Number.isFinite(Date.parse(backup.completedAt))||Date.now()-Date.parse(backup.completedAt)>172800000)issues.push('backup_stale');
}catch{issues.push('backup_unavailable');}
try{
 const notification=await notifyHealth(directory,health,issues,{test:process.argv.includes('--test-telegram')});
 console.log(JSON.stringify({checkedAt:new Date().toISOString(),service:health.state,enrolled:health.enrolled,issues,notification}));
 if(process.argv.includes('--test-telegram')&&!notification.configured)throw Error('Telegram is not configured.');
}catch(e){console.error(e.message);process.exitCode=1;}
if(issues.length)process.exitCode=1;
