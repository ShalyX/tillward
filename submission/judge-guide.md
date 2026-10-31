# Judge walkthrough

Start at https://tillward.vercel.app. The default workspace is a labeled illustration. It lets you inspect the receipt rule, invoice layout and operating-cash model without a wallet or funds. In Repayment rules, a 500 MUSD sample payment at 20% allocation leaves 400 MUSD for operations and allocates 100 MUSD to repayment. This calculator does not move funds.

## Read the real business
Open https://tillward.vercel.app/?account=0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5 . No wallet connection is required. Wait for the Mezo snapshot, then inspect Overview, Invoices, Repayment rules and Activity. The block number identifies the read. A failed RPC read shows an explicit retry state.

The recorded enrollment proof totals are 502 MUSD collected and 100.4 MUSD repaid at block 16,302,866. Native interest can change the current outstanding debt. The original business loan is intentionally open. It belongs to a dedicated test wallet, so a judge's wallet cannot change its policy or withdraw its funds.

## Follow the evidence
1. `deployments/public-testnet-proof.json`: original separate-payer 500 MUSD receipt and 100 MUSD repayment.
2. `deployments/browser-wallet-proof.json`: Rabby borrowing, invoice payment, repayment, top-up, closure and collateral recovery.
3. `deployments/keeper-enrollment-proof.json`: three accounts discovered, subsequent repayment and restart reconciliation.
4. `docs/QA_REPORT.md`: coverage, observed RPC problems and fixes.

Explorer: https://explorer.test.mezo.org . All assets are testnet. Example numbers and historical proofs do not represent live customer revenue.

## Create your own business
Use testnet, connect an EVM wallet and approve Mezo testnet chain 31611. Obtain only test BTC from https://faucet.test.mezo.org/ . Follow onboarding to create an account, supply BTC/borrow, set the receipt rule and issue an invoice. The owner handles all wallet prompts. A payment requires exact MUSD approval followed by a separate payment transaction. Never send real assets.

Hosted enrollment is automatic but gas sponsorship is bounded. The hosted service batches small allocations; at native minimum debt plus reserve, further receipts cannot reduce the remaining principal. The owner must close the loan. BTC collateral remains exposed to native protocol liquidation/redemption. This release has no mainnet deployment or independent audit.
