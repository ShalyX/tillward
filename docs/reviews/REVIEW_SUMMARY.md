# Tillward post-submission review

Reviewed October 26, 2026. Actual Wave 1 submission remains recorded in `../../submission/receipt.json`. Review baseline `bfbb21f`. Scope: review and evidence collection; no application, contract, keeper, live submission or media edits.

## Completion and authorship

The user explicitly requested Product Critic, Red Team and Judge reviews. Three separate specialist-role agents ran. All eventually encountered the account usage limit. The Red Team saved its complete written report before interruption. The Product Critic and Judge returned interim findings; the root operator completed their reports, personally verified key source/UI issues and assigned the simulated judge scores. This is not three independently finalized sign-offs.

| Review | Outcome | Final author |
|---|---|---|
| Product Critic | MODIFY: preserve thesis; clarify protocol limits and validate real business/payer demand | Operator, incorporating independent critic findings |
| Red Team | No demonstrated P0; one P1 and five P2 findings/observations across the source report and browser evidence | Independent Red Team report, with separate operator observation below |
| Judge | Internal simulation 73/100, range 68–80, medium confidence | Operator; Judge-role agent's final score was not delivered |

## Ranked action list

| Priority | Finding | Why it matters | Next verification |
|---|---|---|---|
| 1 — P1 | Replaced/canceled/dropped original transaction hash can permanently retain the browser write lock | Core owner and payer flows can remain blocked across the same chain/origin | Evidence-based sender/nonce replacement reconciliation; speed-up, confirmed cancellation, uncertain RPC and reload coverage |
| 2 — P2, high product impact | Minimum-debt messaging suggests more receipts can keep reducing principal at the endpoint | The near-minimum loan can amortize only its headroom; final closure is an owner action | Explicit endpoint copy, headroom and top-up/close guidance; test new receipts after reaching the floor |
| 3 — P2 | Checkout shows two decimals but sends up to 18 | Sub-cent invoices can display zero while still charging; mismatch is less than one cent per invoice | Exact payable amount display or consistently enforced currency precision |
| 4 — P2 | Documentation contradicts the confirmed submission/current release | Judges encounter “no entry receipt” and stale material links despite actual submission | Reconcile public README/QA/status/material links against receipt.json without rewriting historical test evidence |
| 5 — P2 | Old consistent RPC state has no timestamp-age warning | A valid historical snapshot can appear current | Timestamp freshness and explicit historical-read mode; preserve financial fail-closed behavior |
| 6 — P2 | Dust can consume shared keeper gas sponsorship | Public automated service fairness can degrade despite the global spend cap | Minimum/batching sponsorship rule and fair per-account budget; multi-account dust versus honest repayment tests |
| 7 — P2, operator browser observation | Aged live-demo receipts are absent from the newest history page | The strongest proof requires extra pagination; fresh judges may not discover it | Direct historical receipt/repayment proof entry, without signing |
| Validation priority | Real borrower/payer demand and MUSD operating utility remain unvalidated | Largest business-viability deduction | Interviews with a business already accepting MUSD and an actual payer; compare with its manual workflow |

P2 reserve explanation: the cash floor is unavailable to both settlement and withdrawal until the owner lowers it. The detailed policy screen says so. Clarify this versus immediately spendable operating funds; it is not a contract-authority exploit.

## Evidence and checks

The Red Team ran 21 JavaScript tests, 20 Solidity tests including 128 split fuzz runs, and a successful TypeScript/Vite build. It did not rerun dependency audit or the native-fork suite. The operator reproduced the sub-cent display mismatch and absent original receipt with read-only module calls, and personally verified the minimum-debt and cash-floor source paths.

Fresh browser evidence is saved under `evidence/`: labeled example workspace, wallet-free onboarding, actual submitted product, live business at block 16,379,476 and empty newest activity page with older-history access. No signatures, financial broadcasts, credentials or destructive operations were used. The operator visually inspected `../../submission/deck-review.png`. The submitted YouTube video is published; its displayed 2:01 versus exact 120-second source is recorded as a format-display uncertainty in the Judge report.

## Workflow interpretation

This closes the missing review pass with transparent authorship. It does not create customer validation retrospectively, restore a missing pre-build reference board, make all security paths proven or convert a MODIFY verdict into PASS. No fix is marked complete here. Product and design locks remain in force; the actual submitted status remains true. Fixes and a subsequent review are separate work.

## Subsequent remediation — October 31, 2026

The source fixes and local verification are recorded separately in [FIX_VERIFICATION.md](FIX_VERIFICATION.md). The original findings and score above remain the October 26 baseline. Public app and hosted keeper have not been upgraded by this remediation pass.
