# Wave 2 execution plan

Authorized October 31, 2026: prepare Wave 2 and work through official judge feedback. Tillward's product, owner-controlled repayment policy and ink/cream/vermilion identity remain locked. Wave 1 submission and its feature freeze are historical checkpoints, not erased by this iteration. Testnet only.

## Our prior roadmap and the judge's requests

| Existing commitment in submission/answers.md | Judge overlap | Wave 2 treatment |
|---|---|---|
| Interview 5-10 BTC-holding agencies/sellers within two weeks; validate MUSD acceptance, invoice wording, share and cash floor | Explicitly requested evidence that real sellers accept MUSD | Highest-priority evidence track; also ask an actual payer how they would acquire and pay MUSD |
| Small testnet pilot, broader wallet/RPC failures, isolated runtime restore and independent monitoring within four weeks | Supports technical reliability; not a substitute for the specific collateral paths requested | Retain; pilot requires willing participants and restore must be isolated from the live signer |
| Independent review within eight weeks if demand supports it; separate mainnet decision | Not an explicit judge request | Keep later gate; no claim Wave 2 makes mainnet ready |

New explicit requests: native ICR/BTC price/Recovery Mode/redemption visibility, owner response as collateral ratio falls, factory/account explorer verification, on-chain addColl and claimCollateral evidence, and a revenue model.

## Work packages and exit evidence

| Priority | Work | Exit evidence | Current status |
|---|---|---|---|
| 1 | Customer and payer validation | Credible direct seller/payer evidence, consented anonymized notes (5-10 was our proposed target, not a Mezo rule), disconfirming findings, explicit distinction between interest and pilot participation | Kit prepared; interview work held at owner request; no interviews or adoption claimed |
| 1 | Loan conditions in actual workspace | Native fixed-block ratios/price/mode/surplus; actionable owner prompts; stale/failed state; desktop/mobile visual inspection | Deployed November 1; real public owner loan/top-up/exit verified |
| 2 | Public source verification | Factory and representative account explorer URLs show verified sources matching deployment compiler/settings/immutables | Exact-match factory, original demo and QA account verification completed October 31 |
| 2 | Add collateral | Owner-approved testnet transaction; native collateral increase; account/owner BTC and gas accounted for; fixed-block proof | Public top-up verified November 1: 0.045 -> 0.046 test BTC, followed by complete owner exit |
| 2 | Recover actual native surplus | Account has positive CollSurplusPool entitlement; owner calls claimSurplus -> native claimCollateral; pool entitlement falls and account BTC rises by the same amount; withdrawal is a separate action | Native isolated-fork path passed; public claim still requires an owner-only controlled redemption scenario |
| 2 | Business model | Document payer, value, pricing hypothesis and cost break-even; interview willingness to pay | Hypothesis document prepared; no charges enabled |
| 3 | Pilot and operational resilience | Willing business/payer, complete testnet journey; isolated restore and externally hosted outage signal | Not completed |
| 3 | Evidence-led submission update | Explicit since-Wave-1 changes; fresh public captures and proof links; full audit and visible Wave 2 receipt | Not submitted |

## Sequence and boundaries

October 31-November 1: prepare scope, interview kit, native reader and explorer verification inputs. November 2-8: interviews and integration proofs in parallel where feasible; no outreach without the owner's instruction. November 9-11: pilot and evidence review, cut unsupported claims and optional scope. Feature freeze target: November 12 at 18:00 WAT (17:00 UTC). November 13-14: public deployment QA, revised pitch/deck and submission audit; preserve upload buffer before the official November 15 close. Exact close timezone must be rechecked on AKINDO before scheduling submission.

Do not silently raise the repayment share, reduce the cash floor, add fees, change borrower authority, enable mainnet or induce liquidation/redemption against unrelated borrowers. Raising the share is an owner-approved rule change, and it affects new receipts, not guaranteed immediate repayment. Adding BTC remains an explicit wallet action. Existing simulation and nonce recovery remain the transaction gates.

Normal closure returns collateral directly; it does not exercise claimCollateral. Demonstrate the latter only with an actual claim entitlement. If a controlled public-testnet surplus scenario cannot be achieved safely, retain the gap and distinguish fork evidence from public proof.

## Sources

- Prior roadmap: submission/answers.md, next three milestones.
- Official feedback: reviews/WAVE1_RESULTS.md and raw evidence/wave1-official-review.txt.
- Event and schedule: https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10 and https://mezo.org/blog/mezo-buildathon-is-underway.
- Pinned native interfaces: mezo-org/musd commit 490ed984ba24ba6297986e8de1271abad4e8abe5. Re-read deployed getters at fixed blocks rather than hard-code a live risk assessment.

## Owner clarification

October 31: the 5-10 interview count comes from our submitted roadmap, not an organizer entry requirement. The judge requested evidence of real seller MUSD acceptance, referring to those planned interviews. The owner asked to hold interview work; it is not a mandatory numerical submission gate. Keep engineering progressing.

November 1 checkpoint: see reviews/WAVE2_LIVE_VERIFICATION.md. Revenue-model direction has been presented for owner selection. Interviews remain held. No Wave 2 submission or new fees have been activated.
