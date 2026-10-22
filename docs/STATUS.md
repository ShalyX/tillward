# Status
Updated 2026-10-22. Build authorized. Working public-testnet vertical slice implemented; M4 verification/private review. Not submitted. Name remains provisional.

## Canonical documents
- PROJECT_BRIEF.md: scope/decisions
- REQUIREMENTS.md: behavior, rules and proof
- RESEARCH_AND_RESOURCES.md: sources/unknowns
- ARCHITECTURE.md: mechanism, trust and provisional UI
- PRODUCTION_PLAN.md: milestones/budget/finish
- STATUS.md: this record

## Verified
- Six canonical production documents created before implementation.
- 17 contract tests, including 128 split fuzz cases; six JS numeric/executor/hint tests. Native fork test passed with the disclosed oracle-precompile replay.
- Mezo testnet factory `0xaf90fe019f7303bb4720437dcfbafe1549474f36` deployed. Account `0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5` opened a native BTC-backed loan.
- Separate sample customer paid 500 MUSD; 100 MUSD repaid through native Mezo BorrowerOperations. Separate nonowner wallet executed the successful settlement. Pending allocation zero.
- Successful settlement `0x3d464267e44b119fe4c8f172996775157261dd85ee9cdd598e5b27bb04b0fb0d`, block 16,298,123. Full transaction record: ../deployments/public-testnet-proof.json.
- Live browser view independently reads 500 collected, 100 repaid, pending zero, actual invoice and receipt/repayment event links. Desktop and narrow layouts inspected; example calculator checked.
- One-shot settlement keeper correctly reports deferred/no allocation after successful repayment. Managed keeper hosting not deployed.
- TypeScript/optimized Vite build passes. Private Sites project registered; publication still pending when this record was written.

## Next
Publish the reviewed private preview, finish browser-extension transaction QA, then final identity and submission packaging. Public repository, deck, two-minute pitch and platform submission remain pending. QA_REPORT.md and SUBMISSION.md distinguish exact completed checks.

## Unresolved
Official HTTP and WebSocket RPC can return inconsistent heads/lookups across connections. UI fixed-block reads, explicit errors and WebSocket preference are implemented. The strict standalone proof verifier can reject an unsynchronized connection; public receipt confirmations and separate live browser state were observed. Exact deadline timezone, final name/identity, public judge access, full current competitor list, customer demand and eligibility/KYB remain unresolved. Browser wallet signing was not driven end-to-end; CLI public writes are not substituted for that check. No mainnet or unrelated wallet use.

Backlog: Shopify connector, fiat rails, multichain, automated refunds, yield. None committed.
