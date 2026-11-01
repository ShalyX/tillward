# Wave 2 release and live collateral verification

November 1, 2026 (WAT). Interviews remain on hold. This report separates public deployment, owner signing, native testnet evidence and fork-only evidence.

## Public release

- App: https://tillward.vercel.app . Release `2026-11-01-wave2-loan-conditions-1`.
- Application commit: `3e646d8fe8b29ddea4c0cca052e1091773ab75f2`.
- Vercel deployment `dpl_46QAtcRJjgEyziH4PTLh4UjJSsbj`, READY, production alias assigned. Immutable URL: https://tillward-2jmml9829-shalyxs-projects.vercel.app . Local CLI packaging retained the Git-excluded pitch media; public pitch page rendered after deployment. Fresh playback metadata was not independently verified.
- GitHub Actions run 41253783116 succeeded. Local 36 JavaScript checks, production build and credential scan passed before upload. Keeper and Solidity production contracts were not changed.
- Chrome rendered actual demo account conditions at block 16,494,631: BTC price $77,398.39, ICR 165.68%, TCR 277.96%, Recovery Mode inactive and zero surplus. These are observed historical values, not current risk assurances. See evidence/wave2-public-loan-conditions.*.
- The owning Rabby wallet connected to the correct QA account. Without a loan, the panel displayed no active loan and kept collateral top-up disabled. With the new loan it showed native conditions and enabled the owner action. Neither receipt share nor cash floor was changed.

## Public-testnet owner flow

Owner: `0x1dcb045123730e606a88380bce534332f50332d2`. Business: `0x791fFc8A7420dBB0ed5D9F28E811ec7576936433`. The owner handled all Rabby confirmations. All assets were test assets.

| Action | Transaction | Block | Verified result |
|---|---|---:|---|
| Open loan | `0xb289e2c8a8a6856ef99e2dfebfd3f5a60c9c0f66ac8db95015e01c16023c79d1` | 16,494,741 | 2,000 test MUSD borrowed against 0.045 test BTC |
| Add collateral | `0xb3e2c5c772efcf8d02f7767bedb2e19f581e600fa70f0d9f27dd7324df599f08` | 16,494,807 | Native collateral increased exactly 0.001 test BTC to 0.046 |
| Close loan | `0x1ab792f220821a0b472aef5c2404c9bf02b8fcde47ecdf9143c9a71c065c2771` | 16,494,872 | Native loan closed; posted collateral returned to business account |
| Withdraw BTC | `0x5955a723edd855e480c51d4b6ad1ce43d790e7a71311216200b20bc6b71662e3` | 16,494,884 | Exactly 0.046 test BTC returned to owner, independently accounting for withdrawal gas |

Canonical machine-readable evidence: deployments/wave2-loan-open.json, wave2-collateral-topup.json and wave2-loan-exit.json. Use the JSON receipt block if an approximate UI observation differs from the table. The final verifier requires zero account BTC, debt, posted collateral, active loan and pending allocation. Withdrawn BTC excludes native borrowing fees paid in MUSD; owner BTC receipt is measured net of transaction gas.

The HTTP endpoint temporarily returned inconsistent receipt/transaction data. A confirmed loan remained safely locked in the app, including after Retry. Reopening the app established a fresh RPC connection, reconciled the saved exact transaction, and displayed the active loan. No journal was manually cleared and no loan was submitted twice. This proves safe recovery in that observed case; it does not establish exhaustive RPC failover coverage. See evidence/wave2-loan-recovered.txt.

## Surplus recovery: native fork proof

`npm run fork:surplus` passed one native integration test, with zero failures/skips. It pins a local fork of Mezo mainnet block 12,684,025. The recorded native oracle precompile result is replayed; lending, token and collateral-surplus contracts are not mocked. All funding and writes stay inside the local fork. No mainnet transaction was broadcast.

The fixture creates its own lowest-ratio test borrower, redeems only that account using one native iteration, proves redemption status 4 and a positive surplus, then calls the product's `claimSurplus` (native `claimCollateral`). It verifies the exact BTC credit, consumed entitlement, separate owner withdrawal and rejection of a second claim. Source: test/NativeSurplusFork.t.sol; result: deployments/wave2-surplus-fork.json.

Initial Validation Cloud access failed due workstation DNS; the official Boar endpoint completed the same pinned fork test. The regular contract CI excludes both opt-in fork suites so an early return without RUN_NATIVE_FORK cannot be counted as integration evidence.

## Remaining work

Public-testnet `claimCollateral` proof is still open: the QA account has no recorded surplus, and ordinary closure is not a surplus claim. Any public redemption experiment must enforce that it touches only the owner's test borrower, constrain iterations, and simulate before the owner signs. The observed sorted-list tail was another address; that alone does not establish the identity of the first eligible redemption target. Do not redeem unrelated borrowers to manufacture evidence.

The proposed revenue-model direction awaits the owner's choice. No fees or paid access were enabled. Interviews, selected pricing, pilot, isolated operational restore, independent monitoring, and revised Wave 2 deck/video/submission remain separate open items. No adoption, audit, mainnet deployment, organizer rescore or Wave 2 submission is claimed.
