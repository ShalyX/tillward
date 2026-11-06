# Tillward — Wave 2 judge guide

Prepared November 6, 2026. Testnet only. No wallet is required for read-only inspection.

## Start with the product

Open https://tillward.vercel.app/. Tillward gives a BTC-holding business MUSD working capital and connects its chosen repayment share to final customer receipts. The initial example is illustrative. Open a real account to inspect chain data.

V3 current QA account: https://tillward.vercel.app/?account=0x3a9E23B4e91661751B1916dFe04e71D6dA65F5c7 . Its loan is closed and funds withdrawn. [V3 live proof](../../docs/reviews/WAVE2_V3_LIVE_VERIFICATION.md) records the 80% debt cap, hosted fee, automatic zero-reservation closure, post-close receipt and owner recovery. Signing used the dedicated QA CLI; browser inspection was read-only.

Original demo, with a native loan: https://tillward.vercel.app/?account=0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5 . This is a V1 account and stays fee-free. Values describe the loaded block.

V2 fee/owner QA account: https://tillward.vercel.app/?account=0xd6e4829B51dB8ED490bFaE01384757B0fD65D622 . Its completed test loan is now closed; automation was explicitly disabled. Invoices and Activity retain the recorded receipt, repayment and fee evidence. A current zero debt balance is not an unresolved loading value or a still-open loan.

Surplus fixture: https://tillward.vercel.app/?account=0x948a79e4D97A555a4B54CD345e3e679092824Aba . It is now redeemed, claimed and withdrawn. The current entitlement is zero; the proof records the positive entitlement before claiming.

Watch the [current two-minute pitch](https://tillward.vercel.app/pitch.html) or download the [Wave 2 deck](https://tillward.vercel.app/media/tillward-wave2-deck.pdf).

## Four evidence stops

1. **V3 excess allocation and closure.** A 2,600 MUSD receipt requested 2,080 MUSD at 80%; only the actual loan amount was reserved. After hosted repayment and owner closure, no allocation-release transaction was needed. [Closure](https://explorer.test.mezo.org/tx/0xaca62eb8902df9e1f741222b93f9a1216823f9bb829e6472cd807763aae41fcc).
2. **Actual receipt-funded debt reduction and fee.** A 500 test MUSD invoice at the 99% allocation cap produced 495 MUSD native repayment and a 4.95 MUSD fee in one keeper transaction, leaving 0.05 MUSD. [Settlement](https://explorer.test.mezo.org/tx/0xf2c1c33d606b1ebbb5d8d4c975e105caeb356fd9ae0a23e9991969150b0309a4). The treasury is the QA owner; this is not customer revenue. See deployments/wave2-live-fee-proof.json.
3. **Owner control and exit.** Owner opt-out kept receipt allocations available, then 9.9 MUSD repaid manually with no new fee. Native closure and separate 0.045 test BTC withdrawal were verified net of gas. [Owner exit](https://explorer.test.mezo.org/tx/0x2f9651e470f13d4252c207e7ae2f400df29d2fc7fe1d869e97e3f273ecf6260d). See docs/reviews/WAVE2_V2_EXIT_VERIFICATION.md.
4. **Actual surplus recovery.** A guarded redemption affected only our borrower and created 0.005532212424520610 test BTC of native surplus. The product's claim consumed that entitlement and credited the business exactly; withdrawal was separate. [Claim](https://explorer.test.mezo.org/tx/0xfceb4acb5e2058fe4c1cad47717e318be05ce6f1eaf2cce58e417b1839ee5343). See docs/reviews/WAVE2_PUBLIC_SURPLUS.md, the before/after app observations and deployments/wave2-surplus-*.json.

## Source and reproducibility

Current V3 factory: https://explorer.test.mezo.org/address/0xca5c522850a366769e3f3b07e45f6c7a8980e692?tab=contract .

Historical V2 factory: https://explorer.test.mezo.org/address/0xaa5121f96502b9618156e8288e60ce1c699b9a43?tab=contract .

Fee account: https://explorer.test.mezo.org/address/0xd6e4829B51dB8ED490bFaE01384757B0fD65D622?tab=contract .

Surplus account: https://explorer.test.mezo.org/address/0x948a79e4D97A555a4B54CD345e3e679092824Aba?tab=contract .

Test-only redemption guard: https://explorer.test.mezo.org/address/0x2e89e9e41c0b5deb8321d5e11b778ea467edf802?tab=contract .

All have exact-match explorer source verification. Run `forge test --offline --no-match-contract "Native.*ForkTest"` for the 90 non-fork contract checks, including 13 guard cases and 10 allocation cases. The opt-in native fork is additional evidence with disclosed oracle/chain replay; it is not the public claim proof. Read-only scripts in scripts/ independently verify the recorded public transactions. Public scripts do not include signing keys.

## Limits that matter

The intended seller/payer audience has not been validated; interviews remain on hold. No customer adoption, commercial revenue, audit or mainnet readiness is claimed. The new public fee test used a zero floor; the nonzero-floor fee exception was verified locally and on the native fork. Public surplus signing used the dedicated QA script; the app observation was read-only. External monitoring and DPAPI backup depend on the owner's workstation; runtime restoration used the same VPS in an isolated namespace, not a second host.

This is a Wave 2 preparation packet, not a new AKINDO submission receipt.
