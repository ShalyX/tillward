# Revenue-linked working capital

Idea locked 2026-10-22 by the user's "lets get to it" after selecting Paydown. Paydown remains a working name; final identity is undecided.

## Product
A BTC-holding independent business borrows MUSD for operating expenses, receives final customer payments in MUSD, and allocates its chosen percentage to native Mezo debt repayment. The owner retains control of operating cash, a minimum cash floor, and future repayment routing. The proof is lower protocol debt, not an animated balance.

Primary user: an independent agency or seller holding BTC and already willing to collect MUSD. Demand among these users is a hypothesis. Shopify's revenue-linked repayment validates the category, not this audience.

Core flow: create business account -> supply BTC and borrow MUSD -> set repayment percentage/cash floor -> create final-payment invoice -> customer pays MUSD -> repayment allocation accumulates -> bounded settlement reduces Mezo debt -> operating funds remain withdrawable -> inspect transaction evidence.

## Scope
Required: R01-R09 in REQUIREMENTS.md. One chain, Mezo testnet, one borrower account per business. Onchain invoices and receipts, configurable split, cash floor, pause/resume, explicit deferred repayment and transaction reconciliation. Wallet approves all user actions. Permissionless settlement can only repay the fixed account's debt.

Excluded: fiat, Shopify/Gmail integration, refund/dispute commerce, revolving credit scoring, yield strategies, other chains, production/mainnet financial operations. Only final nonrefundable customer payments are automatically eligible in this slice. No promise to preserve BTC against liquidation or redemption.

## Award and distribution
Mezo Buildathon: https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10 . Target proportional judged allocation in Track 1/2, $2,000 MEZO Wave 1 and $5,000 MEZO Wave 2. Rewards are tokens, require KYB; no expected payout asserted. User authorized building this product; registration, legal declarations, public posting and submission remain separate actions. Core-team evaluation and November 23 top-team demo are distribution routes, not adoption guarantees.

## Decisions
- 2026-10-22: build fresh selected concept; provisional name.
- 2026-10-22: prioritize real repayment feasibility and complete testnet vertical slice. No other active project modified or displaced automatically.
- First experiment: pin official source/deployments; prove a borrower-owned contract can repay its own native loan. If not feasible, report rather than replace the mechanism.
- Scope budget: 4-6 focused developer-days including finishing. This is a planning estimate, not a time promise. First dependency investigation capped at one focused day.
