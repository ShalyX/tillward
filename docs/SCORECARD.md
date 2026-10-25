# Tillward judging evidence

Prepared 2026-10-25. Weights are verified from the [live AKINDO overview](https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10). Readiness assessments below are internal, not organizer scores or predictions. The organizer has not published Tillward's score.

| Criterion | Maximum | Current score | Observable evidence | Gap and highest-value improvement |
| --- | ---: | --- | --- | --- |
| Mezo Integration | 30 | Not assigned | Native BTC collateral, MUSD loan, customer MUSD invoice, receipt allocation and actual native repayment. Original 500 MUSD customer payment / 100 MUSD repayment; later recorded totals 502 collected / 100.4 repaid at block 16302866. Browser proof includes loan closure and BTC recovery. | Make a single receipt-to-debt sequence immediately visible in public demo and video. Link transaction evidence beside the explanation. |
| Product & Business Viability | 30 | Not assigned | Approved target is a BTC-holding agency or seller already willing to accept MUSD. Owner chooses the receipt percentage and cash floor, linking operating funds to repayment. | Demand for this specific audience remains a hypothesis. Avoid adoption, actual revenue, guaranteed BTC protection, or market-size claims. Explain who needs the workflow, how they currently repay, and the narrow initial pilot. |
| Technical Implementation | 20 | Not assigned | Isolated borrower accounts, factory registration, exact receipt/debt checks, native hints, transaction recovery, paginated history. Hosted keeper discovers three accounts and preserved settlement state across restart. Recorded checks: 20 Foundry tests with 128 fuzz runs, 21 JS tests, build and dependency audit. | Publish clean source with reproducible commands and proof files. Disclose testnet and native-fork oracle replay. Independent audit, external monitoring and full isolated runtime restore remain production gates. |
| User Experience | 10 | Not assigned | Guided account/borrow/rule/invoice workflow, exact token approval, checkout, activity and owner loan-exit controls. Approved Tillward receipt-counter identity. Full Rabby-in-Chrome lifecycle was independently verified. | Inspect public URL signed out and at narrow width. Provide read-only proof-account entry so judges understand the product before connecting. Clearly distinguish illustrative workspace from chain data. |
| Submission Materials Quality | 10 | Not assigned | Brand assets, testnet transaction records, QA and operations documentation exist. | Complete and host deck plus exact two-minute pitch video. Keep title, TL;DR, links and scope consistent across GitHub, demo and AKINDO. Check all fields and record final acceptance. |

## The demo must prove the product

1. A business needs operating funds while holding BTC. Show the native borrowing account and available MUSD.
2. Owner chooses a repayment share and operating cash floor. Show the actual rule.
3. Customer pays a final-payment MUSD invoice. Show receipt identity, amount and its allocated share.
4. Eligible allocated MUSD reduces the same business account's native debt. Show confirmed transaction evidence and retained operating balance. Explain accumulation when protocol minimum debt defers small repayments.
5. Owner can inspect history and explicitly close/recover collateral. Label the recorded Rabby loan-exit evidence separately from the still-open original demo loan.

Keeper uptime, safety tests and alerts support this workflow. They are not the product pitch or the main user experience.

## Evidence map

- [Original integration proof](../deployments/public-testnet-proof.json): customer payment and native repayment with a separate sample payer.
- [Browser lifecycle proof](../deployments/browser-wallet-proof.json): owner-confirmed Rabby journey including exact payment approval, repayment, top-up, closure and BTC return. Payer in this QA journey was the owner.
- [Hosted keeper proof](../deployments/hosted-keeper-proof.json): unattended settlement.
- [Enrollment proof](../deployments/keeper-enrollment-proof.json): three factory accounts, new-account discovery without restart, confirmed repayment and restart reconciliation.
- [Operations proof](../deployments/keeper-operations-proof.json): health, alerts, backups and documented limitations.
- [QA report](QA_REPORT.md) and [mainnet decision](MAINNET_READINESS.md): test coverage and remaining boundaries.

## Final audit

Feature freeze for packaging. First remove public-access failures, secret exposure, misleading claims and broken evidence links. Then improve the clarity of the core receipt-to-debt sequence. Additional features are lower priority than an observable working deployment, public source, complete materials and an on-time submission. The full authenticated AKINDO form, owner details, legal declarations and submission receipt still require verification.

## Public release checkpoint - October 26

The public app and repository are live at https://tillward.vercel.app and https://github.com/ShalyX/tillward . The no-login browser inspection loaded the actual business at block 16,367,839, with 502 MUSD collected, 100.40 repaid and three paid invoices. Desktop and narrow layouts passed overflow checks. Public source includes reproducible setup, native-fork disclosure, proof files and CI. GitHub runs 40235217041 and 40246211827 passed, including dependency audit.

The required eight-slide deck and exactly 120-second narrated 1080p pitch are complete. The encoded video was reviewed at nine scene times; both streams run 120 seconds and audio peaks below clipping. Public materials: https://tillward.vercel.app/pitch.html and the v0.1.0 release downloads. Team and member are Shaly, https://x.com/shalyx_04 .

The remaining submission gap is the authenticated AKINDO entry: private contact fields, owner eligibility/participation declarations and the final submission receipt. Product demand remains unvalidated, and production readiness gates remain disclosed. No organizer score or entry acceptance is inferred.
