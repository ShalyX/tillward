# Tillward independent Red Team / QA review

Review date: 2026-10-26. Source baseline: `bfbb21f`. Review-only; no fixes, deployments, submissions, signatures or broadcasts performed.

Approved product: BTC-backed MUSD working capital with owner-selected, receipt-linked repayment while preserving the chosen cash floor (`docs/PRODUCT.md`). The keeper, recovery and tests support that business workflow.

## Verdict

No P0 or demonstrated unauthorized fund-redirection exploit found in the reviewed source. One P1 user-journey recovery defect and four P2 correctness/reliability findings remain. The completed historical testnet workflow has evidence and the existing suites pass; these results do not establish mainnet readiness or exhaustive wallet/provider behavior. Mainnet remains NO-GO under the existing readiness document. Findings below do not revoke the recorded Wave 1 submission.

Severity: P1 = a supported user action can leave the core workflow unusable without developer/operator intervention; P2 = bounded correctness, explanation or service-reliability problem. Confidence distinguishes source/module reproduction from a live wallet exploit.

## RT-01 — P1: wallet replacement or cancellation can indefinitely lock all app writes

- Evidence: `src/main.ts:33-34`, `src/main.ts:143-157`, `src/main.ts:171-175`; `src/chain-state.mjs:2-10`.
- Trigger: a user broadcasts a transaction and then uses the wallet's speed-up/cancel function, or the original transaction is dropped and another transaction consumes its nonce. The application persists only the original hash under `paydown.pending.<chainId>`. If its receipt will never exist, idle reconciliation continues polling that hash.
- Consequence: `pendingHash` never clears. `send()` refuses every new write and owner buttons remain disabled, including other business accounts opened on the same origin/chain after reload. Refresh is the offered recovery action but cannot fix a replaced hash. Funds are not stolen; repayment, withdrawal, checkout and further setup can become inaccessible through this UI. Direct contract access or local-storage surgery is an external workaround, not product recovery.
- Confidence: high for control flow. A read-only module reproduction made three reconciliation rounds with a missing original receipt and an advancing head; every result retained no receipt. Live wallet replacement was not performed.
- Verify/fix recommendation: persist sender, nonce and transaction intent; reconcile successful replacement/cancellation using canonical transaction evidence and distinguish pending, dropped and replaced states. Offer a reviewed recovery flow with explicit evidence before clearing the lock. Test successful speed-up, confirmed cancellation, unknown receipt during RPC outage, refresh and switching accounts. Do not simply clear pending after a timer, which would discard uncertain financial state.
- Testnet impact: fix before claiming robust fresh-wallet recovery. This can break a judge's independent signed journey even though the historical happy path succeeds.

## RT-02 — P2: checkout displays fewer decimal places than it actually authorizes and charges

- Evidence: `src/money.mjs:3-8`, `src/money.mjs:15-18`; `src/main.ts:58`, `src/main.ts:88-89`, `src/main.ts:160`.
- Trigger: an owner creates a valid invoice for `0.009999999999999999` MUSD, or another amount with more than two fractional places. Amount parsing and the contract preserve up to 18 decimals, but checkout and its approve/pay button call the default two-decimal formatter, which truncates.
- Consequence: checkout says `0.00 MUSD` while approval and payment use `9999999999999999` token units. For `500.009...`, checkout says `500.00` and the extra fraction is still charged. The mismatch is bounded to less than 0.01 MUSD per invoice; the wallet may reveal the full amount, and no unlimited allowance is requested. It still contradicts a clear exact-payment confirmation.
- Confidence: high; direct invocation of the existing formatter reproduced the example. No live invoice or payment created.
- Verify/fix recommendation: show the exact payable decimal value in checkout and confirmation, or explicitly enforce a two-decimal invoice policy throughout creation and the contract-facing UI. Distinguish summarized dashboard totals from an exact payment authorization. Verify 1 wei, sub-cent, whole-number and 18-decimal invoices.
- Testnet impact: visible edge-case correctness defect; not evidence of large-value theft.

