# Tillward status

Updated 2026-10-22. Working Mezo testnet product. Final name and receipt-counter identity selected by the owner. Not submitted to the hackathon. Existing Site remains owner-private.

## Verified

- Recovery: confirmed receipt block chosen before clearing pending state; persisted monotonic snapshot bound; pending reconciliation polling; session wallet reconnection; explicit 45-second snapshot timeout.
- History: gap-free 2,000-block reads in paginated 10,000-block pages; older activity and 50-invoice pages remain accessible; exact older checkout lookup preserved; full loan closure appears in repayment history.
- Guided onboarding: create account, supply BTC/borrow, save rule, create invoice and copy checkout link. Loan controls include MUSD top-up, full closure and BTC recovery.
- 20 contract tests, 128 split fuzz runs, 12 JS tests and expanded native fork test passed. Fork test covers collateral addition, repayment, close and owner BTC recovery with disclosed oracle replay.
- **Rabby in Chrome public testnet flow passed:** account creation, 2,000 MUSD loan / 0.045 BTC collateral, rule save, 1 MUSD invoice, exact token approval, payment, 0.2 MUSD repayment, 3 MUSD top-up, full loan close and recovery of all 0.045 BTC. Owner handled extension confirmations. Independent chain verifier checked transaction senders/calldata/events, exact token burns, zero remaining debt/allocation/account BTC and owner's exact BTC increase net of gas. See ../deployments/browser-wallet-proof.json.
- **Hosted keeper passed:** separate gas-only wallet, isolated systemd service, atomic signed-transaction journal, exclusive lock, gas budgets and health record. It independently settled a subsequent 0.2 MUSD allocation on the original demo account. Restart retained the last confirmed result. See KEEPER_OPERATIONS.md and ../deployments/hosted-keeper-proof.json.
- Tillward mark/wordmark/monochrome variant, favicon, share card, typography and app theme implemented. See BRAND.md. Source/build scan found no dedicated wallet keys.

## Accounts and evidence

- Original demonstration account: 0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5. Original 500/100 proof is historical; later keeper proof records 501 MUSD collected, 100.2 repaid, zero pending. Its loan remains open for demonstration.
- Rabby QA account: 0x791fFc8A7420dBB0ed5D9F28E811ec7576936433. Loan closed; BTC returned to owner. Browser payer was the same owner. Separate-customer behavior is established by the original proof. Test funds originated from faucet BTC/native test loans; no adoption or revenue claim.
- Existing private preview: https://revenue-working-capital.famous-buddy-6924.chatgpt.site . This update's exact source/deployment receipt is maintained outside the repository in ../tillward-release.md after publication.

## Remaining scope and limits

Public judge access, public GitHub, deck, two-minute video, platform form, eligibility/legal declarations and exact deadline timezone remain submission work. No mainnet operations or audit claimed.

Official RPC responses remain intermittently inconsistent. Verified fixed-block reads and explicit errors preserve safety; one historical strict verifier failure is not erased by later successful checks. Wallet-change/rejection stress coverage is not exhaustive. Keeper currently watches the original demo account; arbitrary new accounts can use manual settlement and need explicit keeper enrollment. No external alert channel is configured. VPS has about 0.5 GB service-available disk space; capacity management remains necessary before broader operation.

Backlog: Shopify connector, fiat rails, multichain, refunds/disputes and yield. None is committed.

## Canonical documents

PROJECT_BRIEF.md, REQUIREMENTS.md, RESEARCH_AND_RESOURCES.md, ARCHITECTURE.md, PRODUCTION_PLAN.md; QA_REPORT.md records checks, BRAND.md identity, KEEPER_OPERATIONS.md service ownership, SUBMISSION.md remaining packaging.
