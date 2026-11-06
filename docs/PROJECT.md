## V3 deployed and live verification complete — November 6, 2026

Factory 0xca5c522850a366769e3f3b07e45f6c7a8980e692 is current for new accounts. Public receipt, hosted repayment/fee, zero-reservation closure, post-close receipt, full MUSD/BTC recovery and buffer restoration passed. V3 explorer source is exact-match verified. Separate V3 keeper, monitoring, encrypted backup/data restore and isolated same-host runtime restore passed. Current deck/answers/guide are being refreshed with this proof; the labeled V2 film recording is preserved. No Wave 2 submission has occurred. See docs/reviews/WAVE2_V3_LIVE_VERIFICATION.md.

## Pending allocation fix — November 6, 2026

Local V3 removes excess allocation cleanup: receipt reservations are debt-capped and loan closure clears leftovers. Ninety non-fork contract tests, 44 JavaScript tests, production build and native allocation fork pass. Existing V1/V2 sources, live configuration and published Wave 2 packet remain unchanged. V3 is not deployed; see docs/reviews/WAVE2_ALLOCATION_CLEANUP.md before any deployment or new live claim.

## Wave 2 materials published — November 6, 2026

Public surplus proof is complete. The revised 120-second film, eight-slide PPTX/PDF, answers, judge guide and claim registry are published. Seven hosted files match verified local hashes. Both keepers are healthy with no pending transaction. Wave 1 film and submission receipt are preserved. Next action is live Wave 2 portal-field review and owner-authorized submission; no Wave 2 submission receipt exists. Interviews remain held.

## Wave 2 material checkpoint — November 6, 2026

Public native surplus proof is complete; fixture recovered, no pending financial action. Eight-slide editable PPTX and PDF verified, answers/judge guide/evidence index updated. Forty-three JavaScript tests and production build pass; public redemption/recovery read-only replay passed. Final Wave 2 MP4 render approved by Shaly and running. Next: inspect encoded output, publish current pitch/deck, verify public links, update packet checksums. Wave 2 portal submission has not occurred; interviews remain held.

# Current Wave 2 checkpoint — November 6, 2026

Approved product remains BTC-backed MUSD working capital with owner-chosen receipt repayment. The test fixtures below support that purpose and are not a new product thesis.

Public app release `2026-11-05-wave2-atomic-fees-1` is deployed. Verified public V2 evidence covers exact 500 MUSD receipt / 495 repayment / 4.95 atomic fee / 0.05 retained, owner opt-out, fee-free 9.9 MUSD manual repayment, native closure and exact 0.045 test BTC recovery. See reviews/WAVE2_V2_EXIT_VERIFICATION.md. Workstation monitoring and encrypted state backup cover both keepers; isolated same-host runtime restore and Telegram outage/recovery tests passed. Limits: workstation availability, original DPAPI user profile and no second-host restore.

The public surplus gap is now closed: controlled own-borrower redemption, actual 0.005532212424520610 test BTC native entitlement, existing product claim, separate withdrawal and complete fixture cleanup verified. The guard and account are exact-match source verified. See reviews/WAVE2_PUBLIC_SURPLUS.md and deployments/wave2-surplus-*.json. The browser read actual before/after entitlement; fixture owner signed via dedicated QA script, not Rabby.

Current deliverable: Wave 2 presentation package in progress. Next: updated answers/change log, judge guide, deck, pitch, provenance and final audit. Wave 1 submission remains historical and frozen. No Wave 2 submission, customer traction or mainnet readiness is claimed. Interviews remain held. No human input is currently required.

---

# Release coordination

Milestone: public demo, public source and Wave 1 submission package.

Product/design locks: PROJECT_BRIEF.md, PRODUCT.md, BRAND.md and DESIGN.md. Feature freeze is active while packaging.

Public app: https://tillward.vercel.app . Public repository: https://github.com/ShalyX/tillward , default branch main. Original private Sites preview is historical; the current connector cannot access its project. Vercel hosts the public build.

Verified for this release: public no-login browser loads example and actual account, paid invoices and repayment rules; actual read at block 16,367,839 shows 502 receipts / 100.40 repaid. Desktop 1440 and mobile 390 layouts checked without horizontal overflow. Application tests 21/21, production build and contracts 20/20 with 128 fuzz runs passed. Initial GitHub Actions run 40235217041 succeeded, including dependency audit; local npm audit could not reach the registry during this run.

Materials: submission/answers.md, judge-guide.md, deck.pdf and deck.pptx, plus the completed 120-second, 1920x1080 narrated pitch and English captions. Public pitch: https://tillward.vercel.app/pitch.html . Editable source and downloads are in the v0.1.1 GitHub release. HACKATHON.md records official requirements; SCORECARD.md maps evidence to the rubric.

Owner-supplied public identity: team Shaly, member Shaly, https://x.com/shalyx_04 . ElseMade is the product builder credit.

Wave 1 submitted and confirmed on October 26, 2026. AKINDO displayed "Great! Your submission completed!" and the product page independently lists Mezo [1st Wave]. Entry: https://app.akindo.io/communities/o6Xgma29Vun4VWEE/products/A8Ng3lnKNUMpaqxvO . YouTube pitch: https://youtu.be/9Qu7pAAb2js . Receipt: ../submission/receipt.json and akindo-receipt.png. Owner completed joining and approved the YouTube upload. Official Wave 1 results were checked October 31; see reviews/WAVE1_RESULTS.md. The displayed grant allocation is not confirmed payment.

