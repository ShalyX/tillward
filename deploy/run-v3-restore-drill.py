"""Run as root on the VPS. Copies private state; never replaces live files."""
import datetime, json, os, pathlib, pwd, shutil, subprocess, tarfile, time
base=pathlib.Path('/var/lib/tillward-restore-drill-v3'); base.mkdir(mode=0o755,exist_ok=True)
run=base/('run-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S'))
run.mkdir(mode=0o750); user=pwd.getpwnam('tillward-keeper-v3'); os.chown(run,0,user.pw_gid)
runtime=run/'runtime'; state=run/'state'; state.mkdir(mode=0o700); os.chown(state,user.pw_uid,user.pw_gid)
source=pathlib.Path('/opt/tillward-keeper-v3'); snapshot=pathlib.Path('/var/backups/tillward-keeper-v3/snapshot-1.tar.gz')
required={'wallet.json','paydown-keeper-journal.json','keeper-registry.json'}
with tarfile.open(snapshot,'r:gz') as archive:
    members=archive.getmembers()
    if len(members)!=3 or {m.name for m in members}!=required or any(not m.isfile() or m.size>4194304 for m in members): raise RuntimeError('Unexpected backup members')
    for member in members:
        payload=archive.extractfile(member).read(); json.loads(payload)
        destination=state/member.name; destination.write_bytes(payload); destination.chmod(0o600); os.chown(destination,user.pw_uid,user.pw_gid)
shutil.copytree(source,runtime,symlinks=True)
modules=runtime/'node_modules'
if modules.is_symlink(): modules.unlink()
if not modules.exists(): shutil.copytree('/opt/tillward-keeper/node_modules',modules,symlinks=True)
(runtime/'bin').mkdir(exist_ok=True)
binary=runtime/'bin/node'
if binary.is_symlink(): binary.unlink()
shutil.copy2('/opt/tillward-keeper/bin/node',binary)
manifest=runtime/'public/deployment.json'; config=json.loads(manifest.read_text()); upstream=config.get('ws') or config['rpc']; config['rpc']='http://127.0.0.1:18545'; config.pop('ws',None); manifest.write_text(json.dumps(config))
audit=run/'rpc-audit.json'
proxy=subprocess.Popen(['/opt/tillward-keeper/bin/node',str(source/'deploy/restore-readonly-proxy-v3.mjs'),str(run/'rpc.sock'),upstream,str(audit)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    for _ in range(100):
        if (run/'rpc.sock').exists(): break
        if proxy.poll() is not None: raise RuntimeError('Read-only proxy failed')
        time.sleep(.05)
    unit='tillward-v3-restore-'+run.name
    result=subprocess.run(['systemd-run','--quiet','--wait','--pipe','--collect','--unit='+unit,'-p','User=tillward-keeper-v3','-p','Group=tillward-keeper-v3','-p','PrivateNetwork=yes','-p','NoNewPrivileges=yes','-p','ProtectSystem=strict','-p','ProtectHome=yes','-p','ReadWritePaths='+str(state),'-p','WorkingDirectory='+str(runtime),'-p','MemoryMax=256M','-p','RuntimeMaxSec=120','--setenv=RESTORE_DRILL_ROOT='+str(run),'--setenv=RESTORE_HOST_NETWORK_NAMESPACE='+os.readlink('/proc/self/ns/net'),str(binary),str(runtime/'deploy/restore-drill-runner-v3.mjs')],capture_output=True,text=True,timeout=140)
    if result.returncode: raise RuntimeError('Isolated restore unit failed: '+result.stderr[-500:])
    proof=json.loads((state/'restore-proof.json').read_text()); counts=json.loads(audit.read_text())
    if counts.get('eth_sendRawTransaction')!=1: raise RuntimeError('Unexpected write attempts')
    proof['rpcMethods']=counts; proof['backupMembers']=sorted(required); proof['snapshotCapturedAt']=json.load(open('/var/lib/tillward-keeper-v3/backup-status.json'))['completedAt']
    for unit in ['tillward-keeper.service','tillward-keeper-v2.service','tillward-keeper-v3.service']:
        if subprocess.check_output(['systemctl','is-active',unit],text=True).strip()!='active': raise RuntimeError('Live service unhealthy')
    proof['liveServicesRemainedActive']=True
    destination=base/'latest-proof.json'; destination.write_text(json.dumps(proof,indent=2)+'\n'); destination.chmod(0o644)
    print(json.dumps(proof))
finally:
    proxy.terminate(); proxy.wait(timeout=10)
    # This exact directory was created above; remove only drill copies and secrets.
    if run.resolve().parent!=base.resolve() or not run.name.startswith('run-'): raise RuntimeError('Unsafe cleanup path')
    shutil.rmtree(run)
