# Wave 2 final materials review

Reviewed November 6, 2026. Operator review, not an independent agent review or organizer rescore. No portal submission performed.

## Verdict

The product narrative, eight-slide deck and recorded two-minute film form a credible testnet submission. The packet demonstrates meaningful progress since Wave 1. Finish the small consistency corrections and authenticated portal checks below before declaring READY_TO_SUBMIT. Business validation remains an explicit limitation; interviews stay on hold.

## Review scope

Read the final answers, concise update, judge guide, script/captions, release notes, current evidence registry, product coverage, published-release verification and official Wave 1 feedback record. Visually inspected all eight final PDF page renders and ten encoded film samples against the script/captions. This pass does not claim a fresh full audiovisual watch, new wallet signing, new financial transactions or an independent contract audit. The unchanged film's earlier encoded/audio QA remains separately recorded in submission/wave2/video-check.json.

The current organizer announcement confirms working integration and November 15 final submissions; the previously recorded AKINDO brief requires a two-minute pitch. The AKINDO authenticated Wave 2 form, exact deadline timezone, field constraints and advancement status need live portal verification. Source: https://mezo.org/blog/mezo-buildathon-is-underway . The web text fetch of AKINDO returned its shell, not its rendered form; no ineligibility or page-unavailability conclusion follows.

## Corrections before submission

1. **P2 — operations count is stale.** answers.md change 9 and akindo-wave-update.txt say “both keepers”; the current V3 deployment has three isolated versioned keepers. Update to “all three versioned keepers” and distinguish the V2 and V3 same-host restore proofs. No second-host recovery claim.
2. **P2 — the pitch page's “Wave 2 judge guide” link opens the packet README.** Link directly to submission/wave2/judge-guide.md so a judge reaches the promised evidence route immediately. The existing destination is valid, but adds an unnecessary step. The current V3 account should also precede historical V1/V2 fixtures in that guide.
3. **P2 — stale release status in supporting sources.** docs/PROJECT.md retains a “Pending allocation fix” section that says V3 is not deployed, below a newer deployed-status section; submission/wave2/pitch-script.md still says final composition review pending. Mark the former as historical/superseded by the November 6 live report and the latter as the finalized film script. Preserve historical evidence rather than presenting contradictory current status.
4. **Portal completeness gate.** The written next milestones are conditional and have no time windows; organizer field notes request timelines if continuing. Supply realistic conditional time windows in the actual form if required. Verify Wave 2 qualification, available entry/update route, required media URL format, field lengths, public attachments and owner declarations before submitting. No qualification or legal answers may be inferred from the Wave 1 grant card.

These are presentation/entry-readiness issues, not demonstrated transaction failures. No P0/P1 technical issue was established by this materials review. Final portal completeness is still unverified.

## Judge feedback reconciliation

| Wave 1 request | Current evidence | Status |
| --- | --- | --- |
| Validate businesses and payers accepting MUSD | Intended audience and unvalidated acceptance disclosed | OPEN; interviews held by owner, no fixed interview count is an organizer requirement |
| Credible revenue model | Explicit opt-in 1% of actual hosted repayment; public 495/4.95/0.05 V2 flow and V3 fee proof; cost assumptions separated | ADDRESSED as implemented model, not willingness-to-pay proof |
| Native risk visibility and owner responses | BTC price, ICR/TCR, Recovery Mode, redemption warning, owner collateral top-up | ADDRESSED with actual UI and public transaction evidence |
| Factory/account source verification | Exact-match V1/V2/V3 verification records | ADDRESSED; not a security audit |
| Collateral top-up and claimable surplus | Public top-up, controlled native surplus claim and owner recovery | ADDRESSED; dedicated CLI surplus signing and read-only browser evidence disclosed |

The V3 debt cap and automatic reservation release on closure additionally remove the manual cleanup problem raised by the owner. Native minimum debt still requires explicit owner closure; automatic receipts do not fully close every loan.

## Four judging lenses

