# Tillward — Wave 2 project answers

Prepared November 6, 2026. Draft submission package; not submitted to Wave 2. Wave 1 receipt and original materials remain unchanged.

## Project name
Tillward

## Category
Receipt-linked BTC working capital

## One-sentence description
Tillward lets BTC-holding businesses borrow MUSD and put their chosen share of customer receipts toward repayment.

## Problem and product
A business can hold BTC while needing stable money for contractors, supplies or its next project. Borrowing MUSD supplies that working capital. Tillward connects repayment to the customer payments that arrive afterward.

The owner creates a business account, borrows against BTC and chooses a repayment percentage. Each final-payment MUSD invoice records its receipt and allocation. With the owner's consent, hosted settlement applies eligible funds to that same account's native Mezo loan. The rest remains with the business, after the disclosed service fee. The owner can pause automation, manage the loan and recover available collateral.

The intended user is an independent agency, studio or seller that holds BTC and is willing to collect MUSD. Customer and payer acceptance remains unvalidated. Interviews are on hold at the owner's request. The software and transactions described here use public testnet assets.

## MUSD and Mezo integration
MUSD is the actual borrowing, invoicing, payment and repayment asset. The business account calls native Mezo BorrowerOperations and reads native debt, collateral, BTC price, individual/system collateral ratios, Recovery Mode and surplus entitlement. The integration is part of the working-capital workflow. Tillward does not integrate the MEZO token in this release.

A customer approves the exact invoice amount and pays the onchain invoice. The chosen share becomes pending repayment. Native debt limits still apply: partial repayments stop at the protocol minimum debt plus reserve; the owner tops up if needed and explicitly closes the final portion. Receipt repayment does not protect BTC against liquidation or redemption.

## Revenue model
V2 implements a 1% service fee on the amount actually repaid through hosted receipt routing. The maximum repayment allocation is 99%. The lender receives the full valid repayment; the fee comes from the business's retained receipt funds. Repayment and fee settle atomically. There are no unpaid fees or deferred collection. Existing legacy repayment limits constrain the repayment calculation; the authorized fee may take the remaining cash below that limit, while other pending repayment funds stay protected.

For an illustrative 500 MUSD receipt at 20%: 100 MUSD repays the loan, the service fee is 1 MUSD, and 399 MUSD remains. The public maximum-allocation QA used 99%: 495 repaid, 4.95 fee, 0.05 retained. V2 enrollment is explicit and off by default; V1 accounts remain fee-free. Owner manual repayment, closure, collateral top-up and surplus recovery do not incur Tillward's routing fee. Wallet/network and native protocol fees remain separate.

Costs are documented in docs/PRODUCTION_ECONOMICS.md. The shared VPS bill is USD 5/month. Frontend, RPC, support and gas scenarios are estimates or explicitly dated measurements. A standalone V2 testnet settlement used 489,763 gas; repricing that receipt size at a historical mainnet quote is not measured mainnet operating cost. The fee model is implemented and tested, but commercial willingness to pay and unit economics are not validated.

## Changes since Wave 1
1. Added native loan conditions to the actual workspace: BTC oracle price, ICR/TCR, Recovery Mode and actionable owner collateral controls, with stale/unavailable states.
2. Verified factory and representative account sources on the explorer, including the separate V2 factory, fee QA account and surplus fixture.
3. Proved owner collateral top-up on public testnet: 0.045 -> 0.046 test BTC, then full owner exit.
4. Closed the public surplus gap: controlled redemption of only our own borrower created 0.005532212424520610 test BTC of native surplus. The existing Tillward account claimed it, then the owner withdrew it; canonical entitlement and BTC deltas were independently verified.
5. Implemented and deployed the 1% atomic fee model in separate V2 contracts, preserving V1 accounts. Verified a real 500 MUSD receipt, 495 MUSD native repayment, 4.95 MUSD fee and 0.05 MUSD retained.
6. Verified V2 opt-out, exact 9.9 MUSD manual repayment without a new service fee, native closure and 0.045 test BTC return net of gas.
7. Simplified the interface: percentage and automation consent in Repayment rules; manual repayment and exit actions in Manage loan. Removed the separate settings tab and operating-reserve editor.
8. Extended health monitoring and encrypted off-host state backups to both keepers. Telegram outage/recovery tests and an isolated same-host runtime restore passed. Workstation availability and second-host recovery remain disclosed limits.

The surplus guard is a test-only fixture that prevents redemption of unrelated borrowers; it is not a Tillward product feature. The browser displayed real before/after entitlement, while the dedicated QA wallet signed the fixture transactions through a script. It is not a Rabby surplus-signing acceptance claim.

## Target users and devices
Independent BTC-holding agencies, studios and sellers already willing to accept MUSD. The primary transaction interface is a desktop browser with an EVM wallet; owner flows were exercised with Rabby in Chrome. Responsive read/checkout layouts were inspected. No regional adoption or mobile-wallet compatibility claim is made.

## Track, chain and readiness
Primary: Track 1, DeFi. Invoice checkout and onboarding also support Track 2, Access and Distribution, if both are selectable. Mezo public testnet, chain ID 31611. Working public app, verified contracts and hosted repayment. No mainnet deployment or independent audit.

## New project or extension
New project built for the Mezo Buildathon, initially named Paydown. Wave 2 extends the submitted Tillward product. Native interfaces and source attribution are pinned in NOTICE.md.

## Tech stack
Solidity 0.8.24, Foundry, TypeScript, Vite, viem, native Mezo lending/MUSD/HintHelpers, Node.js keepers with isolated state and systemd supervision, Vercel frontend and GitHub Actions.

## Next three milestones
1. When the owner resumes validation: speak with BTC-holding businesses and their payers about acquiring/spending MUSD, invoice wording, repayment shares and pricing. The previous 5–10 interview count was our research target, not a Mezo entry requirement. No outreach or interviews are claimed.
2. After willing participants are identified: run a small testnet pilot, measure repayment volume/support time and actual sponsorship costs, and add always-on monitoring plus a second-host recovery exercise. Timing depends on participation.
3. If demand supports continuing: commission independent contract/integration review and prepare a separate mainnet-readiness decision. A commercial launch depends on those gates.

## Links
- Public app: https://tillward.vercel.app/
- Source: https://github.com/ShalyX/tillward
- Wave 2 judge guide: https://github.com/ShalyX/tillward/blob/main/submission/wave2/judge-guide.md
- Wave 2 proof index: https://github.com/ShalyX/tillward/blob/main/docs/EVIDENCE.md
- Atomic fee proof: https://github.com/ShalyX/tillward/blob/main/deployments/wave2-live-fee-proof.json
- Public surplus claim: https://explorer.test.mezo.org/tx/0xfceb4acb5e2058fe4c1cad47717e318be05ce6f1eaf2cce58e417b1839ee5343
- Historical Wave 1 entry: https://app.akindo.io/communities/o6Xgma29Vun4VWEE/products/A8Ng3lnKNUMpaqxvO

- Wave 2 pitch: https://tillward.vercel.app/pitch.html
- Wave 2 MP4: https://tillward.vercel.app/media/tillward-wave2.mp4
- Wave 2 PDF: https://tillward.vercel.app/media/tillward-wave2-deck.pdf
- Wave 2 editable deck: https://tillward.vercel.app/media/tillward-wave2-deck.pptx

Existing Wave 1 release/video remain historical references.

## Team
Team: Shaly. Member: Shaly — product and engineering. X: https://x.com/shalyx_04. Product builder credit: ElseMade. No private contact fields or eligibility declarations are inferred.
