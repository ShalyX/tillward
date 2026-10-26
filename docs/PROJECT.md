# Release coordination

Milestone: public demo, public source and Wave 1 submission package.

Product/design locks: PROJECT_BRIEF.md, PRODUCT.md, BRAND.md and DESIGN.md. Feature freeze is active while packaging.

Public app: https://tillward.vercel.app . Public repository: https://github.com/ShalyX/tillward , default branch main. Original private Sites preview is historical; the current connector cannot access its project. Vercel hosts the public build.

Verified for this release: public no-login browser loads example and actual account, paid invoices and repayment rules; actual read at block 16,367,839 shows 502 receipts / 100.40 repaid. Desktop 1440 and mobile 390 layouts checked without horizontal overflow. Application tests 21/21, production build and contracts 20/20 with 128 fuzz runs passed. Initial GitHub Actions run 40235217041 succeeded, including dependency audit; local npm audit could not reach the registry during this run.

Materials: submission/answers.md, judge-guide.md, deck.pdf and deck.pptx, plus the completed 120-second, 1920x1080 narrated pitch and English captions. Public pitch: https://tillward.vercel.app/pitch.html . Editable source and downloads are in the v0.1.1 GitHub release. HACKATHON.md records official requirements; SCORECARD.md maps evidence to the rubric.

Owner-supplied public identity: team Shaly, member Shaly, https://x.com/shalyx_04 . ElseMade is the product builder credit.

Wave 1 submitted and confirmed on October 26, 2026. AKINDO displayed "Great! Your submission completed!" and the product page independently lists Mezo [1st Wave]. Entry: https://app.akindo.io/communities/o6Xgma29Vun4VWEE/products/A8Ng3lnKNUMpaqxvO . YouTube pitch: https://youtu.be/9Qu7pAAb2js . Receipt: ../submission/receipt.json and akindo-receipt.png. Owner completed joining and approved the YouTube upload. Screening and judging outcomes are pending.

Production boundaries remain in MAINNET_READINESS.md: independent audit, mainnet-specific configuration/integration, isolated runtime restore and external monitoring. Current product remains testnet-only.
