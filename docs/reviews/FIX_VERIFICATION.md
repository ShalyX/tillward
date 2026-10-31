# Tillward remediation verification

October 31, 2026. Scope: source fixes for the October 26 review. **Implemented and verified locally; not pushed, deployed to Vercel, or installed on the hosted keeper.** No contracts were redeployed. The confirmed AKINDO submission remains historical and unchanged.

## Fixes

| Finding | Source change | Verification |
|---|---|---|
| P1: original-hash write lock | Persist sender, explicit nonce, exact call/value and start block before requesting the wallet. Recover the canonical transaction consuming that nonce by bounded binary search. Match its intent before reporting success. Canonical reverts/cancellations release the lock without claiming success. Unknown sends remain blocked. | Unit coverage for original/speed-up/cancellation/revert/reorg/drop/RPC failure/reload; actual app browser fixtures for speed-up, cancellation, pending and ambiguous send. |
| Rejection edge discovered during testing | Traverse viem's nested error causes for explicit EIP-1193 code 4001; discard only a definitely rejected unsent intent. | Real viem wrapping regression plus browser fixture: rejected rule save leaves Save enabled, no pending banner; ambiguous error retains lock and explains missing hash. |
| Legacy hash-only state | Hydrate metadata from the original transaction if available. If the original has disappeared, accept original signed transaction bytes only when their cryptographic hash matches; recover signer and nonce from the signature. | Signed-payload matching/mismatch tests. Missing original retains lock. |
| P2: minimum-debt endpoint | Show partial repayment headroom, explicit owner closure/top-up requirement and required additional funding. Correct accumulation claims. Explain cash floor as reserved against withdrawal and repayment. | New Foundry test collects another receipt at minimum, confirms quote stays zero/reason 4, rejects nonowner closure, then verifies owner closure releases allocation. Browser endpoint and reserve copy inspected. |
| P2: checkout precision | Show full exact MUSD value in invoice rows, checkout amount, approve/pay button and invoice preview. Summary amounts may remain rounded. | One wei, sub-cent, whole and 18-decimal tests; browser shows 0.009999999999999999 MUSD in heading and payment button. |
| P2: stale consistent RPC | Read selected block timestamp, reject snapshots older than 180 seconds or over 30 seconds in the future for writes. Recheck freshness before simulation/signing. Preserve receipt block anchor before reading. | Timestamp edge tests; one-hour stale browser fixture displays warning and blocks Save. |
| P2: sponsored keeper dust/fairness | Batch settlements below 1 MUSD. Reserve at most 0.000025 BTC gas per account per UTC day, inside existing transaction/global budgets; persist counters with the pending journal before broadcast. Manual permissionless contract settlement is unchanged. | Dust/budget tests and source trace of reserve-before-broadcast/restart accounting; existing global caps, journal signature validation and round-robin discovery tests pass. Hosted runtime not upgraded. |
| P2: contradictory documents | Reconcile submission README/QA with confirmed receipt and v0.1.1 materials. Clarify minimum endpoint in product, answers and judge guide. | Compared source with submission/receipt.json. No live portal or media edits. |
| P2: aged proof discovery | Add Activity block lookup, historyBlock deep link, event deduplication and direct original-demo proof link. Historical events do not replace current balances. | Real testnet read at block 16,482,846 shows original 500 MUSD receipt and 100 MUSD repayment with correct transaction links. |

## Checks completed

- `npm test`: **31 passed**, zero failures.
- `npm run contracts`: **21 passed**, including **128 fuzz runs**; native fork suite excluded by this command.
- `npm run build`: TypeScript and Vite production build passed.
- `git diff --check`: passed.
- Local release scanner: no dedicated wallet keys in source/build; checked text is UTF-8.
- Changed money/recovery/keeper paths reviewed by the implementing operator using request-code-review. No new independent review-agent signoff is claimed.
- `tests/browser-fixture.mjs` serves the actual UI with a local deterministic RPC and mock wallet on port 5174. It cannot sign or broadcast to public networks and is excluded from Vercel upload. Fixtures are not live wallet acceptance evidence.

## Evidence

Saved under [evidence](evidence/): `fix-cancel.txt/png`, `fix-speedup.txt`, `fix-pending.txt`, `fix-rejected.txt`, `fix-ambiguous.txt`, `fix-stale.txt`, `fix-checkout.txt`, `fix-live-history.txt/png`. The live history screenshot uses real read-only testnet data; wallet-failure screenshots/text use isolated fixtures.

## Remaining boundaries

- Public app and VPS keeper still run the prior release. Deployment and post-deploy checks remain separate work.
- No timeout or manual "forget" option clears an uncertain financial action. A truly dropped transaction requires a confirmed same-nonce replacement/cancellation before another app action. A legacy vanished original requires matching signed bytes; if those cannot be obtained, it cannot be safely auto-cleared.
- Simultaneous sends from multiple browser tabs and other wallet applications are not coordinated by a cross-tab lease. The explicit nonce and reconciliation detect a consumed competing nonce, but do not prevent competing wallet activity.
- Per-account limits mitigate dust and unfair reuse; multiple funded accounts can still consume the bounded global subsidy. This is not Sybil resistance or guaranteed sponsored availability.
- No live Rabby signing, new loan exit, native fork, independent audit, customer interviews or organizer rescore was performed. Historical acceptance evidence and the 73/100 review score were not replaced with new claims.
