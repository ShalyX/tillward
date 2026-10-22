// Run on the keeper VPS. Outputs operational metadata only; never reads wallet/token contents.
import {readFile,stat,statfs} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const directory='/var/lib/tillward-keeper';
const read=name=>readFile(`${directory}/${name}`,'utf8').then(JSON.parse);
const [health,backup,alerts]=await Promise.all(['keeper-health.json','backup-status.json','keeper-alerts.json'].map(read));
const units=['tillward-keeper.service','tillward-keeper-health.timer','tillward-keeper-backup.timer'];
const enabled=units.map(unit=>({unit,enabled:execFileSync('systemctl',['is-enabled',unit],{encoding:'utf8'}).trim()}));
if(execFileSync('systemctl',['is-active','tillward-keeper'],{encoding:'utf8'}).trim()!=='active'||enabled.some(u=>u.enabled!=='enabled'))throw Error('Service/timer not enabled and active.');
if(health.state!=='healthy'||health.pending||health.enrolled!==3||Date.now()-Date.parse(health.checkedAt)>180000)throw Error('Keeper is not freshly healthy.');
if(!alerts.testMessageId||!alerts.testedAt)throw Error('Telegram test not confirmed.');
const files=[`${directory}/telegram.json`,`${directory}/wallet.json`,`${directory}/paydown-keeper-journal.json`,'/var/backups/tillward-keeper/snapshot-1.tar.gz'];
const permissions=[];
for(const path of files){const s=await stat(path);if((s.mode&0o777)!==0o600)throw Error('Unsafe private file mode.');permissions.push({path,mode:'0600',uid:s.uid});}
const members=execFileSync('tar',['-tzf','/var/backups/tillward-keeper/snapshot-1.tar.gz'],{encoding:'utf8'}).trim().split('\n');
if(!['wallet.json','paydown-keeper-journal.json','keeper-registry.json'].every(name=>members.includes(name)))throw Error('Incomplete backup.');
const fingerprints={};for(const name of ['keeper.mjs','keeper-registry.mjs','keeper-health.mjs','keeper-alerts.mjs'])fingerprints[name]=createHash('sha256').update(await readFile(`/opt/tillward-keeper/scripts/${name}`)).digest('hex');
const disk=await statfs(directory,{bigint:true});
console.log(JSON.stringify({observedAt:new Date().toISOString(),chainId:31611,state:health.state,enrolled:health.enrolled,accounts:Object.keys(health.accounts),enabled,telegram:{bot:'tillward_bot',testMessageId:alerts.testMessageId,testedAt:new Date(alerts.testedAt).toISOString()},backup:{...backup,verifiedMembers:members,localOnly:true},permissions,freeBytes:String(disk.bavail*disk.bsize),runtimeSha256:fingerprints,remaining:['Increase disk capacity','Independent host-outage monitoring','Encrypted off-host state backup and restore drill','Audit and mainnet readiness review']}));
