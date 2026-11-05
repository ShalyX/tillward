# Atomic service-fee implementation: local acceptance

November 5, 2026. Implements the owner's selected 99% allocation maximum and 1% fee on actual hosted receipt-funded repayment. The repayment calculation preserves the existing cash-floor rule. The authorized fee can cross that floor but cannot consume other pending repayments. Fee funding is exclusively tracked retained receipts. No arrears or deferred collection exists.

## Implementation

- New contracts: contracts/RevenueAccountV2.sol and RevenueFactoryV2.sol. Original V1 account/factory sources and public deployment/release configuration remain unchanged. V2 requires a separate deployment/registry, not an upgrade to existing accounts.
- The factory creates unenrolled accounts. Only the owner can enable/disable the disclosed service. Fee treasury and 100 bps rate are immutable. New account allocations are capped at 9,900 bps even before enrollment.
- Hosted `settle` calculates the existing repayment first, verifies retained funding, repays the native lender in full and transfers the fee in the same guarded transaction. Native debt and token deltas, including exact treasury receipt, are checked. Any failure rolls back repayments, fees, ledgers and events together.
- Retained receipt funds exclude borrowing and direct deposits. While enrolled, `pendingRepayment / 100` is reserved against withdrawals as potential fee funding. This is not an accrued payable; releasing allocations, direct repayment or revoking service releases the corresponding reservation without charging. Withdrawals and closure reconcile the retained ledger. The fee per settlement is integer `actualRepayment / 100`; fractional token dust rounds down without becoming a later receivable.
- Owner-only `settleDirect` remains fee-free, including if fee transfer is unavailable. Native loan closure and collateral controls remain available without a service fee.
- The app reads V2 terms at the financial snapshot block, verifies version/rate/cap/treasury against explicitly configured V2 deployment terms, displays consent, fee quote, reservation, paid fees and the 99% calculator. Missing/mismatched fee terms cannot silently fall back to V1 behaviour. Activity includes confirmed fee events. V1 UI remains on its existing fee-free path.
- The local keeper adapter uses the V2 artifact only when accountVersion=2 is configured, checks pinned service terms and funded quotes before sponsorship, and retains the existing bounded `settle` transaction selector and journal reconciliation. An unenrolled/unfunded account is deferred without signing or recording a fee. The hosted keeper service has not been updated.

## Verification results

The four initial behavioural tests failed before implementation: the 100% allocation was accepted and service methods were absent. After implementation:

| Check | Result |
|---|---|
| Non-fork Solidity suite | 44 passed, 0 failed/skipped: 21 legacy + 23 fee tests |
| Fee fuzz property | 128 runs: repayment, fee, token conservation, retained provenance and other pending allocations |
| Existing allocation fuzz property | 128 runs passed |
| JavaScript suite | 39 passed, 0 failed |
| Production build | TypeScript and Vite passed |
| Credential scan | 4 known credentials checked, 0 findings |
| Native fee integration fork | 1 passed, 0 failed/skipped |

Covered fee cases: full 495 repayment/4.95 fee/0.05 retained; fee crossing a 5 cash floor; ordinary floor limiting repayment to 400 with a 4 fee and 95 other pending allocation; no repayable amount; missing fee funds without shrinking the quote; false/short fee transfer; protocol failure; exact rollback and retry; duplicate settlement; unauthorized enrollment; revocation; pause; owner fee-free fallback; native minimum debt; no fee on closure; mixed receipts/policies, withdrawals and partial settlements; allocation release; integer dust; reentrancy and factory isolation/invalid treasury.

## Native integration scope

`npm run fork:fees` runs NativeFeeForkTest at Mezo mainnet block 12,684,025 through Boar. It deploys V2 only inside a local fork. The unavailable native oracle precompile replays its recorded response; the actual native lending and MUSD contracts are unmodified. No mainnet transaction is broadcast.

The fork verifies exact native debt reduction of 495 MUSD, exact treasury credit of 4.95 MUSD and a remaining business balance of 0.05 MUSD while its configured floor stays 5 MUSD. Pending allocation and potential fee reservation are zero. Repeating settlement fails without charging again.

An instrumented call consumed 280,656 gas inside the test's warm setup transaction. This is not a standalone paid transaction estimate or production upper bound. The entire test's reported gas includes setup/deployment. Do not replace the production cost study's allowance with the warm-call measurement. Full public receipt gas and keeper simulation are deployment-stage evidence.

## Browser scope and review

The local fixture rendered the 99% slider, exact 500 -> 495 / 4.95 / 0.05 preview, floor-exception disclosure, recipient, reservation and owner direct route. Attempting hosted repayment while unenrolled showed "Enable hosted routing or use direct owner repayment." DOM evidence is in evidence/wave2-fee-policy-desktop.txt and wave2-fee-disabled.txt. Screenshot capture was unavailable. No browser signing or real asset transfer occurred; fixture data is not chain proof.

A focused implementation review checked owner authority, immutable terms, retained-source accounting, token/debt conservation, atomic rollback, integer rounding, pending journal intent and V1 isolation. This is an internal review, not an independent audit. Existing pending transactions retain their original signed calldata; no journals were cleared or rewritten for testing.

## Deployment boundary

Machine-readable proof and source hashes: deployments/wave2-fee-local-verification.json. No public app/contract deployment, production keeper update or live fee activation was performed. V2 has no selected live treasury address yet. Deployment must pin that address and new factory bytecode, use a distinct registry/state directory for its keeper, explicitly enroll the owner and verify public testnet repayment/fee/recovery flows before calling the release complete. Existing V1 accounts remain fee-free and cannot be silently migrated. Interviews remain on hold.
