# Tillward landing and workspace — live release

Published and verified on November 7, 2026. [Landing page](https://tillward.vercel.app/) · [Workspace](https://tillward.vercel.app/?workspace=1).

Source: [`09795b6`](https://github.com/ShalyX/tillward/commit/09795b6ab0dd33e93ac449050ca9cbf6ca1875d1). Vercel deployment: `dpl_E61qzuv2NVkDjD6h4ukHMbjBZHrm`, READY, production, no alias error. The canonical hostname independently resolves to that deployment. [Receipt](../../deployments/landing-workspace-release.json).

## Live checks

| Area | Observed result |
| --- | --- |
| Routing and CSS | Landing opens workspace; workspace returns to landing. Workspace receives `main-CtP0YTXd.css`, landing receives its own stylesheet. The production-only missing-workspace-styles bug is fixed. |
| Layout | Landing and all five workspace tabs passed at 320, 390, 650, 768, 1024 and 1440 px: 36 combinations, no detected overflow, clipped checked controls or page exceptions. |
| Accessibility | Four live axe scans reported zero violations. Illustration backgrounds still require manual contrast review; this does not establish full accessibility conformance. Focused lower-page controls remain clear of the mobile bottom navigation. |
| Interaction | Keyboard-operated landing calculator, FAQ expansion, invoice dialog Escape dismissal/focus restoration, ordinary receipt entrance and reduced motion all passed. |
| Current example | 500 MUSD at 99% shows 495 repayment, 4.95 fee and 0.05 retained. This is labeled illustrative and sends no transaction. |
| V3 account | Read-only QA account loaded native debt 0, collateral 0, 2,601 MUSD collected and approximately 2,002 MUSD repaid, at block 16,620,854. No example fallback or alert. |
| Legacy V1 account | Original proof account loaded live debt, collateral and receipt totals at block 16,620,863. No example fallback or alert. |
| Legacy V2 account | QA account loaded debt 0, 510 MUSD receipts and approximately 2,502.50 MUSD repaid at block 16,620,892. No example fallback or alert. |
| Read-only boundary | Attempting New invoice without a wallet shows the wallet requirement and opens no action dialog. No wallet connection or signing request was issued. |
| Paid checkout | Existing V3 2,600 MUSD invoice loads its exact amount and Already paid state; payment is disabled. No horizontal overflow at 390 px. |
| Release configuration | Public deployment JSON retains chain 31611, V3 factory `0xca5c522850a366769e3f3b07e45f6c7a8980e692`, and the V1/V2 legacy catalog. |
| Static assets | Loading CSS, favicon, mark, all three font files, both font licenses and the existing PDF deck returned HTTP 200 with the expected content types. The existing MP4 HEAD returned HTTP 200 and `video/mp4`. |
| Pitch | Existing pitch page opens; its judge-guide link still points directly to the GitHub Wave 2 guide. |

Account balances above are point-in-time browser observations, not guarantees of later state. No contracts, keepers or financial rules were deployed in this release. No fresh wallet signing, repayment, payment or other transaction was performed. Earlier signed testnet evidence remains separate. Browser coverage is Chromium on Windows with resized viewports; physical devices, Safari and Firefox remain outside this verification.

## Evidence

- [Live desktop workspace](evidence/live-2026-11-07-workspace-desktop.png)
- [Live mobile landing](evidence/live-2026-11-07-landing-mobile.png)
- [Live mobile repayment rules](evidence/live-2026-11-07-rules-mobile.png)
- [Live V3 account](evidence/live-2026-11-07-v3-account.png)
- [Live paid checkout](evidence/live-2026-11-07-checkout-mobile.png)
- [Layout measurements](evidence/live-2026-11-07-layout.json)
- [Accessibility and fee preview](evidence/live-2026-11-07-accessibility.json)
- [Assets and account reads](evidence/live-2026-11-07-readonly.json)
- [Interactions and legacy V2 read](evidence/live-2026-11-07-interactions.json)

Local QA and the repaired findings are recorded in [the preceding visual QA report](VISUAL-QA-2026-11-07.md).
