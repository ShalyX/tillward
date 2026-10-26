# AKINDO project answers

Prepared copy for review and entry. Public overview requirements were checked October 25. Authenticated form character limits may require shortening. No entry has been submitted.

## Project name
Tillward

## Category (3–5 words)
Revenue-linked BTC working capital

## One-sentence TL;DR
Tillward gives BTC-holding businesses MUSD working capital and uses their chosen share of customer receipts to pay down the loan while preserving an operating cash floor.

## Problem and product
A small business can hold BTC while still needing stable money for contractors, supplies or its next project. Borrowing MUSD addresses the immediate funding need. Repayment remains a separate job as customer payments arrive.

Tillward connects those two parts of the business. The owner opens a BTC-backed MUSD loan, sets the share of final customer payments to allocate toward repayment, and keeps a minimum amount available for operations. Each invoice payment records its allocation. Eligible funds then reduce that same business account's native Mezo debt.

The product is for an independent agency or seller that already holds BTC and is willing to collect MUSD. Demand from this audience remains a hypothesis. The current build demonstrates the complete workflow on Mezo testnet.

## How it works and MUSD/MEZO integration
The business creates its own account through RevenueFactory. That account supplies BTC to native Mezo BorrowerOperations and borrows MUSD. The owner chooses the receipt allocation percentage and cash floor, then creates final-payment invoices with shareable checkout links.

A customer approves the exact invoice amount and pays MUSD. RevenueAccount records the receipt and reserves the configured share. The hosted keeper discovers factory accounts and applies eligible allocations to their native debt. Anyone can trigger the same settlement, but it cannot redirect funds or repay a different account. Protocol minimum debt can defer small allocations until they are eligible.

The owner can inspect activity and transaction evidence, change future routing, pause it, top up MUSD, close the loan and withdraw released BTC. MUSD is the actual borrowing, customer-payment and repayment asset. Tillward does not integrate MEZO token in this release.

## Target users
Independent agencies, studios and sellers that hold BTC, understand collateralized borrowing and already accept or are willing to accept MUSD. The initial interface targets desktop browsers with an EVM wallet, with responsive read and checkout layouts. No regional adoption or mobile-wallet compatibility claim is made. Interviews and payment-acceptance validation are the next product step.

## Track
Primary: Track 1, DeFi for MUSD/MEZO. Native borrowing and receipt-funded native repayment are the core integration. Track 2 can be selected as a secondary fit for invoice checkout and onboarding, if the form allows both.

## Chain and readiness
Mezo public testnet, chain ID 31611. Working contracts, web app, invoices and hosted repayment. No mainnet deployment and no independent audit.

## New project or extension
New project built for this buildathon. Tillward was initially developed under the working name Paydown. Native Mezo contracts are integrated at their deployed addresses, with minimal interfaces and the pinned source credited in NOTICE.md.

## Tech stack
Solidity 0.8.24, Foundry, TypeScript, Vite, viem, native Mezo MUSD/BorrowerOperations/HintHelpers, a Node.js settlement keeper hosted with systemd, static web hosting on Vercel, and GitHub Actions for application and contract checks.

## Verified evidence
- A separate sample customer paid a 500 MUSD invoice and triggered 100 MUSD of native debt repayment.
- Later recorded demo totals reached 502 MUSD collected and 100.4 MUSD repaid at block 16,302,866.
- Rabby-in-Chrome QA completed a 2,000 MUSD loan against 0.045 test BTC, payment, repayment, MUSD top-up, closure and recovery of all collateral.
- The hosted keeper discovered three accounts, including one created after startup. A subsequent 0.2 MUSD repayment retained its transaction result through restart.

All figures above are testnet integration evidence funded with test assets. They are not revenue, customers or adoption metrics. Machine-readable proofs are in deployments/.

## Next three milestones and timelines
Proposed roadmap, dependent on validation rather than a delivery guarantee:

1. Within two weeks after Wave 1: interview 5–10 BTC-holding agencies or sellers and test willingness to invoice in MUSD. Validate invoice language, repayment share and cash-floor needs before adding connectors.
2. Within four weeks: use those findings for a small testnet pilot, expand wallet-rejection/RPC-failure coverage, complete the isolated runtime restore drill and add monitoring outside both current hosts.
3. Within eight weeks: commission independent contract/integration review if demand supports continuing. Pin the target protocol version and produce a separate mainnet readiness decision. Mainnet launch depends on passing those gates.

## Links
Product: https://tillward.vercel.app

Real business: https://tillward.vercel.app/?account=0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5

Source: https://github.com/ShalyX/tillward

Deck PDF: https://github.com/ShalyX/tillward/releases/download/v0.1.1/deck.pdf

Two-minute pitch: https://tillward.vercel.app/pitch.html

Direct video: https://github.com/ShalyX/tillward/releases/download/v0.1.1/demo.mp4

Editable deck and video source: https://github.com/ShalyX/tillward/releases/tag/v0.1.1

## Team and public profile
Team name: Shaly.

Member: Shaly. Role: Builder, covering product and engineering for this entry.

X: https://x.com/shalyx_04

The owner confirmed both public names and the X profile. ElseMade remains the product's builder credit. Private contact details, registration, age/location/employment eligibility and participation terms still require owner completion. No legal or identity declaration is filled automatically.
