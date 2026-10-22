import {spawnSync} from 'node:child_process';
const r=spawnSync('forge',['test','--match-contract','NativeForkTest','--offline','-vv'],{stdio:'inherit',env:{...process.env,RUN_NATIVE_FORK:'true'}});
process.exit(r.status??1);
