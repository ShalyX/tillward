// Run on the keeper VPS. Outputs operational metadata only; never reads wallet/token contents.
import {readFile,stat,statfs} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const directory='/var/lib/tillward-keeper';
const read=name=>readFile(`${directory}/${name}`,'utf8').then(JSON.parse);
const [health,backup,alerts]=await Promise.all(['keeper-health.json','backup-status.json','keeper-alerts.json'].map(read));
const units=['tillward-keeper.service','tillward-keeper-health.timer','tillward-keeper-backup.timer'];
const enabled=units.map(unit=>({unit,enabled:execFileSync('systemctl',['is-enabled',unit],{encoding:'utf8'}).trim(),active:execFileSync('systemctl',['is-active',unit],{encoding:'utf8'}).trim()}));
if(enabled.some(u=>u.enabled!=='enabled'||u.active!=='active'))throw Error('Service/timer not enabled and active.');
if(health.state!=='healthy'||health.pending||health.enrolled!==3||Date.now()-Date.parse(health.checkedAt)>180000)throw Error('Keeper is not freshly healthy.');
if(!alerts.messageId||!Number.isFinite(Number(alerts.sentAt)))throw Error('No recent Telegram delivery is recorded.');
const files=[`${directory}/telegram.json`,`${directory}/wallet.json`,`${directory}/paydown-keeper-journal.json`,'/var/backups/tillward-keeper/snapshot-1.tar.gz'];
const permissions=[];
for(const path of files){const s=await stat(path);if((s.mode&0o777)!==0o600)throw Error('Unsafe private file mode.');permissions.push({path,mode:'0600',uid:s.uid});}
const members=execFileSync('tar',['-tzf','/var/backups/tillward-keeper/snapshot-1.tar.gz'],{encoding:'utf8'}).trim().split('\n');
if(!['wallet.json','paydown-keeper-journal.json','keeper-registry.json'].every(name=>members.includes(name)))throw Error('Incomplete backup.');
const runtimePermissions=[];
for(const name of ['keeper.mjs','keeper-registry.mjs','keeper-health.mjs','keeper-alerts.mjs']){
 const path=`/opt/tillward-keeper/scripts/${name}`,s=await stat(path);
 if(s.uid!==0||(s.mode&0o777)!==0o644)throw Error(`Unsafe runtime source ownership or mode: ${name}`);
 runtimePermissions.push({path,mode:'0644',uid:s.uid});
}
const unsafeWritable=execFileSync('find',['/opt/tillward-keeper','/var/lib/tillward-keeper','-xdev','(','-type','f','-o','-type','d',')','-perm','/022','-print'],{encoding:'utf8'}).trim();
if(unsafeWritable)throw Error('Group/other-writable runtime or state paths found.');
const fingerprints={};for(const name of ['keeper.mjs','keeper-registry.mjs','keeper-health.mjs','keeper-alerts.mjs'])fingerprints[name]=createHash('sha256').update(await readFile(`/opt/tillward-keeper/scripts/${name}`)).digest('hex');
const disk=await statfs(directory,{bigint:true});
console.log(JSON.stringify({observedAt:new Date().toISOString(),chainId:31611,state:health.state,enrolled:health.enrolled,accounts:Object.keys(health.accounts),pending:health.pending??null,last:health.last??null,discovery:health.discovery??null,enabled,telegram:{bot:'tillward_bot',lastDeliveryMessageId:alerts.messageId,lastDeliveryAt:new Date(Number(alerts.sentAt)).toISOString()},backup:{...backup,verifiedMembers:members,localOnly:true},permissions,runtimePermissions,unsafeWritableEntries:[],freeBytes:String(disk.bavail*disk.bsize),runtimeSha256:fingerprints,remaining:['Independent host-outage monitoring','Perform full restore drill','Audit and mainnet readiness review']}));
