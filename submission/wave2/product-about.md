# Tillward

BTC-backed working capital, repaid from customer receipts.

**Live product:** https://tillward.vercel.app/

**Two-minute Wave 2 pitch:** https://tillward.vercel.app/pitch.html

**Wave 2 deck:** https://tillward.vercel.app/media/tillward-wave2-deck.pdf

**Public code:** https://github.com/ShalyX/tillward

**Judge guide:** https://github.com/ShalyX/tillward/blob/main/submission/wave2/judge-guide.md

## What it does

An agency, studio or seller can hold BTC while needing stable money for contractors, supplies or its next project. Tillward connects BTC-backed MUSD working capital to the customer payments that arrive afterward.

Create a business account, borrow MUSD against BTC through native Mezo lending, and choose the share of receipts that goes toward repayment, up to 99%. Review the fee and enable automatic repayments when ready. Create a final-payment invoice and share its checkout link. The customer approves the exact MUSD amount, then pays. Eligible receipt allocations reduce that business account's native loan.

Tillward charges 1% of the amount actually repaid through hosted receipt routing, paid from retained receipt funds. Repayment and fee settle atomically. The lender receives the full valid repayment. There are no unpaid or deferred fees. At 20%, an illustrative 500 MUSD receipt repays 100 MUSD, pays a 1 MUSD service fee and leaves 399 MUSD with the business, when native debt and account limits permit that repayment.

Current V3 accounts cap combined receipt allocations to the remaining payable loan debt. Closing the loan clears leftover allocations and fee reservations automatically. Receipts without an active loan remain available. Native minimum debt still requires explicit owner closure; the owner may need to top up MUSD first.

Pause automatic repayments in Repayment rules. Manage manual repayment, collateral top-up, closure, surplus claims and withdrawals in Manage loan. Those owner actions do not incur Tillward's routing fee. Native protocol and network fees are separate. Existing V1 accounts remain fee-free; immutable V1/V2 accounts retain their original contract behavior.

## MUSD, Mezo and the intended user

MUSD is the actual borrowing, invoicing, collection and repayment asset. Tillward calls native Mezo BorrowerOperations and reads BTC price, individual/system collateral ratios, Recovery Mode and surplus entitlement. The MEZO token is not integrated in this release.

The intended users are independent BTC-holding agencies, studios and sellers who understand collateralized borrowing and are willing to collect MUSD. Desktop EVM-wallet workflow with responsive read and checkout layouts. No regional adoption or mobile-wallet compatibility claim. Primary fit: Track 1, DeFi; invoice checkout also supports access and distribution.

## Progress since Wave 1

- Added native loan-risk visibility and owner collateral controls. Public top-up raised collateral from 0.045 to 0.046 test BTC, followed by complete owner exit.
- Exact-match verified factory and representative account sources on the explorer.
- Proved an opt-in atomic fee: a 500 test MUSD receipt at 99% repaid 495 MUSD, paid a 4.95 MUSD fee and retained 0.05 MUSD.
- Verified pause, a 9.9 MUSD manual repayment without a new service fee, native closure and collateral recovery.
- Claimed actual native redemption surplus of 0.005532212424520610 test BTC, then returned it to its owner. A test-only guard restricted the controlled redemption to our own borrower.
- Deployed V3 and proved a 2,600 MUSD receipt at 80% was capped to the loan debt. Hosted repayment and fee settled; owner closure left zero allocations/fee reserve and 595.979326 MUSD available. A later receipt allocated zero. All remaining funds and 0.045 test BTC were recovered without an allocation-release transaction.
- Simplified repayment rules and loan management. Monitoring and encrypted backups cover three versioned keepers; isolated same-host V2/V3 restore checks passed.

Public proofs: https://github.com/ShalyX/tillward/blob/main/docs/EVIDENCE.md

V3 report: https://github.com/ShalyX/tillward/blob/main/docs/reviews/WAVE2_V3_LIVE_VERIFICATION.md

All figures are controlled Mezo testnet QA, not customer revenue or adoption. Seller/payer acceptance and willingness to pay remain unvalidated. V3 and surplus proof used a dedicated QA CLI signer with read-only browser observation; earlier V2 owner flows used Rabby. The film retains labeled V2 recordings, while the deck and guide include V3. No independent audit or mainnet deployment. Collateral remains exposed to liquidation and redemption. Off-host monitoring depends on the owner's workstation; runtime restore proof used the same VPS, not a second host.

## Stack and status

New project built for this Buildathon, initially named Paydown. Working Mezo public testnet deployment, chain 31611. Solidity 0.8.24, Foundry, TypeScript, Vite, viem, native Mezo lending/MUSD/HintHelpers, Node.js keepers with systemd, Vercel and GitHub Actions. Native source attribution: NOTICE.md in the repository.

## Next three milestones

These are conditional planning windows. no mainnet launch date is promised.

1. Over a two-week validation cycle: test business and payer willingness to use MUSD invoices, receipt-linked repayment and the proposed pricing.
2. Within four weeks after willing participants are identified: run a small testnet pilot, measure repayment volume, gas sponsorship and support time, and exercise recovery on a second host.
3. Target four to six weeks after the pilot, subject to results and review budget: obtain independent contract/integration review and make a separate mainnet-readiness decision.

## Team

Shaly: solo builder, product and engineering. https://x.com/shalyx_04


Wave 2 deck, film, captions, editable sources and proof bundle: https://github.com/ShalyX/tillward/releases/tag/v0.2.1-wave2
