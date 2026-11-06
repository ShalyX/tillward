## V3 verified extension — November 6, 2026

Native integration/implementation now includes an oversized 80% receipt, debt-capped reservation, real VPS repayment and atomic fee, automatic reservation cleanup on owner closure, and a later receipt with no active loan. Owner cash/BTC recovery completed. Current deck/guide include the proof. No new organizer score is assigned; customer acceptance remains unvalidated and interviews held. [Live report](reviews/WAVE2_V3_LIVE_VERIFICATION.md).

# Wave 2 evidence update — November 6, 2026

This update does not assign new organizer scores. Integration now includes native loan conditions, collateral top-up, atomic fee settlement, full owner exit and public native-surplus recovery. Implementation adds fee/floor/rollback coverage, both keeper operations and isolated runtime restoration. UX removes the reserve/settings detour, keeps Pause in repayment rules and owner exit in Manage loan. Materials are rebuilt in submission/wave2/. Business viability remains limited by unvalidated borrower/payer demand; interviews are held. The proposed 1% model is implemented on opt-in V2 testnet accounts, with measured and estimated economics separated in PRODUCTION_ECONOMICS.md.

The October records below are historical; they are not current Wave 2 scores.

# Tillward judging evidence and review

Updated October 26, 2026 after the confirmed Wave 1 submission. Official weights are recorded in HACKATHON.md. The October 26 scores below are internal simulations, not organizer results or award predictions. Official October 31 results are recorded separately in [Wave 1 results](reviews/WAVE1_RESULTS.md): integration 8, business viability 6, implementation 8, UX 7, materials 8.

**73/100; range 68–80, medium confidence.** A Judge-role agent returned interim observations but reached the account usage limit before scoring. The operator assigned these scores and finalized the report. The Product Critic verdict is MODIFY. The independent Red Team saved its report before interruption. See [full review and ranked actions](reviews/REVIEW_SUMMARY.md).

| Criterion | Score / maximum | Reviewed evidence | Main deductions |
|---|---:|---|---|
| Mezo Integration | 27 / 30 | Native BTC-backed borrowing, MUSD receipt collection and debt reduction; public proof; recorded full closure | Historical proof takes several steps to verify; automatic-repayment endpoint needs clearer demonstration |
| Product & Business Viability | 15 / 30 | Specific business audience, receipt-linked rule, concrete workflow and proposed pilot | No real borrower/payer demand, MUSD spending/acceptance or business-model evidence; near-minimum loan utility needs qualification |
| Technical Implementation | 16 / 20 | Public source/CI, integration proof, current passing existing suites and bounded account authority | Original-hash recovery lock, checkout precision, stale-state handling and sponsored-gas abuse coverage |
| User Experience | 7 / 10 | Labeled examples, guided onboarding, distinctive identity and no-wallet live-account read | Proof discovery/history friction, protocol endpoint/reserve explanation and transaction recovery |
| Submission Materials Quality | 8 / 10 | Submitted AKINDO entry, published YouTube pitch, eight-slide deck, public app/source | Stale contradictory README/QA status and older release links; YouTube display-duration uncertainty |

The root's current live read at block 16,379,476 showed 502 MUSD collected and 100.40 repaid. The source MP4 remains exactly 120 seconds; YouTube displays 2:01. No tolerance/disqualification conclusion is inferred. Full deductions and uncertainty: [Judge report](reviews/JUDGE_REVIEW.md). No product fix was made in this review.

The following original evidence map and earlier release checkpoints are retained as historical context; where their pending-submission statements conflict, submission/receipt.json and the review above are current.

## The demo must prove the product

1. A business needs operating funds while holding BTC. Show the native borrowing account and available MUSD.
2. Owner chooses a repayment share and operating cash floor. Show the actual rule.
3. Customer pays a final-payment MUSD invoice. Show receipt identity, amount and its allocated share.
4. Eligible allocated MUSD reduces the same business account's native debt. Show confirmed transaction evidence and retained operating balance. Explain partial-repayment headroom and owner closure of the remaining minimum debt.
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

## Wave 2 preparation checkpoint

No new organizer scores predicted. Source verification is complete for factory/demo/QA accounts (SOURCE_VERIFICATION.md). Loan-risk visibility is locally implemented, unit/browser checked and exercised against live read-only data; public deployment and new signed collateral-path evidence remain open. Business viability remains unvalidated; interview work is held by owner, and the prior 5-10 count is an internal target, not an event rule. See reviews/WAVE2_PREPARATION.md.

## November 1 verified improvements

Public loan-risk UI and Rabby collateral top-up are now verified, followed by complete owner exit. Native surplus claiming passes an isolated fork; public-testnet claim evidence remains open. No organizer rescore inferred. See reviews/WAVE2_LIVE_VERIFICATION.md. Business-model direction is awaiting owner selection; no validated demand, pricing or customer adoption is claimed. Interviews remain held.
