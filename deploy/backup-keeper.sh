#!/bin/sh
set -eu
umask 077
# Atomic state files can be copied while the keeper runs. Restores require nonce reconciliation.
install -d -m 700 /var/backups/tillward-keeper
exec 9>/var/backups/tillward-keeper/backup.lock
flock -n 9
tar -czf /var/backups/tillward-keeper/snapshot-new.tar.gz -C /var/lib/tillward-keeper wallet.json paydown-keeper-journal.json keeper-registry.json
chmod 600 /var/backups/tillward-keeper/snapshot-new.tar.gz
if [ -f /var/backups/tillward-keeper/snapshot-2.tar.gz ]; then
 mv -f /var/backups/tillward-keeper/snapshot-2.tar.gz /var/backups/tillward-keeper/snapshot-3.tar.gz
fi
if [ -f /var/backups/tillward-keeper/snapshot-1.tar.gz ]; then
 mv -f /var/backups/tillward-keeper/snapshot-1.tar.gz /var/backups/tillward-keeper/snapshot-2.tar.gz
fi
mv -f /var/backups/tillward-keeper/snapshot-new.tar.gz /var/backups/tillward-keeper/snapshot-1.tar.gz
printf '{"completedAt":"%s","retention":3}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > /var/lib/tillward-keeper/backup-status.json.tmp
chown root:tillward-keeper /var/lib/tillward-keeper/backup-status.json.tmp
chmod 640 /var/lib/tillward-keeper/backup-status.json.tmp
mv -f /var/lib/tillward-keeper/backup-status.json.tmp /var/lib/tillward-keeper/backup-status.json
