# V3 public repayment and closure verification

Verified November 6, 2026. Mezo public testnet, chain 31611. This is the live proof for the excess-allocation fix.

Tillward still provides BTC-backed MUSD working capital repaid from customer receipts. V3 prevents a receipt from reserving money the remaining loan does not need, and removes the extra allocation-release step after closure.

## Deployed version

- Factory: [0xca5c522850a366769e3f3b07e45f6c7a8980e692](https://explorer.test.mezo.org/address/0xca5c522850a366769e3f3b07e45f6c7a8980e692?tab=contract).
- QA business: [0x3a9E23B4e91661751B1916dFe04e71D6dA65F5c7](https://tillward.vercel.app/?account=0x3a9E23B4e91661751B1916dFe04e71D6dA65F5c7).
- Approved testnet fee treasury: 0x1dcb045123730e606a88380bce534332f50332d2.
- Dedicated QA owner/payer: 0x25Db120d4c36977E57cb360f30E6C6028b8d3935.
- Hosted gas signer: 0x94fD519f7bcc3a11776B101B1CcC284560B7979B.

Factory and account have exact-match explorer source verification, Solidity v0.8.24+commit.e11b9ed9. V3 is a new deployment. Existing V1/V2 accounts retain their contracts, registries and historical links; no account was silently upgraded or migrated.

## Actual result

| Step | Verified outcome |
| --- | --- |
| 2,600 MUSD paid with an 80% rule | Requested allocation: 2,080 MUSD; actual reservation: 2,002.000438209621765752 MUSD, capped to the payable loan debt |
| Retained at receipt | 597.999561790378234248 MUSD, before the hosted fee |
| VPS keeper repayment | 202.000451467556182232 MUSD received by the native repayment path; lender amount intact |
| Atomic service fee | 2.020004514675561822 MUSD, exactly floor(1% of actual hosted repayment) |
| Owner closure | 1,800.000217832825439285 MUSD repaid; no additional service fee |
| Immediately after closure | Debt 0; pending allocation 0; fee reserve 0; 595.979326184942816661 MUSD available |
| Later 1 MUSD receipt | Allocation 0 and no fee; all of it remained available |
| Final owner recovery | 596.979326184942816661 MUSD and 0.045 test BTC withdrawn |
| Temporary QA funding | The 600 test MUSD borrowed from the owner's earlier demo account was restored in full |
| Final business state | No debt, posted collateral, pending allocation, fee reserve, MUSD or BTC left in the QA business |

Interest accrued between blocks; the reservation and final close amount therefore differ slightly. Automatic repayment still obeys Mezo's native minimum-debt rule. The owner explicitly closes the remaining loan. No Release allocation transaction occurred.

## Canonical transactions

- [Invoice payment](https://explorer.test.mezo.org/tx/0xf176642610a37ef1f8bd65085138310ccdcd9043cfe797b2b1d189fe42df2f52)
- [Hosted repayment and atomic fee](https://explorer.test.mezo.org/tx/0xd8a959a3033e0919bc05301e290bdc15695c0cb08f8fa6634d39b6213c059577)
- [Owner loan closure](https://explorer.test.mezo.org/tx/0xaca62eb8902df9e1f741222b93f9a1216823f9bb829e6472cd807763aae41fcc)
- [Post-close receipt](https://explorer.test.mezo.org/tx/0x72e05a14c1069df6a8b8fe9e99b73737c90a7459f89ccca97ea4d22c803c43ce)
- [MUSD recovery](https://explorer.test.mezo.org/tx/0xdee25a01f28b340e694efd18e204e89d3d3aa1fd52c0caf76f368711797a8f6c)
- [BTC recovery](https://explorer.test.mezo.org/tx/0x82ae7ac70e34ef34d5667ddb1a0b016694717f171600d2018e90b8a1b494fb02)

Independent read-only verification checks canonical receipts, exact invoice approval and payment, factory/owner/version/treasury, native MUSD burn and debt reduction, atomic fee transfers, fixed-block allocation/availability, zero-reservation closure and exact owner BTC return accounting for gas. The legacy Mezo receipt may omit effectiveGasPrice; the verifier uses the canonical legacy transaction gasPrice in that case. No fee or payment is inferred from a pending hash.

## Browser and operations

The public V3 workspace was read without a connected wallet. A fresh snapshot at block 16,611,137 showed 596.97 MUSD available after the later receipt, no active loan and zero pending allocation. The older pre-payment browser snapshot was not used as proof of repayment. [Recorded rendered state](evidence/wave2-v3-closed-available.png).

All V3 signing used the dedicated QA CLI wallet; this is not a new Rabby-signing acceptance claim. Earlier V2 Rabby acceptance remains separately documented. The two-minute film retains its labeled earlier V2 proof captures; this report, updated deck and judge guide describe the newer V3 outcome.

V3 has its own systemd service/user, gas-only key, state, journal, health and backup timers. V1/V2 services remain active. Monitoring and encrypted off-host backup cover all three. Telegram accepted the V3 health test. V3 encrypted data recovery and an isolated same-host runtime restore passed with unchanged nonce/journal and no live signature/broadcast. The restore's private RPC socket was assigned to the V3 service user; unrelated users did not receive access. This is not a second-host or host-loss restore. The workstation must remain online/signed in for external polling and DPAPI capture.

Proof JSON: deployments/wave2-v3-{repayment,close,recovery}-proof.json, wave2-v3-source-verification.json, keeper-v3-enrollment.json, wave2-v3-restore-proof.json and wave2-v3-encrypted-restore-proof.json. Reproduce the public reads with `node scripts/verify-public-allocation.mjs repayment|closure|recovery` after `forge build`.

Local gate: 90 non-fork Solidity tests, the native allocation fork, 45 JavaScript tests and production build. No customer traction, commercial revenue, audit or mainnet readiness is claimed. Interviews remain held; Wave 2 is not submitted.
