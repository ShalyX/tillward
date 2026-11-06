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

The Windows workstation runs `Tillward VPS State Backup` daily at 09:00 West Central Africa time under the signed-in user (needed for DPAPI CurrentUser); it requires network access and starts missed work when available. The first Task Scheduler run succeeded with result 0 and created an encrypted archive/metadata pair. A separate `Tillward VPS Independent Monitor` task runs every five minutes from the workstation and invokes the read-only VPS verifier over SSH. Its latest observed run on 2026-10-24 at 00:40 WAT returned 0 with the keeper healthy, three accounts enrolled, no pending transaction and all service/timer units active. It can detect VPS failure while the workstation is online, but is not an uptime monitor for the workstation itself.

Workstation Telegram delivery is verified through the installed Node 24 HTTPS client: `getMe` and `getChat` succeeded, message 13 was accepted, and the PowerShell monitor sender returned success. Windows SChannel cannot reach the certificate's GoDaddy OCSP responder because outbound TCP 80 is blocked; Node's default TLS validates the certificate chain and hostname but does not perform that SChannel OCSP/CRL lookup. The workstation bot-token file ACL is protected and limited to the current user, SYSTEM and local Administrators. The monitor keeps sanitized state/logs and retries alerts with backoff. An encrypted backup was also decrypted and parsed entirely in memory: all three required JSON files validated, the restored signer derived to the expected keeper address, and no plaintext files, signatures, broadcasts or live state changes were produced. This is a data recovery rehearsal only. A complete systemd/runtime restore on a separate isolated host remains open; reconcile any pending hash and nonce before restoring a journal.

The system Node executable resolved beneath root's home and was inaccessible under ProtectHome. Its verified existing binary was copied into /opt/tillward-keeper/bin/node (v22.23.1); other applications' runtimes were not changed.

## V2 operations checkpoint: November 6, 2026 WAT

V2 runs separately under `tillward-keeper-v2.service`, runtime `/opt/tillward-keeper-v2`, state `/var/lib/tillward-keeper-v2`, signer `0x7C93C575bE5ceD60F388D2866991d68aE23e3D42`. Its registry, signer journal, health and backup timers are distinct from V1. No owner signing key is hosted. V2 factory and fee treasury are pinned in its deployment manifest.

The external Windows monitor was found disabled and scoped to V1. It now runs enabled every five minutes and calls `scripts/verify-all-operations.mjs`, which checks both V1 and V2 for fresh health, synchronized registry, expected gas-wallet identities, pending transactions, enabled/active services and timers, private-file permissions, gas/disk thresholds and recent backups. Account counts are checked against each registry rather than fixed at three. A scheduled run returned 0 with both keepers healthy. A simulated outage and subsequent recovery were accepted by Telegram; live services were never stopped. This tests alert delivery/state transitions, not an actual VPS power outage.

The existing daily 09:00 WAT encrypted backup task now invokes `capture-all-tillward-vps-state.ps1` and captures separate V1/V2 state archives. The scheduled run returned 0. V2 encryption round-trip and in-memory decryption, tar validation, journal/registry parsing and expected signer derivation passed. Backup files use DPAPI CurrentUser; no decrypted wallet file was written on Windows.

The V2 runtime restore drill copied a real snapshot, runtime, Node executable and dependencies into an isolated directory, then booted the actual keeper as its service user in a transient `PrivateNetwork=yes` systemd unit. It reached healthy synchronized state. Only allowlisted read RPC reached the actual testnet through a private Unix socket; a deliberate invalid `eth_sendRawTransaction` probe was rejected locally. The original signer nonce and pending journal stayed unchanged, and both live services stayed active. Temporary runtime/state copies were removed. Initial HTTP RPC access failed with 403; the successful relay used the same public WebSocket transport as the live keeper.

Evidence: `deployments/wave2-v2-operations-proof.json`, `wave2-v2-restore-proof.json`, and `wave2-v2-encrypted-restore-proof.json`. Utility sources are under `deploy/` and `deploy/windows/`; Windows templates are installed in the existing private `work` directory, alongside the Telegram sender/credentials and repository checkout required by the in-memory recovery check. They do not contain credentials. Use `python3 /opt/tillward-keeper-v2/deploy/run-v2-restore-drill.py` for the same-host namespace drill only when the V2 journal has no unresolved transaction; never overwrite live state with its copies.

Remaining boundaries: the workstation and its signed-in user session must be online for polling, alerts and DPAPI backup jobs. There is no always-on third-party monitor. The runtime drill used the same VPS, not a second host or host-loss restoration. DPAPI files require the original Windows user profile. A separate-host recovery exercise and independently recoverable key escrow remain commercial-readiness work.

Restart verification on 2026-10-22: service enabled/active; private wallet and journal 0600 under tillward-keeper; subsequent health record retained the same confirmed settlement and returned to no-allocation deferred state.
