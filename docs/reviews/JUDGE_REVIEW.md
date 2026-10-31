# Tillward simulated judge review

Date: October 26, 2026. Baseline: `bfbb21f`, with the actual submitted entry captured in `evidence/submitted-entry.txt` and `.png`. Official criterion weights are recorded in `../HACKATHON.md`.

## Provenance and score

A separate Judge-role agent inspected the rubric, submission copy, script, public README and links, and flagged documentation contradictions. It reached the usage limit before delivering numerical scores or a final report. **The root operator assigned the scores below and completed this report.** This is an internal simulation, not an independently finalized agent score, organizer result, award forecast or acceptance decision.

**73/100; plausible assessment range 68–80, medium confidence.** The range reflects subjective weighting and the absence of fresh judge-owned wallet signing, exhaustive source review and customer evidence. Testnet deployment is explicitly allowed and is not itself a deduction.

| Criterion | Score / maximum | Visible evidence | Deduction and missing proof | Confidence |
|---|---:|---|---|---|
| Mezo integration | 27 / 30 | Native borrowing, MUSD invoice collection and native repayment; public deployment/proof files; recorded full loan exit. Live account loaded 502 collected / 100.40 repaid. | -3: understanding the full receipt-to-debt evidence requires following several historical records; the automatic-repayment endpoint is less clearly demonstrated than initial settlement. No deduction for omitting optional MEZO token integration. | Medium-high |
| Product and business viability | 15 / 30 | Specific BTC-holding business audience, owner-selected repayment share, clear invoice cycle and credible proposed pilot milestones. | -15: no observed customer demand, acceptance evidence from payers, operational MUSD-spending workflow, retention or business model; the near-minimum borrowing case offers limited automatic principal repayment before explicit closure. These are missing evidence, not disproven demand. | Medium |
| Technical implementation | 16 / 20 | Public code and CI, native integration proof, distinct account authority, hosted keeper enrollment/recovery records, current source review and passing existing suites. | -4: replaced/dropped browser transactions can strand the write lock; checkout amount display truncates; frontend freshness and sponsored-gas abuse handling are incomplete. No unauthorized fund-redirection exploit demonstrated. A passing suite does not cover those paths. | Medium |
| User experience | 7 / 10 | Distinctive readable identity, guided onboarding, clear illustrative/testnet labels, no-wallet live-account reading, wallet-authorized owner actions. Fresh screenshots show a coherent interface. | -3: default-to-live proof discovery, empty recent-history page for an older demo, minimum-debt and reserve explanations, and pending-transaction recovery impose avoidable friction. This pass did not repeat a fresh browser-wallet lifecycle. | Medium-high |
| Submission materials | 8 / 10 | Public AKINDO product and Wave 1 receipt, playable embedded YouTube pitch, eight-slide deck, app/repository links, public team identity and testnet disclosures. Root visually inspected the deck contact sheet and current entry. | -2: `submission/README.md` still says no entry receipt and points to v0.1.0; QA and other historical documents still say submission pending. Several materials describe minimum debt too loosely. The source video is exactly 120 seconds; YouTube displays 2:01, so a strict external-duration requirement merits checking rather than silently claiming its displayed runtime is 2:00. | High for document inconsistency; medium overall |

## Screening assessment

Observed required materials are present: MUSD integration, working supported testnet deployment, public repository, deck, pitch and completed AKINDO entry. The platform receipt and product's “Submitted to ... [1st Wave]” status prove submission, not organizer screening, judging or eligibility approval. Owner registration/terms actions were handled by the owner; no independent legal/identity eligibility determination is made here.

The submitted product has an embedded published YouTube video. The uploaded local source is 120.000 seconds; YouTube's UI rounds/displays it as 2:01. No numerical organizer tolerance is documented in the reviewed public brief. Treat this as an unresolved format-display discrepancy, not a confirmed disqualification. Prefer the exact source file and clarify/recheck if a strict hard cutoff is enforced.

## What the judge can actually observe

- The submitted entry includes the expected product story, source, live app, deck and proposed milestones. The entry has three actual product screenshots and an embedded pitch.
- Default app: labeled example workspace with illustrative numbers. “Use testnet” leads to a coherent connect/create/borrow/rule/invoice setup path.
- Real account: root's fresh browser capture at block 16,379,476 shows 502 collected, 100.40 repaid and 2,101.82 debt. Recent activity is empty in the newest history page; older-event access is a separate step.
- Eight-slide deck: problem, receipt allocation, actual workspace, native repayment, owner policy, full closure and customer-fit next step. The narrative is consistent with working capital rather than an agent or a testing product.
- Historical chain proof and technical tests support the integration. They do not prove customer adoption or mainnet suitability. Current keeper uptime was not re-audited in this review.

## Highest-value improvements

1. Fix original-hash-only pending recovery. A judge attempting a supported wallet speed-up/cancel should not lose access to all writes.
2. Explain remaining automatic repayment headroom and the final owner-closure step. Clarify reserve versus withdrawable operating cash.
3. Make one recorded customer receipt, allocation and resulting native repayment immediately reachable without a wallet or repeated history pagination.
4. Reconcile submission status and current material links across public documentation. Keep historical proof dates intact.
5. Show exact checkout amounts, add snapshot-age handling and separate keeper sponsorship policy from permissionless settlement.
6. Validate the narrow BTC + MUSD business/payer intersection with real interviews and a small pilot. More decorative polish or another feature cannot substitute for that evidence.

Do not claim a higher post-fix score until the changes and externally visible evidence are actually reviewed again. No product changes were made by this report.
