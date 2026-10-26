# Tillward

BTC-backed working capital, repaid from customer receipts.

**Live product:** https://tillward.vercel.app
**Two-minute pitch:** https://tillward.vercel.app/pitch.html
**Deck:** https://github.com/ShalyX/tillward/releases/download/v0.1.1/deck.pdf
**Public code:** https://github.com/ShalyX/tillward

## What it does
Tillward gives BTC-holding businesses MUSD working capital and uses the owner's chosen share of customer receipts to repay the native Mezo loan while preserving an operating cash floor.

## Problem and workflow
An independent agency or seller can hold BTC while needing stable money for contractors, supplies or its next project. Repayment remains a separate task when customer payments arrive.

Create a business account, supply BTC collateral, and borrow MUSD through native Mezo BorrowerOperations. Choose a repayment percentage and cash floor. Create a final-payment invoice and share its checkout link. The customer approves the exact MUSD amount, then pays. The account records the receipt and reserves the configured allocation. Eligible allocations reduce that account's native Mezo debt. Minimum debt can defer small repayments.

With a 20% rule, an illustrative 500 MUSD receipt allocates 100 toward repayment and leaves 400 for operations, subject to account and protocol limits. The owner can inspect history, edit or pause future routing, top up MUSD, close the loan and recover released BTC. The hosted keeper discovers factory accounts and settles eligible allocations; it cannot change policy, withdraw or redirect funds.

MUSD is the actual borrowing, customer-payment and repayment asset. MEZO token is not integrated in this release.

## Target users and track
Independent agencies, studios and sellers that hold BTC, understand collateralized borrowing and are willing to accept MUSD. Desktop-first EVM-wallet workflow with responsive read and checkout layouts. No regional adoption or mobile-wallet compatibility claim. Demand is a hypothesis to validate. Primary fit: Track 1, DeFi; invoice checkout also supports access and distribution.

## Stack and project status
New project built for this buildathon, originally called Paydown. Working Mezo public testnet deployment, chain 31611. Solidity 0.8.24, Foundry, TypeScript, Vite, viem, native Mezo MUSD/BorrowerOperations/HintHelpers, Node.js keeper with systemd, Vercel and GitHub Actions. Native source credits: NOTICE.md.

## Evidence
A separate customer wallet paid 500 MUSD and 100 reduced native debt. Later recorded totals: 502 collected and 100.4 repaid. Rabby-in-Chrome QA completed a 2,000 MUSD loan against 0.045 test BTC, invoice payment, repayment, top-up, closure and return of all collateral. The keeper enrolled three accounts and retained a repayment result across restart. Public CI covers application and Solidity checks. Machine-readable proofs: deployments/.

All figures are testnet integration evidence using test assets, not customer revenue or adoption. No mainnet deployment or independent audit. Loans carry interest, liquidation and redemption risk.

## Next three milestones
Proposed roadmap, dependent on validation:
1. Within two weeks after Wave 1: interview 5–10 BTC-holding agencies or sellers and validate MUSD acceptance, invoice language, repayment share and cash-floor needs.
2. Within four weeks: a small testnet pilot informed by those findings, broader wallet/RPC failure coverage, an isolated runtime restore drill and monitoring outside both current hosts.
3. Within eight weeks: independent contract/integration review if demand supports continuing; pin the target protocol version and make a separate mainnet-readiness decision.

## Team
Shaly — solo builder, product and engineering. https://x.com/shalyx_04
Built by ElseMade.

Deck, video, captions and editable source downloads: https://github.com/ShalyX/tillward/releases/tag/v0.1.1