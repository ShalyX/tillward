# Excess repayment allocation cleanup

November 6, 2026. **Deployed and publicly verified.** See [live V3 report](WAVE2_V3_LIVE_VERIFICATION.md). The original local development record follows.

## Product behavior

A receipt reserves up to the chosen percentage, capped by the remaining active loan debt excluding the native gas reserve, minus amounts already reserved. Money the loan does not need stays retained immediately. No active loan means no reservation for a future loan. The 99% maximum share and 1% fee on actual hosted repayment remain unchanged.

The owner still confirms Close loan for the native minimum-debt endpoint. Successful closure clears all remaining repayment allocation and fee reservation automatically. No Release allocation cleanup transaction is needed. A failed close rolls everything back. Native liquidation/redemption or debt reduction updates reservation/withdrawal views; reopening through Tillward cannot revive old allocations.

Manual Release allocation remains an optional owner control for a still-active loan; it is no longer required for excess or closed-loan cleanup. Existing cash-floor behavior remains intact; new accounts default to zero, with no reserve editor introduced.

## Verification

Eight new behavior tests failed on the unmodified V2 behavior before the change. Final checks: 90 non-fork Solidity tests, including ten allocation boundary/failure/fuzz tests and the full 23-case fee regression suite exercised on V3; 44 JavaScript tests; TypeScript/Vite build. The native fork at block 12,684,025 exercised oversized receipt, actual native partial repayment and exact fee, owner closure, BTC return to business, and MUSD withdrawal without release. Only the unavailable native oracle precompile was replayed; native lending and token contracts were unchanged. Nothing was broadcast.

The operator used the Request Code Review checklist to trace owner authority, bounded reservations, retained receipt fee provenance, callback/reentrancy, exact repayment/fee deltas, rollback and loan-cycle isolation. No unresolved blocker was found in this scope. This is not an independent audit.

## Release boundary

RevenueAccountV3 and RevenueFactoryV3 preserve the deployed V1/V2 sources. Frontend fee validation and keeper artifact selection now support an explicit, matching V3 configuration while rejecting unknown or mismatched revisions. Public deployment.json remains V2.

The V3 deployment and account enrollment have now been completed; see the live report. Existing immutable V2 accounts do not acquire this behavior. Before presenting it as live: deploy/verify the new factory/accounts, verify public oversized receipt/closure, enroll and host the keeper for that registry, then update the public configuration and materials. No live wallet migration is performed in this change.

Machine-readable local proof: deployments/wave2-allocation-local-verification.json.
