# V2 owner recovery and exit verification

November 6, 2026 WAT. Public Mezo testnet, chain 31611. Owner signs all QA wallet transactions; dedicated demo test funds cover the small closing shortfall.

Account: `0xd6e4829B51dB8ED490bFaE01384757B0fD65D622`. Owner: `0x1dcb045123730e606a88380bce534332f50332d2`.

## Confirmed

- Owner disabled the hosted service in transaction `0xf7a9fff02628e3cb6c32aa313e20bdcee86ef586df51243e71d5bbc7783ddcb0`. Receipt allocations remain active at 99%. The prior 4.95 MUSD total fee did not change.
- A second invoice, “Wave 2 manual repayment QA,” was independently checked for exact 10 MUSD, reference, validity and unpaid status before payment.
- Exact 10 MUSD approval and payment were verified, including canonical receipts, intended token/spender/account, payer and invoice. The allowance was zero after payment. The business held 10.05 MUSD, with 9.9 MUSD pending and no new service fee.
- Owner called `settleDirect` for exactly 9.9 MUSD in transaction `0x6624aaa463dc34a6b9c4e8860eaed3a4e6771deabf813fd4cb00c27060a30a47`. Native debt fell by exactly 9.9 MUSD; pending allocation became zero and business MUSD became 0.15. Fee counters remained 4.95 MUSD paid / 495 MUSD hosted repayment.
- Real pause/manual transaction intents were serialized, parsed and reconciled through the product recovery module against canonical transactions. This checks replay of confirmed intents, not a browser reload, replacement or live RPC fault. The eight targeted recovery/history and fee JavaScript checks passed before this sequence.
- A 5 MUSD exit buffer was withdrawn from the dedicated demo account and sent to the QA owner. Canonical actions, decoded amounts/parties and the exact owner token increase were independently verified. These are recycled test assets, not revenue.

## Top-up and closure

Owner supplied 2 MUSD initially, followed by the explicitly requested remaining 1,998 MUSD. Both canonical token transfers, exact owner/business balance deltas and unchanged fee/retained ledgers were verified. Aggregate top-up is exactly 2,000 MUSD and business balance is 2,000.15 MUSD. Native closure simulation succeeded at a fixed block; simulated repayment was 1,997.605528946004082501 MUSD, leaving 2.544471053995917499 MUSD. Actual closure may include additional interest. Evidence: `deployments/wave2-v2-close-preflight.json`.

Owner closure is verified in transaction `0xe837d7c9b6ec1ec29db55413772db32615b7ed83369c921ea867e3a1aec6d5bf`: native debt and posted collateral are zero, the position is inactive, pending repayment is zero, and exactly 0.045 test BTC returned to the business. Actual repayment was 1,997.605602763628993249 MUSD, leaving 2.544397236371006751 MUSD. Fee counters remained unchanged. Evidence: `deployments/wave2-v2-close-proof.json`.

Owner withdrew exactly 0.045 test BTC in transaction `0x2f9651e470f13d4252c207e7ae2f400df29d2fc7fe1d869e97e3f273ecf6260d`. Canonical sender, selector, amount and account were verified. The owner BTC increase equals 0.045 BTC minus that transaction’s exact network gas, and account BTC became zero. Debt, posted collateral and pending repayment remain zero; no extra service fee was charged. Evidence: `deployments/wave2-v2-withdraw-proof.json`.

Final business MUSD: 2.544397236371006751. Hosted service remains disabled. V1/V2 keeper services and V2 health/backup timers were active; V2 was healthy with no pending transaction. A refreshed backup completed at 2026-11-06T00:21:45Z. This closes the V2 owner lifecycle acceptance, not the separate restore/independent monitoring or surplus-claim gates.

## Evidence and limits

Machine-readable records: `deployments/wave2-v2-pause-proof.json`, `wave2-v2-manual-invoice.json`, `wave2-v2-manual-payment.json`, `wave2-v2-manual-proof.json`, and `wave2-v2-exit-buffer.json`.

Chrome control timed out; the owner handled public-app/Rabby actions and independent RPC verifiers checked their results. No automated public browser acceptance, actual browser-fault recovery, surplus claim, independent audit, mainnet deployment, customer adoption or Wave 2 submission is implied. Interviews remain on hold.
