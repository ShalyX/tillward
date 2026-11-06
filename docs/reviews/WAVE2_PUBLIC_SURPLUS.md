# Public-testnet native surplus recovery

Verified November 6, 2026 WAT. This closes the judge's onchain `claimCollateral` request separately from ordinary loan closure.

## Product outcome

Tillward business `0x948a79e4D97A555a4B54CD345e3e679092824Aba` acquired an actual native CollSurplusPool entitlement after a controlled redemption. Calling its existing `claimSurplus()` invoked native BorrowerOperations `claimCollateral`, consumed the full entitlement and credited exactly **0.005532212424520610 test BTC** to the business. A separate owner withdrawal returned that BTC to the dedicated QA wallet, independently accounting for gas. Native debt, posted collateral, entitlement, pending repayment and account BTC/MUSD are zero. No Tillward service fee was charged.

## Public transactions

| Action | Transaction | Evidence |
|---|---|---|
| Guarded own-borrower redemption | [0x5bee5fad913f59fb722edf3de5933b06275bf95e582c877834c9132ab5993c65](https://explorer.test.mezo.org/tx/0x5bee5fad913f59fb722edf3de5933b06275bf95e582c877834c9132ab5993c65) | Native status 4, positive surplus; manager borrower-update logs name only this account |
| Product surplus claim | [0xfceb4acb5e2058fe4c1cad47717e318be05ce6f1eaf2cce58e417b1839ee5343](https://explorer.test.mezo.org/tx/0xfceb4acb5e2058fe4c1cad47717e318be05ce6f1eaf2cce58e417b1839ee5343) | Positive entitlement -> zero; exact business BTC increase |
| Owner surplus withdrawal | [0xa4efb0eab2aa3a332bac7b893614502bad0fe7869f3084232ed26ed17b361017](https://explorer.test.mezo.org/tx/0xa4efb0eab2aa3a332bac7b893614502bad0fe7869f3084232ed26ed17b361017) | Exact owner BTC increase net of gas; business BTC zero |
| Redeemer fixture cleanup | [0xeefafcc1f3cf86cd3927e53bd5ddb11d8cd909e92f23bfa222c5e561aed9cdc9](https://explorer.test.mezo.org/tx/0xeefafcc1f3cf86cd3927e53bd5ddb11d8cd909e92f23bfa222c5e561aed9cdc9) | Guard BTC/MUSD returned to owner; both guard balances zero |

Owner: `0x25Db120d4c36977E57cb360f30E6C6028b8d3935`. Native manager: `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0`. Native surplus pool: `0xB4C35747c26E4aB5F1a7CdC7E875B5946eFa6fa9`.

## Why the controlled guard exists

The first eligible native borrower belonged to someone else. Supplying a hint alone cannot guarantee isolation because the native manager can fall back to the sorted list after another transaction changes it. The test-only `OwnedSurplusGuard` binds to a registered account owned by its deployer, requires a valid own first-redemption hint, limits native redemption to one iteration, and requires a full own-account redemption plus positive surplus afterward. An unexpected result reverts the entire transaction. It has a 2,100 MUSD cap, a short deadline and owner-only fund recovery. It is restricted to chain 31611.

The guard is a QA fixture, not a Tillward product feature and not part of account/factory deployment. It does not change business policy, enable fees, claim for another owner or add product controls. The actual claim and withdrawal use the existing deployed V2 account methods. Original V1 demo funds supplied only a 10 test MUSD buffer, within that account's withdrawable balance; no unrelated borrower's position was redeemed. Native redemption charges its own collateral fee, recorded separately from Tillward fees in the JSON proof.

## Independent checks

`scripts/verify-public-redemption.mjs` checks canonical receipts, exact guard deployment bytecode/constructor input, pinned factory/owner/native bindings, native borrower-update logs, full MUSD burn amount, pool entitlement and BTC conservation. `verify-surplus-claim.mjs` checks the canonical owner claim and exact fixed-block entitlement/BTC deltas. `verify-surplus-recovery.mjs` checks both withdrawals, exact owner returns net of gas and empty final account/guard state. No raw signed transactions or private keys are published.

13 guard tests and all 57 non-fork contract regressions passed. A separate native integration fork passed with real native lending/token/pool contracts, replaying the unavailable oracle precompile and test-only chain ID locally. The public proof above uses actual Mezo testnet without mocks or overrides.

The new account and guard have exact-match explorer source verification. See `deployments/wave2-surplus-source-verification.json`.

## Public interface observation and scope

The public app read the actual account before claiming: block 16,599,700 displayed 0.00553221242452061 claimable BTC and the surplus-claim action. After claiming, a refreshed read at block 16,599,739 displayed zero entitlement and removed the claim action. Saved evidence: `docs/reviews/evidence/wave2-public-surplus-before.png`, `wave2-public-surplus-before.txt`, and `wave2-public-surplus-after.txt`. The browser was read-only and not connected to the fixture owner; the dedicated wallet signed through the QA script. This is not a Rabby surplus-signing acceptance test.

All funding is recycled test assets and faucet BTC. This is not seller acceptance, customer traction, revenue, an audit or mainnet proof. Interviews remain on hold.
