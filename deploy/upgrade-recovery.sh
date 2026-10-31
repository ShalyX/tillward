#!/bin/sh
# Run as root on the existing keeper VPS after uploading the reviewed script.
# Never restore an old journal during rollback: a newly signed nonce must survive.
set -eu
umask 077
expected=${1:?Pass the reviewed keeper.mjs SHA256}
case "$expected" in *[!0-9a-f]*|'') echo 'Invalid SHA256' >&2; exit 1;; esac
[ "${#expected}" -eq 64 ] || exit 1
runtime=/opt/tillward-keeper/scripts/keeper.mjs
staged=/tmp/tillward-keeper-recovery.mjs
actual=$(sha256sum "$staged" | cut -d ' ' -f 1)
[ "$actual" = "$expected" ] || { echo 'Staged fingerprint mismatch' >&2; exit 1; }
/opt/tillward-keeper/bin/node --check "$staged"
backup=/var/backups/tillward-keeper/recovery-$(date -u +%Y%m%d-%H%M%SZ)
mkdir -m 700 "$backup"
installed=0
stopped=0
rollback() {
 status=$?
 if [ "$status" -ne 0 ] && [ "$stopped" -eq 1 ]; then
  if [ "$installed" -eq 1 ]; then
   install -o root -g root -m 644 "$backup/keeper.mjs" "$runtime"
  fi
  systemctl start tillward-keeper || true
  echo 'Upgrade failed; runtime restored, current journal retained.' >&2
 fi
}
trap rollback EXIT
systemctl stop tillward-keeper
stopped=1
python3 - <<'PY'
import json
j=json.load(open('/var/lib/tillward-keeper/paydown-keeper-journal.json'))
if j.get('pending'): raise SystemExit('Pending transaction: reconcile before upgrading')
print('No pending transaction; journal will remain in place.')
PY
cp -p "$runtime" "$backup/keeper.mjs"
tar -czf "$backup/state.tar.gz" -C /var/lib/tillward-keeper paydown-keeper-journal.json keeper-registry.json keeper-health.json
chmod 600 "$backup/keeper.mjs" "$backup/state.tar.gz"
install -o root -g root -m 644 "$staged" "$runtime.new"
mv "$runtime.new" "$runtime"
installed=1
systemctl start tillward-keeper
systemctl is-active --quiet tillward-keeper
printf 'Runtime SHA256: '
sha256sum "$runtime"
printf 'Rollback runtime and state snapshot: %s\n' "$backup"
