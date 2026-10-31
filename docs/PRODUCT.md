# Tillward product lock

Locked by owner decisions on October 22, 2026. The canonical detailed definition remains PROJECT_BRIEF.md.

Target user: an independent BTC-holding agency, studio or seller willing to collect MUSD.

Problem: operating expenses need stable money while customer receipts arrive over time. Native borrowing and repayment are otherwise separate jobs.

Product thesis: BTC-backed MUSD working capital with receipt-linked repayment chosen by the owner.

Primary workflow: create business account, supply BTC/borrow MUSD, set repayment share and cash floor, create a final-payment invoice, collect MUSD, apply eligible allocations to native Mezo debt, inspect progress, close and recover collateral when appropriate.

Magic moment: a paid invoice leaves operating cash available and reduces the business's actual native debt.

The contracts, keeper, recovery logic and monitoring support that workflow. They are not the product's main purpose. Test cases exercise the workflow and do not replace its user experience.

Non-goals: fiat collection, Shopify, credit scoring, yield, multichain, refunds/disputes, mainnet financial operations in this slice. Do not reframe Tillward as an autonomous agent or a safety dashboard.

Assumptions: BTC-holding businesses may want MUSD operating funds and receipt-linked repayment. Target-user demand is unvalidated. Native minimum debt limits partial repayment; final minimum principal requires owner closure. Collateral remains subject to liquidation/redemption.
