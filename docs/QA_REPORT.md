# QA report

Checked 2026-10-22. Working testnet product; hackathon submission remains pending.

| Check | Requirement | Result and evidence |
|---|---|---|
| Q01 | R01-R07 contract authority/funds | Pass: 20 Foundry tests, including 128 split fuzz runs. Owner isolation, one-time invoices, expiry/cancellation, exact token delivery, fee-token rollback, pause, allocation/cash-floor protection, failed repayment rollback, bounded permissionless settlement, native floor, collateral top-up, close rollback and owner BTC recovery. |
| Q02 | R02/R05/R06 native integration | Pass: expanded native fork test opens and repays a loan, adds collateral, uses a second native borrower for a top-up, closes and recovers BTC. Native lending/token code unchanged. Exact captured oracle-precompile response is replayed locally because Foundry lacks that Mezo precompile. |
| Q03 | R02/R04/R06 public chain | Original 500 MUSD customer payment / 100 MUSD native repayment observed and recorded. Later hosted keeper independently repaid 0.2 MUSD; its standalone verifier passed exact event/debt checks. Browser flow adds an independently verified public native loan exit. Separate proof files retain each historical snapshot. |
| Q04 | R03/R05/R08 correctness | Pass: 12 JS tests cover decimal precision, invalid inputs, integer split/floor conservation, native interest-first hint ratio, executor cap/gas budget, stale-head receipt recovery, missing/reverted receipts and gap-free history pagination beyond 10,000 blocks. |
| Q05 | R09 build | TypeScript and optimized Vite production build passed. Publication helper runs the final build against the exact source version. |
| Q06 | R09 browser layout | Desktop/narrow baseline inspected; final Tillward interface checked in Chrome. Fresh screenshots and release-specific checks are recorded in ../tillward-release.md. |
| Q07 | Browser signing/full journey | Pass: owner drove Rabby confirmations in Chrome for account creation, 2,000 MUSD borrowing with 0.045 test BTC, rule save, 1 MUSD invoice, exact approval and payment, 0.2 MUSD repayment, 3 MUSD top-up, close and 0.045 BTC recovery. App showed paid invoice, actual debt reduction, loan closed and account BTC zero. Independent script checks receipt success, sender, calldata/events, native token burns, zero debt/allocation and exact owner BTC increase net of gas. See ../deployments/browser-wallet-proof.json. |
| Q08 | Recovery | Confirmed receipt anchors account reads before pending is cleared; persisted anchor never regresses; missing receipt preserves pending hash; idle reconciliation; approved wallet reconnects on session refresh. Browser refresh recovered the connected account and actual state. Read failures show explicit errors with a 45-second total snapshot timeout. Journals precede CLI broadcast; same raw bytes are reused on uncertain outcomes. |
| Q09 | Hosted automation | Pass for original demo account: isolated boot-enabled systemd service performed unattended repayment from a separate gas-only wallet. Restart retained last confirmation. Private journal/wallet 0600, exclusive process lock, atomic writes, chain/registry/freshness checks, gas caps and health record. No external alerting or automatic enrollment of arbitrary new accounts. |
| Q10 | Identity/materials | Tillward identity selected and implemented in UI, checkout, title, favicon and share assets. Public GitHub, public judge access, deck, two-minute video, declarations and submission remain pending. |

## Evidence

- Original demo account: 0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5. ../deployments/public-testnet-proof.json records the 500/100 snapshot.
- ../deployments/hosted-keeper-proof.json independently verifies 501 MUSD collected, 100.2 repaid and zero pending at block 16298796.
- Rabby account: 0x791fFc8A7420dBB0ed5D9F28E811ec7576936433. Browser payment 0x2aa8628b557e096f402a6924e8e55d4e2f8dcb8a84e1a8d964a911a3f4274f36; repayment 0xa46f23847005361b0efa5ee59dce4eb10bf1c8fe42c1dc7c7948d2d36505764a; close 0x55893804579a1a3e08d4fa91cbc88560af24ae72945363152da81cd4460b1e1f; BTC recovery 0x27578fd073cd1395ed40baf853e9d7f04885d1c75b53fd57c9aadfab241428bd, block 16301938.
- Browser QA payer was the owner, using test MUSD sourced from the original demo loan. Separate-customer/nonowner settlement is established by the original integration proof. No actual revenue or adoption claimed.

## Findings addressed

1. An initial gas estimate fell below EIP-7623 intrinsic calldata requirements; the rejected transaction was not mined. Simulations and appropriate transaction gas floors are used.
2. An initial public settlement reverted from native SortedTroves traversal gas exhaustion with empty hints. Native HintHelpers/SortedTroves now provide insertion positions. Exact debt/token accounting was retained.
3. HTTP and some WebSocket sessions returned stale heads, empty reads and missing confirmed receipts. Fixed-block snapshots, WebSocket preference, bounded retries, explicit stale/error states and receipt-derived monotonic anchors were added. The old strict standalone verifier failed on some unsynchronized sessions; it is not retroactively marked passed. Later keeper/browser verifiers independently succeeded.
4. Recovered transaction receipts previously cleared pending before advancing the view block. Regression tests now cover this ordering and missing/reverted receipts.
5. History previously stopped entirely after 10,000 blocks from deployment. It now loads bounded, contiguous pages; failed chunks do not silently disappear. Invoice pages and exact historical checkout lookup coexist.
6. Loan setup was buried in Activity. Owner onboarding now links the next required step; fully completed businesses are not sent back to initial setup after closing.

## Remaining boundaries

Adversarial wallet-change/rejection and RPC failover coverage is not exhaustive. Existing contract tests cover failed effects and replay. No independent audit or mainnet use. Keeper enrollment/operations are now implemented: three accounts discovered live, a new account picked up without restart, another 0.2 MUSD settlement and same-hash restart recovery independently verified. 21 JS tests cover discovery pagination/restart/failure, fair rotation, journal validation, operational thresholds and Telegram deduplication/recovery/backoff. Health and backup timers passed on the VPS. See KEEPER_ENROLLMENT.md for Telegram activation and remaining infrastructure limits. All chain proofs are testnet integration evidence.
