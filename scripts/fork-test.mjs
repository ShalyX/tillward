import {spawnSync} from 'node:child_process';
const contract=process.argv.includes('--surplus')?'NativeSurplusForkTest':'NativeForkTest';
const r=spawnSync('forge',['test','--match-contract',contract,'--offline','-vv'],{stdio:'inherit',env:{...process.env,RUN_NATIVE_FORK:'true'}});
process.exit(r.status??1);
