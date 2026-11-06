# Wave 2 submission form review

Latest status, November 7: the live Tillward 2nd Wave entry is filled and verified. Update: 2,524 / 3,000 after newline normalization. Both milestone fields match portal-copy.json. Existing BTC working capital category retained. Screenshot: ../../docs/reviews/evidence/wave2-filled-form.png . Proof: ../../deployments/wave2-filled-form-proof.json . The unsaved live draft is retained for owner review; Submit the product has not been clicked. The published video is https://youtu.be/34Ns0QQ6rNk and shared product copy is saved. Earlier findings below are historical.

Prepared November 6, 2026. Draft for owner review. No fields have been entered or submitted.

## What is verified

The rendered public AKINDO overview was read in a separate, signed-out browser. It shows the 2nd Wave building period and states that registration remains open and entrants can submit in either Wave. It requires meaningful new progress for resubmissions. This is an event-level statement, not confirmation of Shaly's signed-in registration or an available submission button.

Official page: https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10 . Recorded public DOM: work/.playwright-cli/page-2026-11-06T17-08-49-577Z.yml outside the repository. The recorded countdown is not used to infer an exact deadline timezone.

The overview requires the live app, public GitHub, product deck and two-minute pitch. It specifies category length as 3–5 words and TL;DR as one sentence. It requests three future milestones and timelines if continuing. It does not expose the authenticated form's per-field character limits, attachment sizes/types, required video host or account qualification state.

## Entry to review

| Field | Prepared value / source |
| --- | --- |
| Name | Tillward |
| Category | Receipt-linked BTC working capital (4 words) |
| TL;DR | Tillward lets BTC-holding businesses borrow MUSD and put their chosen share of customer receipts toward repayment. |
| How it works and MUSD/MEZO role | answers.md, Problem and product / MUSD and Mezo integration / Revenue model |
| Target group | BTC-holding independent agencies, studios and sellers willing to collect MUSD; desktop EVM-wallet workflow. Demand and regional adoption are unvalidated. Do not invent a target region or mobile-wallet support. |
| Tech stack | Solidity 0.8.24, Foundry, TypeScript, Vite, viem, native Mezo lending/MUSD, Node.js keepers, systemd, Vercel, GitHub Actions |
| Track | Track 1, DeFi, is the primary fit; select both only after reviewing the available choices with the owner |
| Chain / readiness | Mezo public testnet, chain 31611; working testnet deployment |
| Project status | New project built for this Buildathon; Wave 2 extends the submitted Tillward product |
| Changes since Wave 1 | Corrected akindo-wave-update.txt (2,234 characters; actual field limit unverified) and answers.md |
| Team | Shaly — product and engineering; https://x.com/shalyx_04; ElseMade builder credit |

Public app: https://tillward.vercel.app/

Source: https://github.com/ShalyX/tillward

Pitch page: https://tillward.vercel.app/pitch.html

MP4: https://tillward.vercel.app/media/tillward-wave2.mp4

Deck PDF: https://tillward.vercel.app/media/tillward-wave2-deck.pdf

Editable deck: https://tillward.vercel.app/media/tillward-wave2-deck.pptx

Guide: https://github.com/ShalyX/tillward/blob/main/submission/wave2/judge-guide.md

## Proposed milestone wording for owner review

These are planning windows, not scheduled outreach, procurement or launch commitments. Interviews remain on hold. Do not replace the approved answers or enter this text into the portal until reviewed with the owner.

1. **Business and payer validation:** within two weeks after the owner resumes validation, test whether BTC-holding businesses and their payers would use MUSD invoices, receipt-linked repayment and the proposed pricing.
2. **Small testnet pilot:** within four weeks after willing participants are identified, measure actual repayment volume, gas sponsorship and support time, and run a second-host recovery exercise.
3. **Independent review and mainnet decision:** target four to six weeks after the pilot, subject to results and review budget, for independent contract/integration review and a separate mainnet-readiness decision. This is not a promised mainnet launch date.

## Signed-in checks still required

