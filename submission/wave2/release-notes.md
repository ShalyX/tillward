# Tillward — Mezo Buildathon Wave 2

BTC-backed working capital, repaid as customer receipts arrive.

Current V3 additionally caps receipt allocations to the remaining loan and clears all allocations/fee reservations on owner closure. A 2,600 MUSD receipt at 80% produced an actual 2,002.000438 MUSD reservation; the hosted keeper repaid 202.000451 MUSD with a 2.020004 MUSD atomic fee. Closure left 595.979326 MUSD available and zero allocations. A later receipt allocated zero; all funds and 0.045 test BTC were recovered.

The packet also records the opt-in 1% atomic receipt-routing fee, actual native loan conditions and owner collateral top-up, owner pause/manual repayment/closure, and verified native surplus recovery. The 500 test MUSD maximum-allocation flow repaid 495 MUSD, paid a 4.95 MUSD fee and retained 0.05 MUSD. A separate controlled public native-surplus claim returned 0.005532212424520610 test BTC to its owner.

- Public product and current two-minute pitch: https://tillward.vercel.app/pitch.html
- Evidence and judge guide: https://github.com/ShalyX/tillward/tree/main/submission/wave2
- Updated eight-slide editable deck plus image-based PDF with the V3 result.
- MP4: 120 seconds, 1920×1080, 24fps, H.264/AAC, Emma narration and captions.
- V3 public proofs ZIP, captions, editable HyperFrames video-source ZIP and asset checksums.

The video retains its explicitly labeled earlier V2 captures; the V3 proof is in the updated deck, guide and linked receipts. V3 signing used the dedicated QA CLI; browser evidence was read-only.

All transactions use Mezo testnet assets. The fee test payer and treasury were the QA owner. Surplus product calls used a dedicated QA CLI wallet; browser observation was read-only. Native redemption fees are separate. No customer traction, commercial revenue, independent audit or mainnet readiness is claimed. Interviews remain held. Wave 2 AKINDO submission is a separate action; this release is the material packet, not a submission receipt.

Built by Shaly / ElseMade. https://x.com/shalyx_04
