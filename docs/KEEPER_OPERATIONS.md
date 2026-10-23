# Hosted testnet keeper

Service: tillward-keeper.service on the existing owner VPS (SSH alias caraxes-vps). Runtime /opt/tillward-keeper; private state /var/lib/tillward-keeper. No public port or API. It now auto-enrolls all businesses created by the pinned Tillward factory on Mezo testnet 31611. See KEEPER_ENROLLMENT.md for discovery, current proof, health checks, Telegram and backup/restore procedures. The original single-account proof below is historical.

The separate wallet 0x625E52F5AB7b6563f83a3b7FB7EB7cC3a148A956 received 0.0001 TEST BTC for gas. It is not the account owner and cannot change policy, withdraw, close the loan or redirect funds. No business-owner/customer private key was uploaded. Wallet JSON stays outside the source tree, mode 0600, owned by the service user.

## Confirmed behavior

The service was already watching when a 1 MUSD sample invoice was paid. It independently settled the resulting 0.2 MUSD allocation:

https://explorer.test.mezo.org/tx/0x640ff5468f0707a37366a9c4feb75d57d7cec0d68336e89d67325fdd2d87518d

Standalone RPC verification decoded the repayment event, checked the exact 0.2 MUSD debt reduction and read account counters at block 16298796: 501 MUSD collected, 100.2 repaid, zero pending. See ../deployments/hosted-keeper-proof.json. Sample money originated from the test loan; this is integration QA, not customer revenue.

## Operating bounds

- One-minute polling; bounded exponential backoff to 15 minutes on failures.
- Chain, block age, factory bytecode, registry and non-owner wallet checked before signing.
- 1000 MUSD maximum proposed settlement; actual contract cap also checks allocation, floor and debt.
- Gas reservation: maximum 0.00002 BTC per transaction, 0.0001 BTC per UTC day. Reservations are conservative and include reverted attempts. Wallet balance also limits spending. Testnet only.
- Exact raw signed transaction journaled atomically before broadcast. Missing receipt retains the same hash/bytes. Unreadable journal fails closed.
- systemd restart and boot enablement; flock excludes overlapping service processes.
- Dedicated unprivileged user; read-only system/home protection; state directory 0700; 256 MB memory / 20% CPU caps.
- keeper-health.json now includes discovery progress, enrolled count, per-account states, disk/gas balance, pending hash and last result. Health and backup timers run independently of the keeper process. Telegram is configured separately outside the source tree; current activation evidence is in KEEPER_ENROLLMENT.md.

Commands on the VPS:

```text
systemctl status tillward-keeper
journalctl -u tillward-keeper -n 20 --no-pager
cat /var/lib/tillward-keeper/keeper-health.json
systemctl restart tillward-keeper
systemctl disable --now tillward-keeper
```

Never delete or replace a pending journal to force a new transaction. Reconcile its hash and sender nonce first. Run one keeper process per wallet. The standalone CLI requires the same exclusive lock discipline as the service.

## Host capacity change

The existing 40 GB ext4 root filesystem had no space available to an unprivileged service. npm's download cache was cleared. The pre-existing root reserved-block count was 445577; it was reduced to 209704 (2%), retaining about 819 MB for root and making about 542 MB available at deployment. No other project's source, logs or service configuration was removed. To restore the prior reservation, an administrator can use `tune2fs -r 445577 /dev/vda2` after freeing sufficient space.

Additional space was freed on 2026-10-23. The root filesystem then showed about 8.1 GiB available. This clears the immediate resize requirement; it is a point-in-time reading and should be watched as the host grows. The keeper's missing Node dependencies were restored from the lockfile, health checks were made independent of `viem` for registry validation, and a deliberate keeper restart plus a fresh health run succeeded. Current details are in KEEPER_ENROLLMENT.md and `../deployments/keeper-operations-proof.json`.

The Windows workstation runs `Tillward VPS State Backup` daily at 09:00 West Central Africa time under the signed-in user (needed for DPAPI CurrentUser); it requires network access and starts missed work when available. The first Task Scheduler run succeeded with result 0 and created an encrypted archive/metadata pair. A separate `Tillward VPS Independent Monitor` task now runs every five minutes from the workstation and invokes the read-only VPS verifier over SSH. Its first scheduled run returned 0 with the keeper healthy, three accounts enrolled, no pending transaction and all service/timer units active. It can detect VPS failure while the workstation is online, but is not an uptime monitor for the workstation itself.

Telegram delivery from this workstation has not been verified: Bot API method requests timed out, and curl reported that Windows could not reach its certificate revocation service. The monitor keeps sanitized state/logs and will retry alerts with backoff; do not count local alert delivery as operational until a message is confirmed. An encrypted backup was also decrypted and parsed entirely in memory: all three required JSON files validated, the restored signer derived to the expected keeper address, and no plaintext files, signatures, broadcasts or live state changes were produced. This is a data recovery rehearsal only. A complete systemd/runtime restore on a separate isolated host remains open; reconcile any pending hash and nonce before restoring a journal.

The system Node executable resolved beneath root's home and was inaccessible under ProtectHome. Its verified existing binary was copied into /opt/tillward-keeper/bin/node (v22.23.1); other applications' runtimes were not changed.

Restart verification on 2026-10-22: service enabled/active; private wallet and journal 0600 under tillward-keeper; subsequent health record retained the same confirmed settlement and returned to no-allocation deferred state.
