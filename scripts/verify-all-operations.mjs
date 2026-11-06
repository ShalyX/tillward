// VPS read-only verifier for the external workstation monitor. Never reads keys/tokens.
import {readFile,stat,statfs} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const keepers=[];
for(const [unit,expectedFactory,expectedWallet] of [
 ['tillward-keeper','0xaf90fe019f7303bb4720437dcfbafe1549474f36','0x625E52F5AB7b6563f83a3b7FB7EB7cC3a148A956'],
 ['tillward-keeper-v2','0xaa5121f96502b9618156e8288e60ce1c699b9a43','0x7C93C575bE5ceD60F388D2866991d68aE23e3D42']]){
 const directory='/var/lib/'+unit;
 const load=name=>readFile(directory+'/'+name,'utf8').then(JSON.parse);
 const [health,registry,backup]=await Promise.all([load('keeper-health.json'),load('keeper-registry.json'),load('backup-status.json')]);
 const age=Date.now()-Date.parse(health.checkedAt),backupAge=Date.now()-Date.parse(backup.completedAt);
 if(!Number.isFinite(age)||age< -30000||age>180000||health.state!=='healthy'||health.pending||health.chainId!==31611||health.wallet?.toLowerCase()!==expectedWallet.toLowerCase()||health.discovery?.synced!==true)throw Error(unit+': unhealthy/stale keeper');
 if(registry.chainId!==31611||registry.factory?.toLowerCase()!==expectedFactory||!Array.isArray(registry.accounts)||registry.accounts.length<1||health.enrolled!==registry.accounts.length)throw Error(unit+': registry/discovery mismatch');
 if(!Number.isFinite(backupAge)||backupAge< -30000||backupAge>36*3600000)throw Error(unit+': backup stale');
 const units=[unit+'.service',unit+'-health.timer',unit+'-backup.timer'].map(name=>({unit:name,active:execFileSync('systemctl',['is-active',name],{encoding:'utf8'}).trim(),enabled:execFileSync('systemctl',['is-enabled',name],{encoding:'utf8'}).trim()}));
 if(units.some(u=>u.active!=='active'||u.enabled!=='enabled'))throw Error(unit+': service/timer unavailable');
 const permissions=[];
 for(const path of [directory+'/wallet.json',directory+'/paydown-keeper-journal.json',directory+'/telegram.json','/var/backups/'+unit+'/snapshot-1.tar.gz']){
  const info=await stat(path);if((info.mode&0o777)!==0o600)throw Error(unit+': unsafe private-file permissions');permissions.push({path,mode:'0600'});
 }
 const disk=await statfs(directory,{bigint:true});
 if(disk.bavail*disk.bsize<268435456n||BigInt(health.balance)<20000000000000n)throw Error(unit+': low disk/gas');
 keepers.push({unit,state:health.state,checkedAt:health.checkedAt,enrolled:health.enrolled,pending:null,discovery:health.discovery,units,permissions,backupCompletedAt:backup.completedAt});
}
console.log(JSON.stringify({observedAt:new Date().toISOString(),state:'healthy',keepers,scope:'External polling covers both keepers; delivery and workstation availability are separate checks.'}));