- Confirm the active account/team and Tillward's Wave 2 submission/update route. Do not overwrite the historical Wave 1 entry by assumption.
- Read all actual fields, required markers and character limits, including any existing saved values.
- Inspect deck/video attachment controls and accepted URL formats, file types and size limits. Do not infer MP4 acceptance from a two-minute video requirement.
- Review the proposed milestone windows and any required experience/region fields with the owner.
- Owner handles missing private contact fields, eligibility and legal declarations. No answers are inferred.
- Stop at the completed entry review. Submission and its observed confirmation are a separate step.

## Authenticated review completed November 6

Browser access was restored. Read the signed-in shaly account's Wave 2 entry modal and Tillward product editor. Selected Tillward in the modal without entering update text or submitting. The modal explicitly displays **Entered: 2nd Wave**. Tillward is selectable; this establishes an available entry route, not organizer acceptance or a new legal eligibility determination.

### Actual wave-entry fields

- Product: Tillward, selected from this account's products.
- Product Category: required, maximum three tags. Existing tag: BTC working capital.
- Updates in this Wave: visible counter **0 / 3,000**. The prepared 2,234-character update fits. The DOM has no native maxlength attribute, so the displayed counter is the evidence for the limit; no submission validation was triggered.
- Declared build goals: displays the old Wave 1 proposal to interview 5–10 businesses. It is displayed as previous goals, not an editable interview requirement. The update must explain that interviews remain held and avoid claiming those goals were completed.
- Milestone: required fields labeled **3rd Wave** and **4th Wave**. The 3rd Wave field contains the previous conditional 4–8-week follow-on proposal. The 4th Wave field is empty. These are generic form labels, not proof that Mezo offers or funds a fourth wave.
- Final action: **Submit the product**. The modal warns that submissions cannot be canceled, but updates can be made. It was not clicked.
- No deck/video upload controls or separate track selector appeared in this modal. Put the current direct deck, pitch and evidence URLs in the update; track fit belongs in the text unless later controls require otherwise.

### Product editor and attachment requirements

The separate Edit Product page requires an icon, name, tagline, product type, accessible public GitHub repository, image gallery, Markdown About text, video URL, live demo, infrastructure, category and technology tags. It shows Functional selected, ShalyX/tillward connected, three of five gallery slots used and public visibility selected. No values were edited or saved.

**Video explicitly requires a public YouTube URL.** The existing value is https://youtu.be/9Qu7pAAb2js, the historical Wave 1 film. The current Wave 2 MP4 must be uploaded to YouTube and verified for public viewing before replacing that value. A pitch-page URL or raw MP4 must not be assumed valid for this field. The approved film does not need a remake.

The About text still links the v0.1.1 deck/release, describes choosing an operating cash floor, gives the old fee-free 500/100/400 example and repeats the old interview schedule. Those product-page values need updating from the approved Wave 2 answers. The separate Wave 1 submission receipt remains historical; updating the shared product description may change what is shown when viewing that older entry.

The current deck belongs in the Markdown About section and wave update as a direct public PDF link. There is no dedicated deck attachment control in the inspected editor. Gallery upload size/type limits were not exposed by the text read and were not tested; no gallery change is needed for these corrections.

### Deadline conflict

The signed-in live timeline explicitly shows **11/13 06:30 Deadline** for the building phase, whereas the written overview says November 15. The timezone is not labelled. Use **November 13 as the conservative submission date** and do not present November 15 or a UTC conversion as settled. Resolve the organizer/platform discrepancy before relying on a final-hour deadline.

### Before final entry review

1. Upload the existing Wave 2 MP4 to YouTube with owner-authorized visibility and verify playback without the owner session.
2. Update the shared product's video, About text and deck/release URLs, preserving the historical Wave 1 receipt and evidence files.
3. Add direct current pitch/deck/proof URLs to the wave update while keeping it below 3,000 characters.
4. Review wording for the required 3rd/4th milestone fields with the owner. Interviews remain held and conditional plans are not guaranteed deliveries.
5. Recheck the populated form with the owner, then obtain the separate final submission instruction. No submission has occurred.