## RT-03 — P2: the minimum-debt message suggests new receipts can resume principal amortization

- Evidence: `contracts/RevenueAccount.sol:111-119`, `contracts/RevenueAccount.sol:155-166`; `src/main.ts:32`, `src/main.ts:47`; `README.md:28`; `test/RevenueAccount.t.sol:testNativeMinimumDebtCapsRepayment`.
- Trigger: receipt allocations repay total native debt down to `minimum + reserve` (2,000 MUSD in the test protocol). More invoices are paid while the loan remains at that endpoint.
- Consequence: further receipts increase pending allocation and balance but do not create principal repayment headroom. The app says “At the native minimum debt. Keep collecting or close the loan.” The invoice explanation says small allocations can accumulate until eligible. The owner can reasonably wait for more receipts expecting automatic principal reduction, while the remaining minimum portion requires explicit full closure. Newly accrued interest can allow tiny later payments; that does not permit amortizing the minimum principal. The contract cap itself is correct and deliberate.
- Concrete math: if total debt is 2,202 MUSD and minimum plus reserve is 2,000, automatic repayment headroom is about 202 MUSD before new interest, regardless of how many receipt allocations arrive. The existing test repays 3,200 from 5,200 and leaves 800 pending at 2,000 debt, then rejects another settlement.
- Confidence: high, verified in source and passing existing Solidity test.
- Verify/fix recommendation: distinguish “waiting on cash floor/balance” from “minimum principal endpoint”; state that the remaining loan requires owner-funded closure, show the amount needed and provide the existing close/top-up actions. Verify the displayed state after additional receipts at the floor. Preserve the protocol safeguard.
- Testnet impact: expectation and judging-clarity issue. Do not characterize this as a native-protocol exploit.

## RT-04 — P2: an old but internally consistent RPC snapshot can be presented as current

- Evidence: `src/chain-state.mjs:2-10`; `src/main.ts:109-126`, `src/main.ts:135`; compare the keeper's timestamp freshness check in `scripts/keeper.mjs:90-94`.
- Trigger: the RPC serves a historical head equal to or newer than the saved/manifest anchor and can answer historical reads consistently. All chain ID, factory hash and account checks succeed, but the block is old.
- Consequence: frontend sets `verified=true`, shows normal confirmed state and enables the usual write preparation. Its only explicit behind-head message checks `head < block`, so `head == anchor` does not warn. Users/judges can see historical invoice status, debt and available cash presented without an age warning. Transaction simulation may reject stale assumptions later, so this is not proof that stale data bypasses onchain limits. The footer's block number is not an age/freshness indication for normal users.
- Confidence: high for source behavior; a module stub returning historical `head == anchor` reproduced the absent behind-head condition. A live stale-RPC incident was not induced in this review.
- Verify/fix recommendation: read and evaluate the selected block's timestamp, disclose historical snapshots and disable ordinary write preparation when freshness cannot be established. Preserve historical read access with an explicit status. Verify stale-but-consistent heads separately from outright read failures and heads below the evidence anchor.
- Testnet impact: read-only judging and fresh-action reliability issue under the provider instability already documented by the project.

## RT-05 — P2: unrestricted dust settlement can consume the shared sponsored gas budget

