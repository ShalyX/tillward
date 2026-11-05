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
