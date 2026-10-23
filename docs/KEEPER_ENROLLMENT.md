# Factory enrollment and operations

Updated 2026-10-23. Hosted Mezo testnet service; not a mainnet readiness claim.

## Enrollment and execution

The systemd service uses `--all`. Discovery scans AccountCreated from deployment in 2,000-block pages, ten pages maximum per cycle, six blocks behind the head. It verifies isAccount and owner/accountOf, deduplicates addresses and persists each complete page and block hash. Fetch/validation/write failure cannot advance the page. A changed checkpoint hash stops discovery for operator reconciliation. No new signing occurs until discovery catches up.

Up to 25 accounts are checked per cycle with a persisted rotating cursor. Deferred contract quotes do not cost transaction gas. Per-account failures back off up to 15 minutes, allowing other accounts to progress. All businesses share one signer journal, nonce sequence and daily gas budget. A pending transaction blocks further signing. Its exact bytes survive restart; startup checks signer, chain, target, settlement call and transaction gas cap. Clearing requires two confirmations and a matching canonical receipt block hash. Writes sync the file before atomic rename. Missing journal with an initialized registry fails closed.

Live proof: two existing accounts were discovered, then 0xb33c3EEe67D011275F36715F649c180929d7BA67 was created and enrolled without restart or configuration changes. That new account has no loan and defers correctly. A subsequent receipt on the original demo business allocated 0.2 MUSD. The hosted service settled it and recovered its original transaction hash after a deliberate restart. Independent RPC verification checked the factory registration, receipt ordering, keeper sender, exact native debt reduction, MUSD burn and fixed-block counters (502 collected / 100.4 repaid / zero pending). See ../deployments/keeper-enrollment-proof.json. This verifies enrollment plus execution; it does not claim repayment from three active loans or customer adoption.

## Health and Telegram

Independent systemd health timer runs every two minutes. It detects heartbeat older than five minutes, degraded service/accounts, pending transactions, gas below 0.00002 test BTC, disk below 256 MiB and backup older than 48 hours. Signing stops below 128 MiB available disk. The check also verifies that the keeper service and both timers are enabled, and that the `viem` runtime dependency loads. On 2026-10-23, the health script was decoupled from `viem` for its registry checks after a missing `node_modules` directory stopped the timer; dependencies were restored with the lockfile and the keeper completed a clean restart. The manual post-restart health check was healthy with three enrolled accounts and no pending transaction.

Telegram credentials live only in /var/lib/tillward-keeper/telegram.json, owned by the service user, mode 0600. Local provisioning source is external work/tillward-telegram.json, never source-controlled. Notifications report incidents, unchanged-incident reminders at 30 minutes and one recovery. Delivery failures back off and do not mark an alert delivered. The token, request URL and upstream errors are excluded from logs. No inbound bot listener/webhook is exposed. Official sendMessage API: https://core.telegram.org/bots/api#sendmessage . The owner started @tillward_bot; getMe/getChat and real test delivery succeeded at 18:22:12 UTC on 2026-10-22 (message 4). The following scheduled health run was healthy and sent no duplicate. See ../deployments/keeper-operations-proof.json.

```text
systemctl status tillward-keeper
systemctl status tillward-keeper-health.timer tillward-keeper-backup.timer
journalctl -u tillward-keeper-health -n 10 --no-pager
systemctl start tillward-keeper-health.service
cd /opt/tillward-keeper
runuser -u tillward-keeper -- bin/node scripts/keeper-health.mjs /var/lib/tillward-keeper --test-telegram
```

## Backups and recovery

Daily root backup timer retains three snapshots under /var/backups/tillward-keeper. Directory mode 0700; archives mode 0600/root. Includes immutable dedicated wallet, global signer journal and discovery registry. Each source file is atomic; snapshots may span adjacent state updates and always require chain reconciliation when restored. Backup status contains no credentials. A daily Windows Task Scheduler job, `Tillward VPS State Backup`, copies the archive to the development workstation at 09:00 West Central Africa time when the signed-in user and network are available; it starts missed work when available and runs under the same user profile needed by DPAPI. Its first scheduled run completed with result 0 on 2026-10-23. The latest encrypted file is `../../../work/tillward-vps-state-20261023-201729Z.dpapi`; metadata is in the adjacent `.json`. The capture validates gzip/tar structure and required state members, protects the archive with Windows DPAPI CurrentUser, and verifies its SHA-256 after an in-memory decrypt. This does not yet simulate restoring the live service. Pre-enrollment code/state snapshots also exist for diagnosis.

Stop the keeper before restoring. Preserve the current journal. Inspect the chosen archive without printing the wallet; reconcile pending hashes and the signer nonce against chain state before replacing any journal. An old snapshot may predate a signed transaction. Never delete a journal to force a replacement. Discovery alone can be rebuilt from deployment while preserving the signer journal and gas reservations. Restart, verify freshness/account states and run the health check. Do not roll back to the old single-account executor with an unresolved transaction for another business.

The VPS snapshots protect against local file corruption but not total VPS loss. Daily encrypted refresh to the development workstation is scheduled and has completed once; keep the machine signed in with network access for timely copies. A full restore drill remains. The original dedicated gas wallet also exists outside the repo on that workstation.

## Production limits

The existing VPS root filesystem is 40 GB. After additional cleanup on 2026-10-23, `df -B1 /` reported 8,725,348,352 bytes available (about 8.1 GiB); a disk resize is not currently needed. Runtime files are root-owned and read-only to group/other, service secrets/state remain mode 0600, and the operational verifier found no group/other-writable runtime or state files/directories. This is a point-in-time capacity reading, not an uptime or growth guarantee. A health timer on the host cannot report total VPS or network loss; independent outage monitoring is still required. No uptime SLA, high-volume load test, external audit or mainnet use is claimed. Gas sponsorship is bounded by a global budget; exhausted budget/balance delays accounts until reset/funding. Automatic testnet enrollment is not unlimited gas sponsorship.