- Evidence: `scripts/keeper.mjs:11-18`, `scripts/keeper.mjs:59-74`, `scripts/keeper.mjs:101-119`; `contracts/RevenueFactory.sol:14-19`; `contracts/RevenueAccount.sol:84-96`.
- Trigger: an owner with an active loan above the minimum pays a tiny self-created invoice that allocates only 1 wei (for example a 5-wei invoice at 20%). The factory enrolls accounts automatically, and the keeper considers every positive quote eligible. Repeating this over time or across attacker-funded accounts requests sponsored native transactions without an economic minimum, per-business gas allowance or admission policy.
- Consequence: an owner can spend shared keeper gas and its global daily reserved budget on negligible debt reduction, delaying sponsored repayments for other businesses until budget reset/operator action. The global cap bounds total expenditure; permissionless manual settlement remains available, and an attacker still needs test BTC, native borrowing collateral and transaction gas. This is service-budget griefing, not custody compromise. No production attack economics or live exhaustion was established.
- Confidence: high for dust eligibility and shared-budget mechanism; medium for practical exhaustion rate, which depends on current gas price, block timing and attacker resources. Reviewed existing `settlementPlan`/`gasBudget` tests; no attack transactions broadcast.
- Verify/fix recommendation: keep onchain permissionless repayment, but separate keeper sponsorship eligibility from nonzero repayment eligibility. Choose a disclosed minimum/batching rule and fair per-account budget or explicit pilot enrollment policy. Test multiple accounts, dust allocations, a funded honest account and daily-cap rollover; show that dust cannot monopolize sponsorship. Explain deferred dust in product UI if sponsorship declines it.
- Testnet impact: public-pilot/automation reliability priority; not a reason to claim the current proof is invalid. Stronger economic-abuse review is a production gate.

## Boundaries verified without turning them into findings

- Owner-only policy changes, MUSD/BTC withdrawal, borrowing, collateral top-up, allocation release and closure are enforced in the contract. Permissionless settlement can reduce only the account's fixed native debt and is capped by allocation, cash floor and minimum debt.
- The cash floor is reserved from both withdrawal and repayment (`contracts/RevenueAccount.sol:117-119`, `137-145`). The UI explicitly says this (`src/main.ts:48`). Spending that reserve requires an owner policy reduction. This is approved current behavior, not an unauthorized lock of owner funds; clarify the reserve model during demand interviews.
- Receipt collection checks exact token delivery; failed native settlement reverts allocation changes. Existing tests exercise cancellation, expiry, duplicate payment, missing funds, fee-token delivery, repayment failure and owner isolation.
- Invoice references are escaped before HTML insertion (`src/main.ts:15`, `47`, `58`), checked for 64 UTF-8 bytes at UI submission, and bounded onchain. Checkout verifies factory registration and protocol addresses; an arbitrary unregistered contract URL is rejected. No malicious-label execution or arbitrary-checkout spender path found in source.
- Keeper uses a dedicated signer, journal-before-broadcast, replay of identical raw transaction bytes, confirmation/canonical-block checks, pinned factory hash, gas caps and a service lock. Fail-closed recovery can stop every account behind one unresolved global nonce; this is an explicitly documented operator-recovery boundary, not a discovered signing-authority exploit. Full isolated runtime restore and monitoring beyond both current hosts remain acknowledged production gates.
- Proof files distinguish the funded sample customer from actual customer adoption. The browser closure proof and original separate-payer proof exercise different journeys. No audit, mainnet use or genuine revenue inferred from those proofs.

## Checks actually run

| Check | Result | Limits |
| --- | --- | --- |
| `npm test` | 21 passed, 0 failed | Existing module tests; no browser wallet replacement tests |
| `npm run contracts` | 20 passed, 0 failed; 128 split fuzz runs | Mock protocol suite; deliberately excludes `NativeForkTest` |
| `npm run build` | TypeScript and Vite passed | Does not prove rendered behavior or live provider health |
| Read-only ad hoc Node import of existing money/recovery modules | Reproduced exact amount display truncation, indefinitely missing original receipt and no behind-head warning for head equal to historical anchor | Stubbed RPC, no wallet/chain mutation, no new test files |
| Source/proof review | Contracts, UI, money/history/hints modules, keeper/registry/health/service configuration, tests, README, product brief, submission copies, proof manifest, QA/readiness/runbooks read | No private credentials accessed; no hosted service changed |

The parent review owns current browser/link inspection of Tillward, AKINDO, pitch, video and release assets. This independent source report does not claim those live surfaces were opened or authenticated here. No dependency audit or native fork test was rerun in this pass; prior results remain historical.
