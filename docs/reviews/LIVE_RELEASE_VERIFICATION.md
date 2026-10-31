# Live release verification — October 31, 2026

Status: **App and keeper deployed. Live normal signing, exact payment, unattended repayment, native loan closure and owner BTC recovery verified.**

## Release and operations

- Public app: https://tillward.vercel.app
- Release: `2026-10-31-recovery-3`, application commit `23ee3647b7cb6ae36580af9b3aadd7c9eb7a6759`.
- Production deployment: `dpl_6crhcC2AdKNp1nCviwLTWrZPANLd`; Vercel READY and production alias verified.
- CI passed: https://github.com/ShalyX/tillward/actions/runs/41197367179 . Local verification includes 32 JavaScript tests, 21 Solidity tests including 128 fuzz runs, production build, zero audit vulnerabilities and a clean credential scan.
- Keeper source fingerprint: `750e2f81bc621b86e9b58bc0deb3aa690544e3412ab3c28a661b76a0e0ac43a8`. Runtime installed after stopping the service and confirming no pending transaction. The current journal was retained. Backup: `/var/backups/tillward-keeper/recovery-20261031-105832Z`.
- Post-upgrade operations checks passed: healthy, three accounts, synced discovery, no pending nonce, safe private-file/runtime modes and enabled service/timers. Saved operations evidence: [keeper-recovery-release.json](../../deployments/keeper-recovery-release.json).

## Live wallet evidence

Browser Use drove Tillward in Chrome. The owner handled Rabby confirmations. Owner: `0x1dcb045123730e606a88380bce534332f50332d2`; business: `0x791fFc8A7420dBB0ed5D9F28E811ec7576936433`.

1. Two unchanged policy saves were confirmed. The app reloaded the connected account and returned to usable controls without a lingering transaction lock. See [policy checks](../../deployments/recovery-policy-checks.json). Both requested rejection checks were signed by the user instead; live rejection is **not** marked passed.
2. Opened a fresh native loan: **2,000 test MUSD**, **0.045 test BTC** collateral.
3. Created invoice `0x70e6ac5c7a0e61d1f00a847dd42bad5b8a77af5d977422dbd835add33d4119ff`, amount **5.000000000000000001 test MUSD**. Full amount appears in invoice row, checkout heading and approval/payment button.
4. Exact token approval and payment confirmed. Independent receipt/calldata/Transfer verification checks all 18 decimals. Remaining allowance is zero; invoice is paid.
5. The hosted keeper repaid **1 MUSD**, from its dedicated gas wallet, without another browser settlement action. The native MUSD burn and exact same-transaction native debt reduction match. Pending allocation is zero.
6. On resuming, Rabby exposed another wallet. The app correctly disabled owner-only closure/withdrawal actions. The owner switched back to the expected QA wallet before continuing. Unrelated wallet details remain outside the public evidence package.
7. Owner closed the remaining native debt: **2001.016472428242659654 MUSD**. Receipt and native MUSD burn agree; native debt/collateral are zero and the loan is inactive.
8. Owner withdrew exactly **0.045 test BTC**. The verifier found the canonical withdrawal by sender/nonce, checked calldata and receipt, and matched the owner BTC increase to the full collateral minus that transaction gas. No BTC remains held by the business account.

Canonical read-only evidence: [recovery-browser-lifecycle.json](../../deployments/recovery-browser-lifecycle.json). Its **`complete: true`** result is pinned to block **16,489,990** and verifies native loan closure, zero debt/allocation and exact owner BTC recovery net of gas. Reproduce with `node scripts/verify-recovery-lifecycle.mjs`; omitting `--partial` requires the full completed exit. The verifier needed one retry after a transient WebSocket connection error; it now uses the same verified public HTTP fallback as the app/keeper.

## Additional release findings addressed

Live network traces showed serialized history reads could exhaust the snapshot deadline. History now fetches at most five bounded chunks concurrently and still rejects an entire failed page. Verified loan balances no longer wait for optional invoice/history lists. Checkout exposes no payment action until its exact invoice is loaded. Deferred results cannot replace a newer snapshot or reset an open transaction form/policy edit. Startup displays a loading state and bounds deployment-config fetching.

Slow-history and slow-checkout browser fixtures passed. See `evidence/live-slow-history.txt` and `evidence/live-slow-checkout.txt`. Actual Chrome evidence is under `evidence/rabby-*`; fixtures and live chain claims are kept separate.

## Remaining limits

The normal live lifecycle is complete. Live cancellation/replacement/rejection were not exercised; those paths have separate fixture/regression coverage. This is testnet QA with the owner acting as payer, not customer adoption, revenue, a mainnet deployment or an independent audit. No organizer rescore or submission edit is claimed.

## Transaction evidence

| Action | Verified transaction |
|---|---|
| openLoan | [Explorer](https://explorer.test.mezo.org/tx/0x764ebf3346ef842655ebfb6d7bb0432070236bc8a1ac380c76f38cdd16b229c3) |
| approve | [Explorer](https://explorer.test.mezo.org/tx/0x514cf63a2c084e854cae4fc70b49aa422adf682430adea61b7a087c72278b18b) |
| payInvoice | [Explorer](https://explorer.test.mezo.org/tx/0x8cea117c571cdcf125274340489e91c4aa7c4f84dd62afbda61350bb62e23706) |
| settle | [Explorer](https://explorer.test.mezo.org/tx/0x0cf34c72686cade601a5ee0be2359d110a3ff1a78f9d11326aec641dabac0efd) |
| closeLoan | [Explorer](https://explorer.test.mezo.org/tx/0xf810a7b3349ed7cc6093168a3fe9582d1953d2641e950ca3cc005098be14588c) |
| withdrawBTC | [Explorer](https://explorer.test.mezo.org/tx/0x303c612264e68eef5291a5a1dca7a232d23271d1089ad60ee7e3ee7587e83e48) |
