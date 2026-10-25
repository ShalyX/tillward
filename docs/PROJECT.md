# Release coordination

Milestone: public demo, public source and Wave 1 submission package.

Product/design locks: PROJECT_BRIEF.md, PRODUCT.md, BRAND.md and DESIGN.md. Feature freeze is active while packaging.

Public app: https://tillward.vercel.app . Public repository: https://github.com/ShalyX/tillward , default branch main. Original private Sites preview is historical; the current connector cannot access its project. Vercel hosts the public build.

Verified for this release: public no-login browser loads example and actual account, paid invoices and repayment rules; actual read at block 16,367,839 shows 502 receipts / 100.40 repaid. Desktop 1440 and mobile 390 layouts checked without horizontal overflow. Application tests 21/21, production build and contracts 20/20 with 128 fuzz runs passed. Initial GitHub Actions run 40235217041 succeeded, including dependency audit; local npm audit could not reach the registry during this run.

Materials: submission/answers.md, judge-guide.md, deck.pdf and deck.pptx, plus a two-minute pitch currently being finalized. HACKATHON.md records official requirements; SCORECARD.md maps evidence to the rubric.

Owner-supplied public identity: team Shaly, member Shaly, https://x.com/shalyx_04 . ElseMade is the product builder credit.

Remaining human gate: AKINDO registration/private contact fields, eligibility and participation agreement, final entry and observed submission receipt. No entry is submitted by publishing the app or repo.

Production boundaries remain in MAINNET_READINESS.md: independent audit, mainnet-specific configuration/integration, isolated runtime restore and external monitoring. Current product remains testnet-only.
