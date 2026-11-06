# Wave 2 evidence registry

Updated November 6, 2026. Public Mezo testnet, chain 31611. Mechanism verification is separate from customer acceptance.

| Claim | Class | Evidence | Limit |
| --- | --- | --- | --- |
| 500 receipt → 495 repayment + 4.95 fee + 0.05 retained | VERIFIED public chain | [Fee proof](../deployments/wave2-live-fee-proof.json) | Same-owner test payer/treasury; not revenue |
| Pause, 9.9 manual repayment, closure, 0.045 BTC return | VERIFIED public chain and Rabby owner flow | [Exit report](reviews/WAVE2_V2_EXIT_VERIFICATION.md) | Test assets |
| Native loan conditions and 0.001 BTC collateral top-up | VERIFIED public chain / recorded UI | [Top-up proof](../deployments/wave2-collateral-topup.json) | Recorded conditions change; liquidation/redemption remain possible |
| Positive native surplus claimed and withdrawn exactly | VERIFIED public chain, read-only browser | [Surplus report](reviews/WAVE2_PUBLIC_SURPLUS.md) | Dedicated CLI signer; no Rabby surplus signing claim |
| Only own borrower affected by controlled redemption | VERIFIED public logs / deployed guard | [Redemption proof](../deployments/wave2-surplus-redemption.json) | Test-only fixture, not product functionality |
| Guard and V2 account source exact-match verified | VERIFIED explorer | [Source verification](../deployments/wave2-surplus-source-verification.json) | Verification is not an audit |
| Fee, floor, pending funds, rounding and rollback | LOCAL tests and native fork | [Fee verification](reviews/WAVE2_FEE_VERIFICATION.md) | Simulated fork oracle replay; separate from public proof |
| Keeper health / alerts / backups | VERIFIED operational snapshots | [Ops proof](../deployments/wave2-v2-operations-proof.json) | Workstation monitor requires online signed-in host |
| Two-account isolated runtime restore | VERIFIED isolated same-host drill | [Restore proof](../deployments/wave2-v2-restore-proof.json) | No second-host/host-loss restoration claim |
| Business demand, payer acceptance, fee willingness | UNVALIDATED / interviews held | [Economics](PRODUCTION_ECONOMICS.md) | No customers/pilots/traction claimed |

The default app example is illustrative. Linked account reads are real chain snapshots. Local tests, recorded browser evidence and live chain receipts are not interchangeable.
