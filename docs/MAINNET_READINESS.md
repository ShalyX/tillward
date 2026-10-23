# Mainnet readiness review

Reviewed 2026-10-23. Operations alert path refreshed 2026-10-24. **Decision: NO-GO for mainnet.** Tillward remains a Mezo testnet product. This is an internal engineering review, not an independent security audit or approval to deploy.

## Scope and evidence

Reviewed `RevenueAccount.sol`, `RevenueFactory.sol`, `NativeInterfaces.sol`, the testnet deployment/keeper guards, current Foundry and JavaScript suites, dependency audit, and keeper operations evidence.

- `RevenueAccount` uses immutable owner/protocol addresses, owner-gated policy and withdrawal controls, a reentrancy guard around external state-changing calls, exact MUSD balance-delta checks, repayment/cash-floor caps, and transaction reverts to preserve accounting on failed effects.
- `RevenueFactory` creates one account per caller and records its owner/account mapping. It accepts an operations address with code but does not independently attest that address or bind deployment to a chain ID; deployment configuration and protocol identity must be independently pinned for any future network.
- Deployment and keeper scripts currently hard-fail unless chain ID is Mezo testnet 31611. The app README says no mainnet financial writes. No mainnet configuration or deployment was present in the reviewed path.
- Current checks passed: 20 Foundry tests including 128 fuzz runs, 21 JavaScript tests, optimized production build, and full `npm audit` with zero findings.
- Slither was not installed, no formal verification was run, and no independent auditor reviewed the contracts.
- The hosted signer is testnet-only. Workstation Telegram delivery is confirmed over Node HTTPS; direct Windows SChannel OCSP egress remains blocked. The backup rehearsal validated state data in memory but did not restore the full service on an isolated host, and no external monitor reports workstation loss.

## Required before reconsidering

1. Commission an independent contract and integration audit; resolve and retest every finding.
2. Pin and verify the target network's BorrowerOperations, MUSD, TroveManager, hint helpers and factory addresses/code. Add a separate chain-specific deployment configuration and deployment guard rather than repurposing testnet settings.
3. Run fork and public-network lifecycle tests against the exact target protocol version, including collateral, loan, invoice payment, settlement, repayment, pause, closure, recovery, fee/rounding and failure paths.
4. Complete an isolated systemd/runtime restore drill and verify the signer journal, nonce reconciliation, restart behavior and health checks without connecting an old journal to live signing prematurely.
5. Verify alerts from an independent host that remains available when both the VPS and operator workstation are offline; confirm Telegram or an approved alternate delivery route end to end.
6. Review key custody, gas/treasury limits, RPC/provider failover, incident response, customer/legal obligations, monitoring ownership and rollback procedures for the target deployment.

Until these gates have evidence and an authorized deployment plan, do not deploy contracts, fund a mainnet keeper, or enable mainnet financial writes. Testnet proofs demonstrate integration behavior only.
