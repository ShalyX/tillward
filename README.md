# Tillward

BTC-backed working capital that gets repaid from a business's MUSD receipts.

The owner creates an isolated business account, opens a native Mezo loan, and sets a repayment share and operating cash floor. Customers pay final-payment invoices in MUSD. The account allocates the agreed share; an owner or permissionless executor applies eligible allocations to the account's own native Mezo debt. Small allocations accumulate where protocol minimum debt prevents repayment.

![Tillward](public/brand/share.png)

## Verified first slice

- Mezo **public testnet**, chain 31611. No mainnet financial writes.
- A dedicated business account borrowed 2,000 test MUSD against test BTC.
- A separate sample customer paid a 500 MUSD invoice; 100 MUSD was allocated and repaid.
- The separate customer wallet triggered settlement without owner authority. Pending allocation returned to zero.
- Live UI reads the actual account, policy, invoices and activity from chain. The example workspace is explicitly illustrative.
- [Machine-readable proof](deployments/public-testnet-proof.json), including transaction hashes. Sample customer funds came from the test loan; this is integration evidence, not revenue or adoption.

Factory: `0xaf90fe019f7303bb4720437dcfbafe1549474f36`.
Proof account: `0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5`.
[Successful settlement](https://explorer.test.mezo.org/tx/0x3d464267e44b119fe4c8f172996775157261dd85ee9cdd598e5b27bb04b0fb0d).

## Run

Requires Node 22.12+ (verified with Node 24.14), npm and Foundry for contracts.

```text
npm ci
npm run dev
npm run build
npm test
npm run contracts
npm run fork:test
```

Open the printed development URL. The home page offers an example workspace. **Use testnet** and connect an EVM wallet to create your own business account. To inspect the deployed proof account without signing, append:

```text
?account=0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5
```

An invoice link adds `&invoice=<onchain-invoice-id>`. Customers approve only the exact MUSD amount, then confirm a separate payment transaction. The proof account is controlled by a dedicated test wallet; connecting another wallet does not grant owner authority over it.

## Contracts and control

- `RevenueFactory`: one account per owner; immutable native BorrowerOperations; registry for checkout verification.
- `RevenueAccount`: immutable owner and native protocol; exact one-time MUSD invoices; configured share, cash floor and pause; no arbitrary call or upgrade function.
- Repayment is limited by allocated funds, cash above the floor and native minimum debt plus gas reserve. The contract checks exact MUSD consumption and same-transaction native debt reduction.
- Withdrawals preserve both the operating floor and repayment allocation. Owner can explicitly release allocations or edit the floor. Closing a loan is an explicit owner action; released BTC stays in the business account until the owner withdraws it.
- Native sorting hints are computed offchain and validated by the native protocol. Unhinted sorting exhausted gas in the first public settlement attempt; the failed attempt had no financial effect and is disclosed in the QA report.
- UI validates chain, factory runtime hash, factory account registration and native token/protocol addresses before preparing a transaction. Pending transaction hashes survive refresh and block replacement until reconciled.

## Optional settlement executor

```text
node scripts/keeper.mjs <dedicated-test-wallet.json> <registered-account>
node scripts/keeper.mjs <dedicated-test-wallet.json> <registered-account> --watch
```

Wallet JSON contains a `privateKey`; keep it outside the repository. The executor only signs testnet `settle` calls for a verified registered account, with a 1,000 MUSD per-call ceiling and native insertion hints. Signed pending transactions are journaled beside the local wallet file before broadcast, so retries reuse the same transaction. It cannot borrow, withdraw, redirect funds or alter rules. The signer needs only test BTC for gas.

The one-shot executor is available; a managed always-on executor has **not** been deployed. Repayment is therefore triggered manually or by running this executor. Do not claim an unattended production service.

## Proof and deployment tools

```text
node scripts/probe.mjs
node scripts/deploy.mjs <dedicated-test-wallet.json>
node scripts/prove-testnet.mjs <dedicated-test-wallet.json>
node scripts/verify-proof.mjs
```

The proof script sends real testnet transactions and creates a local sample-customer wallet beside the supplied test-wallet JSON. Run it only for the documented sample proof, not on a real business account. Public manifests and proof files contain addresses and transaction evidence, never keys. Unknown/reverted transactions require inspection; the explicit retry flag is only for the documented reverted sorting attempt.

## Network and evidence limits

Mezo's documented HTTP endpoint showed inconsistent heads, empty contract reads and delayed transaction lookup during this session. UI reads prefer the official WebSocket endpoint, retain HTTP fallback, use a fixed block for each snapshot, retry bounded read failures and never substitute example data for failed live reads. Snapshot block is visible. RPC dependencies still require operational monitoring.

Fork tests use the deployed native protocol at block 12,684,025, replaying the exact oracle-precompile response captured at that block because Foundry does not implement Mezo's native oracle. Local fork writes are not public-chain proof. The separate public testnet proof uses the real native oracle and protocol.

## Project state

Working testnet product with the owner-selected Tillward identity. No production/mainnet release, public GitHub launch, audit, customer-demand validation or hackathon submission claimed. The complete Rabby-in-Chrome journey passed through borrowing, invoice creation, exact approval/payment, native repayment, top-up, full closure and recovery of all posted BTC. See [browser proof](deployments/browser-wallet-proof.json). The browser QA payer was the owner; separate-customer proof is recorded independently. See [status](docs/STATUS.md) and [QA](docs/QA_REPORT.md).

Native source/resources: [Mezo MUSD](https://github.com/mezo-org/musd), pinned commit `490ed984ba24ba6297986e8de1271abad4e8abe5`; [developer docs](https://mezo.org/docs/developers/getting-started/). Minimal native interfaces match that source. Original application code is MIT licensed; see NOTICE.md for attribution.


## Reliability and hosted repayment

Recovered transaction receipts advance the snapshot block before the pending state is cleared. The confirmed lower bound persists across refresh. A pending transaction is reconciled automatically while idle. An approved wallet connection survives refresh within the same tab session.

Activity is paginated in 10,000-block pages, fetched in 2,000-block chunks. Older pages can be loaded; a failed page is retried without skipping a range. Invoice browsing supports pages of 50 and exact older checkout links. Loan closure is included in repayment history.

The hosted keeper has independently repaid a subsequent 0.2 MUSD allocation. Current recorded account totals at block 16298796 are 501 MUSD collected and 100.2 MUSD repaid, with zero pending. The original 500/100 proof is a historical snapshot. See [keeper proof](deployments/hosted-keeper-proof.json), [operations](docs/KEEPER_OPERATIONS.md) and [identity](docs/BRAND.md).

The native fork test now also exercises adding collateral, full closure and recovery of BTC to the owner against unchanged protocol contracts, with the disclosed local oracle replay. It is not a public-chain loan-exit claim.

The public browser test independently verified zero remaining loan debt, zero allocation, zero business-account BTC, exact native MUSD burns and the owner BTC increase net of gas. Only testnet assets were used. The original demo loan remains open; the browser QA loan is closed.
