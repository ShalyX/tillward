# Production plan
Locked: PROJECT_BRIEF.md, 2026-10-22. Wave 1 Oct 26; exact hour/timezone pending. Wave 2 Nov 15. Target Wave 1 only if full flow and materials pass; otherwise Wave 2. No rushed fake integration to meet date.

| Milestone | Requirement/deliverable | Acceptance | Effort budget |
|---|---|---|---|
| M1 | R01/R02/R05/R06 hardest dependency | Pinned official source, network probe, native contract repayment in a local fork; separate public testnet proof | Up to 1 day |
| M2 | R01/R03/R04/R05/R07 account/invoice mechanism | Meaningful failing tests, all security/financial scenarios pass, onchain state and recovery | 1-1.5 days |
| M3 | R08/R09 usable complete app | Wallet setup -> borrow -> invoice -> pay -> settle -> withdraw; built UI inspected desktop/mobile | 1-1.5 days |
| M4 | Quality and compliance | Payment/security review, fresh-session flow, QA_REPORT with exact proof and limitations | 0.5-1 day |
| M5 | Identity and submission package | User name/identity decision, public repo, deck, exact two-minute pitch, real captures | 0.5-1 day reserved |
| M6 | Submit and confirm | All fields and user declarations authorized, platform receipt saved | Upload buffer reserved |

## Current execution
Create canonical docs before implementation. Then M1 source/RPC/ABI and native fork experiment. Continue into core vertical slice where dependencies permit. Keep planning, code, tests and proof in this project; intermediate downloads in workspace work/.

Stop/reassess if native repayment cannot work within first-day cap, budget expands beyond 6 developer-days, no credible customer can be reached, or finishing time is insufficient. Do not change core mechanism without agreement. Cut optional analytics and integrations first. Record incomplete external access without declaring the entire build blocked when independent work remains.

Submission, social posts, organizer contact and legal acceptance are not implicit in implementation authorization. Prepare concrete package first. Required presentation/follow-up additional; no invented adoption or payout.