**Product:** The opening and first two deck slides make the target user and working-capital job clear. Receipt-linked repayment is the memorable distinction from a generic borrowing interface. Biggest weakness: a BTC-holding business's willingness to accept and spend MUSD is still an assumption. The packet acknowledges it without inventing traction.

**Technical:** Exact public transactions support borrowing, receipt repayment, atomic fee collection, risk controls, surplus recovery, debt-capped allocations and closure. Existing V1/V2 accounts retain their original immutable behavior. V3's new signing proof is CLI-based, not fresh Rabby acceptance. Final minimum-debt closure is owner initiated. These distinctions are consistent with the linked reports.

**Sponsor:** MUSD is the borrowed, invoiced, collected and repaid asset, and native Mezo debt is actually reduced. The integration is integral to the product. No MEZO-token integration is claimed. Track 1 is the strongest fit; Track 2 is secondary only if the form permits both.

**Thirty-second judge:** “BTC-backed working capital repaid from customer receipts” is understandable. Owner-selected share and disclosed fee are visible by roughly 30 seconds. Concrete public repayment proof appears later, around 69 seconds, so a skim may miss it. The opening is clear enough to retain; moving evidence earlier would be an optional presentation improvement, not a reason to rebuild the approved film.

## Internal scoring estimate

Planning estimate only, not an organizer score, award forecast or independent agent verdict. Historical rubric weights are recorded in HACKATHON.md; no new weight verification is claimed from the public AKINDO shell.

| Criterion | Estimate | Visible proof and likely deduction | Confidence |
| --- | ---: | --- | --- |
| Mezo integration | 27/30 | Actual native borrowing, debt reduction, collateral and surplus; some proof discovery spans versions | High |
| Product/business viability | 16/30 | Clear audience/job and implemented pricing; no validated seller/payer demand or commercial economics | Medium |
| Technical implementation | 17/20 | Public contracts, receipts, tests, recovery and operations; no independent audit, second-host recovery or V3 Rabby acceptance | Medium |
| User experience | 8/10 | Simplified rules/loan management and no-wallet reads; EVM/MUSD acquisition remains friction | Medium |
| Materials | 8/10 | Coherent identity, eight-slide deck, two-minute film and evidence links; small status/link inconsistencies above | Medium |

Estimate: 76/100, broad plausible range 70–82. Not directly comparable to official Wave 1 displayed scores; this is a different review of a later artifact.

## Presentation assessment

The final deck retains the approved ink, cream and vermilion identity. No observed clipping or unreadable main text in the eight inspected PDF renders. Product screenshots are supporting evidence and too small to serve as the only proof; the large result labels and guide links carry the claims. The 18-decimal surplus figure is visually dense but accurate; rounding the headline and retaining the exact proof would be optional polish.

The film retains labeled V2 captures and does not show the newest V3 cap/closure sequence. The deck, pitch-page note and judge guide disclose that split. It remains a faithful core-product demonstration; do not describe it as a new V3 wallet recording. The PDF is image-based; the PPTX is editable. No new video render is required for the small copy corrections above.

## Handoff

Apply the three consistency corrections, recheck affected links and publication hashes, then inspect the authenticated Wave 2 form with the owner. Keep interviews held and feature freeze active. Do not submit until the final entry fields and required declarations are reviewed. This review creates no new customer, mainnet, audit, independent-agent or portal-acceptance claim.

## Fresh public checks

Six public endpoints returned HTTP 200: pitch page, PDF, PPTX, captions, raw judge guide and GitHub release. The browser loaded the public pitch at 120 seconds duration with no horizontal overflow. A brief playback probe advanced only 0.213 seconds, so this pass does not establish sustained playback; the prior playback proof remains separately recorded. The guide navigation mismatch was observed in the rendered browser DOM.


## Copy correction follow-up

The operations count, direct guide link, current-account ordering, historical pre-deployment status and film-script status have been corrected. Publication and authenticated portal checks are recorded separately. The video, deck and their existing checksums are unchanged.
