# Tillward

**BTC-backed working capital. Repay as receipts arrive.**

Tillward helps a BTC-holding business borrow MUSD for operating expenses and pay down its Mezo loan from customer receipts. The owner chooses a repayment percentage, up to 99% on V2 accounts. Customers pay final-payment invoices in MUSD. Eligible allocations reduce the business account's native Mezo debt while operating cash remains available under the chosen rule.

![Tillward receipt-counter identity](public/brand/share.png)

## Try the product

**[Open Tillward](https://tillward.vercel.app)** · [Read the real testnet business](https://tillward.vercel.app/?account=0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5) · [Wave 1 pitch](https://tillward.vercel.app/pitch.html) · [Wave 2 materials](submission/wave2/README.md)

- Explore the clearly labeled example workspace without connecting a wallet.
- Open the original testnet business using `?account=0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5` to read its real loan, invoices, repayment rule and activity.
- Select **Use testnet**, connect an EVM wallet, and follow onboarding to create your own account. Use Mezo testnet assets only.

The proof account belongs to a dedicated test wallet. Connecting another wallet gives read access, not authority to borrow or withdraw from it. Checkout links include the account and onchain invoice ID. The payer approves the exact MUSD amount and then confirms a separate payment.

## The receipt-to-repayment flow

1. Create a business account and supply test BTC to open a native MUSD loan.
2. Set the repayment percentage. Explicitly enable automatic repayments after reviewing the disclosed 1% fee on the amount actually repaid.
3. Create a final-payment invoice and share its checkout link.
4. The customer pays in MUSD. Tillward records the receipt and its repayment allocation.
5. The hosted keeper applies eligible allocations to that account's debt. Anyone can also trigger the same bounded settlement.
6. Inspect debt reduction and transaction evidence. The owner can top up MUSD, close the loan, and recover released BTC.

Repayment stops at native minimum debt plus reserve. Allocations remain visible; more receipts do not remove that endpoint. The owner tops up if needed and closes the remaining loan. BTC collateral remains subject to the native protocol's liquidation and redemption rules. Only final, nonrefundable payments belong in this slice.

## What is implemented and verified

| Area | Evidence |
| --- | --- |
| Native integration | A business borrowed 2,000 test MUSD. A separate sample customer paid 500 MUSD and triggered 100 MUSD of native repayment. [Original proof](deployments/public-testnet-proof.json). |
| Browser journey | Rabby in Chrome completed account creation, borrowing, rule save, invoice approval/payment, repayment, MUSD top-up, full closure and recovery of 0.045 test BTC. [Browser proof](deployments/browser-wallet-proof.json). |
| Hosted repayment | Three factory accounts auto-enrolled, including one created after startup. A later 0.2 MUSD repayment retained the same transaction through restart. The recorded demo totals at block 16,302,866 are 502 MUSD collected and 100.4 MUSD repaid. [Enrollment proof](deployments/keeper-enrollment-proof.json). |
| Recovery and history | Pending hashes survive refresh. Receipt blocks advance the snapshot before pending state clears. Activity and invoice history are paginated without silently skipping failed ranges. |
| Operations | Hosted service, health checks, Telegram alerts, gas budgets, atomic signer journal, local backups and encrypted off-host capture. Workstation alert delivery verified. [Runbook and limits](docs/KEEPER_ENROLLMENT.md). |

These figures are testnet integration evidence. Sample funds came from faucet BTC and native test loans. They do not represent customer adoption or business revenue. The original demo loan remains open; the browser QA loan is closed.

## Wave 2 verified progress — November 6, 2026

V2 factory: [`0xaa5121f96502b9618156e8288e60ce1c699b9a43`](https://explorer.test.mezo.org/address/0xaa5121f96502b9618156e8288e60ce1c699b9a43). Legacy V1 remains fee-free.

- A public 500 test MUSD receipt at 99% produced **495 MUSD native repayment + 4.95 MUSD atomic service fee + 0.05 MUSD retained**. The lender receives the entire allocated repayment. [Proof](deployments/wave2-live-fee-proof.json).
- Automation is explicit opt-in and can be paused in Repayment rules. Manual repayment and closure remain in Manage loan. The owner completed manual repayment, closure and recovery of 0.045 test BTC. [Owner exit](docs/reviews/WAVE2_V2_EXIT_VERIFICATION.md).
- A controlled native redemption created **0.005532212424520610 test BTC** surplus. Tillward claimed it and the owner withdrew the exact surplus. Dedicated test-wallet signing, read-only browser observation; native redemption fees are separate. [Public surplus report](docs/reviews/WAVE2_PUBLIC_SURPLUS.md).
- Public loan conditions, owner collateral top-up, both keeper monitors, encrypted backups and isolated runtime restore are evidenced in [the claim registry](docs/EVIDENCE.md).

These are controlled testnet results, not commercial revenue or customer traction. Interviews remain on hold. [Judge guide](submission/wave2/judge-guide.md).

## Run locally

Requires Node.js 22.12+ and npm. Node 24.14 was used for verification. Foundry is needed for Solidity tests.

```sh
npm ci
npm run dev
npm test
npm run build
npm run contracts
```

Open the development URL. Reading the public proof account requires RPC access but no wallet key. The default page uses labeled illustrative data. Failed live reads show an error rather than substituting that example.

`npm run fork:test` additionally requires the documented Mezo RPC path. It runs unchanged native lending code at block 12,684,025 and replays the captured oracle-precompile response because Foundry does not implement that precompile. It is separate from public-chain evidence.

Current Wave 2 checks: 57 non-fork Solidity tests, the native guarded-surplus fork test, 43 JavaScript tests, TypeScript and Vite production build. Historical release checks remain in [QA report](docs/QA_REPORT.md).

## Contracts and architecture

- `RevenueFactory` creates one account per owner and provides the checkout registry.
- `RevenueAccount` owns its native loan, invoices, receipt allocations and repayment rule. Owner and protocol addresses are immutable. It has no arbitrary-call or upgrade function.
- Withdrawals preserve the cash floor and pending repayment allocation. Policy changes, allocation release, borrowing and loan closure require the owner.
- Settlement can only repay that account's fixed native debt. The gas-only keeper cannot borrow, withdraw, change the rule or redirect funds.
- A shared transaction journal, nonce sequence and gas budget cover enrolled accounts. Pending signed transactions are reconciled before further signing.

Mezo testnet chain ID: `31611`.

Factory: [`0xaf90fe019f7303bb4720437dcfbafe1549474f36`](https://explorer.test.mezo.org/address/0xaf90fe019f7303bb4720437dcfbafe1549474f36).

Original proof account: [`0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5`](https://explorer.test.mezo.org/address/0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5).

See [architecture](docs/ARCHITECTURE.md), [approved product brief](docs/PROJECT_BRIEF.md), [keeper operations](docs/KEEPER_OPERATIONS.md), and [current status](docs/STATUS.md).

## Scope and limits

Tillward is a working Mezo testnet product. It has no mainnet deployment or independent security audit. Mainnet readiness remains [NO-GO](docs/MAINNET_READINESS.md).

Fiat collection, Shopify, other chains, refunds/disputes and yield are outside this build. Mezo RPC responses have shown inconsistent heads and delayed receipts. Fixed-block snapshots, bounded retries and explicit errors mitigate this dependency. Wallet-change/rejection and provider-failover testing is not exhaustive.

The workstation monitor needs that workstation online. An isolated same-VPS runtime restore passed with two enrolled V2 accounts and unchanged signer nonce. Independent always-on monitoring and a second-host/host-loss restore remain open.

## License and attribution

Built by ElseMade. Original project code is [MIT licensed](LICENSE). Native protocol integration references [Mezo MUSD](https://github.com/mezo-org/musd) at commit `490ed984ba24ba6297986e8de1271abad4e8abe5`. See [NOTICE](NOTICE.md) for attribution and third-party licensing.

### Repayment limits and hosted sponsorship

Receipts repay only debt above Mezo's minimum principal plus reserve. More receipts do not remove that minimum: the owner tops up the account if necessary and closes the loan to repay the remainder. The main flow exposes no operating-reserve editor. Existing onchain floors remain enforced for repayment/withdrawal; percentage saves preserve them. The authorized V2 service fee may cross that floor, but cannot consume other pending repayment funds.

The hosted keeper batches quotes below 1 MUSD and reserves at most 0.000025 BTC gas per account per UTC day, within its existing global budget. Pending transaction reservations survive restarts. Anyone may still trigger an eligible on-chain settlement with their own gas. Account creation enrolls discovery, not a guarantee of sponsored gas; multiple funded accounts can still consume the bounded global subsidy.

For older proof, open Activity and enter a transaction's block number (the original demo's payment/repayment is near block 16298123). This loads historical events without changing the current balance snapshot.
