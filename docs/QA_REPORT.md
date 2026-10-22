# QA report
Checked 2026-10-22. Readiness: working testnet vertical slice; not a completed hackathon submission or audited mainnet product.

| Check | Requirement | Result and evidence |
|---|---|---|
| Q01 | R01-R07 contract authority and funds | Pass: 17 Foundry tests including 128 fuzz cases for split conservation. Owner isolation, duplicate/canceled/expired invoice, insufficient payment/retry, exact transfer accounting, allocation/floor isolation, pause, deferred minimum debt, repayment failure rollback, permissionless caller limits and allocated-budget replay. |
| Q02 | R02/R05/R06 native integration | Pass: fork test calls unchanged native loan/token contracts. Explicit captured native-oracle precompile response required locally. |
| Q03 | R02/R04/R06 public testnet | Pass observed: factory/account deployed, native loan opened, 500 MUSD receipt collected, 100 MUSD native repayment confirmed, zero remaining allocation. Public proof JSON and live UI match the chain state. |
| Q04 | R03/R05 numeric correctness | Pass: six JS tests for exact 18-decimal units, invalid amounts, rounding/cash conservation, executor cap and interest-first native insertion-ratio calculation. |
| Q05 | R09 build | Pass: TypeScript and optimized Vite production build. |
| Q06 | R08/R09 browser | Desktop 1440px and narrow layout inspected. Policy calculator: 1,250 MUSD at 20% shows 250 repayment / 1,000 operations. Live read-only view shows 500 collected, 100 repaid, pending zero and actual onchain invoice/events. |
| Q07 | Browser wallet transaction flow | Unverified end-to-end with a browser wallet extension. Public financial writes were executed by the dedicated wallet scripts; UI transaction preparation is implemented but must not be described as a completed extension-signing QA run. |
| Q08 | Failure recovery | Foundry rollback and idempotency tested. Script journals raw signed transactions outside repo before sending. UI retains pending hash through refresh, refuses blind replacement, validates factory hash/registration/native addresses and explicit chain. RPC failures remain visible; no fake live fallback. |
| Q09 | Continuous automation | One-shot/watch executor implemented. Managed always-on keeper hosting is not deployed. User can manually trigger settlement; do not promise background production automation. |
| Q10 | Rules/materials | MUSD integration and supported testnet complete. Public GitHub, final identity, deck, two-minute video, legal/user declarations and platform submission remain pending. |

## Public testnet findings and fixes
1. RPC gas estimation once returned an intrinsic-only value below EIP-7623 calldata floor. The rejected signed transaction was not mined. Contract transaction preparation now uses a minimum gas allowance and simulation; unused gas is not charged.
2. First settlement `0x96e5229c537c5e6f05f4ce3d89fa787a9f6798a916e8e1c303805a661ceb7348` reverted. Debug trace showed gas exhaustion in SortedTroves traversal with empty hints, not a failed debt-accounting invariant. Native HintHelpers/SortedTroves integration now supplies near insertion positions; successful settlement is `0x3d464267e44b119fe4c8f172996775157261dd85ee9cdd598e5b27bb04b0fb0d`.
3. HTTP RPC sometimes reported block 16,082,514 after successful transactions at 16,298,xxx and returned empty calls/not-found receipts. Official WebSocket reads returned confirmed receipts and the live account. UI now prefers WebSocket and uses an explicit snapshot block with a known confirmed lower bound. Native hints have the same lower bound.

## Limits and next gates
- Broader browser-extension wallet signing/recovery QA remains required before submission.
- Fresh private preview deployment must be confirmed by Sites; public judge access remains a later audience decision.
- Exact-debt invariant and fixed token/protocol references retained throughout; no weakened accounting gate.
- Repo secrets check and deployment-source review are performed before private source sync. No independent audit claimed.
- Full-history indexing beyond the bounded RPC event range is not implemented; latest 50 invoices are read from storage. Customer checkout can fetch an older exact invoice ID.
