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

## Pending

Owner top-up of exactly 2,000 test MUSD, fixed-block closure simulation, owner closure, and separate withdrawal of 0.045 test BTC. Closure and collateral return are not yet claimed.

## Evidence and limits

Machine-readable records: `deployments/wave2-v2-pause-proof.json`, `wave2-v2-manual-invoice.json`, `wave2-v2-manual-payment.json`, `wave2-v2-manual-proof.json`, and `wave2-v2-exit-buffer.json`.

Chrome control timed out; the owner handled public-app/Rabby actions and independent RPC verifiers checked their results. No automated public browser acceptance, actual browser-fault recovery, surplus claim, independent audit, mainnet deployment, customer adoption or Wave 2 submission is implied. Interviews remain on hold.