Production boundaries remain in MAINNET_READINESS.md: independent audit, mainnet-specific configuration/integration, isolated runtime restore and external monitoring. Current product remains testnet-only.

## October 31 official results checkpoint

Judging is complete. Official displayed criterion scores: integration 8, business viability 6, implementation 8, UX 7, materials 8. Judge classifies integration as Level 4; the card displays 18 USDT allocation. Reward payment remains unverified. Wave 2 build period is November 2-15. Product/design locks and submitted phase remain unchanged; no Wave 2 implementation or submission has begun. Evidence and proposed priorities: [official results](reviews/WAVE1_RESULTS.md).

## Wave 2 preparation authorized October 31

Current iteration: work through judge feedback within the locked product. See WAVE2_PLAN.md for roadmap overlap. Factory, original demo and QA accounts now show exact-match verified source on the explorer. Native loan-conditions panel is implemented locally and tested against live read-only state; 36 JavaScript checks and production build passed. Public app and keeper remain the prior release; new signing and collateral-path proof are pending. The owner clarified that 5-10 interviews is our target, not a Mezo rule, and asked to hold that work. No outreach, interviews or fees enabled. Evidence/limits: reviews/WAVE2_PREPARATION.md. Next: engineering diff review, app deployment/QA and explicit owner testnet collateral-path proof; keep interview work held. Prior Wave 1 submission/freeze remains historical and unchanged.

## November 1 public release and collateral acceptance

Loan conditions are deployed at tillward.vercel.app, release 2026-11-01-wave2-loan-conditions-1, application commit 3e646d8, Vercel dpl_46QAtcRJjgEyziH4PTLh4UjJSsbj. CI 41253783116 succeeded. The owner completed a new 2,000 test MUSD / 0.045 test BTC loan, exact 0.001 BTC top-up, loan closure and exact 0.046 BTC return. Canonical checks require zero debt, collateral, pending allocation and account BTC. Native surplus redemption/claim/withdrawal passed on an isolated pinned fork; public-testnet surplus claiming remains unproven. Local non-fork Solidity regression suite and credential scan passed. See reviews/WAVE2_LIVE_VERIFICATION.md and deployments/wave2-*.json.

Current gate: owner prefers a fee on actual receipt-funded repayment, with final model/rate pending measured costs. See BUSINESS_MODEL.md and COST_BASELINE.md. The owner reports a shared USD 5/month VPS; canonical receipts reconcile three keeper settlements at 400,000-403,568 gas. Testnet gas prices are not production cost evidence. Vercel Hobby confirmed; commercial frontend hosting, support valuation and representative mainnet gas remain cost inputs. No pricing or fees enabled. Interviews stay held. Next engineering evidence: controlled public-testnet redemption must touch only the owner test borrower and must establish actual surplus before a claim; no public redemption has been attempted. Wave 2 materials/submission and operational restore/independent monitoring remain open.

## November 5 atomic fee model implemented locally

Owner selected a 99% maximum allocation and 1% fee on actual hosted repayment, paid from retained receipt funds atomically. The repayment cash floor does not constrain the authorized fee; other repayment allocations remain protected. New RevenueAccountV2/RevenueFactoryV2 preserve V1 sources and deployed configuration. Local app/keeper adapters require pinned V2 terms, owner enrollment and funding. 44 non-fork Solidity tests (including 23 fee cases and 128 fee fuzz runs), 39 JS checks, production build and credential scan pass. Native pinned fork proves 495 repayment plus 4.95 fee leaving 0.05 against a 5 floor. No app, contract or keeper deployment and no live fee activation. See reviews/WAVE2_FEE_VERIFICATION.md.

## November 5 V2 public release in progress

App release 2026-11-05-wave2-atomic-fees-1 is READY on tillward.vercel.app (dpl_Gv4wpc9Q4CgZmQtXFDLrHrA65rdC), commit d42985c; CI 42093945518 succeeded. V2 factory 0xaa5121f96502b9618156e8288e60ce1c699b9a43 deployed at block 16594808 and exact-match source verified. QA owner selected as testnet treasury. Separate V2 keeper/signer/state, health and backups deployed; owner V2 account 0xd6e4829B51dB8ED490bFaE01384757B0fD65D622 auto-discovered. Chrome/native control time out; owner created account via public app and remaining wallet flow is awaiting loan confirmation. No live fee flow yet claimed. See deployments/wave2-fee-release.json.

V2 owner loan and borrowed-fund withdrawal now verified: 2500 test MUSD / 0.045 test BTC, loan tx 0xbd7d97582fc6922ed3f1f8726758051b9891284b63334da636383abbdd30b1ee; exact 2500 test MUSD withdrawal tx 0xd88ff5472a37e00f264113f58f326c03af488bea1b1501ce38a6c6029f4c0d87. V2 account source verification is exact-match. Last rule read remains 20% / service disabled; 99% and service approvals are pending. No receipt or fee proof claimed yet.
