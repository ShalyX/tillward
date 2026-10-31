# Wave 2 first engineering checkpoint

October 31, 2026. Local working tree, not a new public app release.

## Completed

- Reconciled the original two/four/eight-week roadmap with official feedback in WAVE2_PLAN.md. The interview count is our proposed research target, not an organizer rule. Interview work is held at the owner's request.
- Explorer exact-match verification completed for factory, original demo account and QA account; see SOURCE_VERIFICATION.md and saved rendered observations.
- Added native fixed-block loan-risk reads: BTC oracle price, ICR, TCR, Recovery Mode, normal/critical thresholds and actual CollSurplusPool entitlement. Manager links and internal system-mode consistency are checked; invalid or unavailable data is not presented as a current assessment.
- Added a loan-conditions panel in Overview and Activity, stale/unavailable states, owner collateral and policy responses, and positive-entitlement/fresh-read checks before claiming surplus. Reads are separate from core balances and bounded by a 20-second UI timeout. Owner rule/cash floor and invoice amounts remain unchanged.
- Prepared a business-model comparison and optional validation kit; no price selected, billing enabled, outreach sent or interviews fabricated.

## Verification

- All 36 JavaScript checks passed using Node's non-isolated sequential runner, including four native risk cases. TypeScript and Vite production build passed after the final UI timeout change. git diff --check passed.
- Browser fixture: Recovery Mode at ICR 120% / system 140% produces a liquidation-exposure prompt despite being above MCR 110%; Add BTC opens the existing owner form. Failed oracle reads show unavailable while balances and receipt rules remain readable.
- Desktop and 390px mobile layouts inspected; mobile document width did not exceed viewport. Evidence images/text are labeled fixture states, not public-chain conditions. No signing occurs in the fixture.
- Production build served locally at port 5175 read the actual demo loan at block 16,490,529: native BTC price $77,495.15, ICR 165.89%, TCR 278.31%, Recovery Mode inactive, zero surplus. A separate read-only CLI snapshot at block 16,490,532 is saved in deployments/wave2-loan-risk.json. No wallet was connected in this read-only browser check.
- Solidity contracts are unchanged; no new Solidity run or independent review was claimed for this checkpoint. Existing public app/keeper release and live wallet acceptance remain the October 31 Wave 1 remediation evidence.

## Remaining

Public app deployment and live owner signing for the new panel are pending. Public addColl and actual native surplus-claim evidence remain open; ordinary closure does not substitute for the latter. Customer/payer evidence, selected pricing, pilot, isolated restore/independent monitoring and Wave 2 submission materials remain open. Source verification does not close these gaps. Do not start interview outreach while the owner's hold is active.
