# Tillward cost baseline

November 1, 2026. Preliminary evidence, not a production budget or pricing decision. The follow-up [PRODUCTION_ECONOMICS.md](PRODUCTION_ECONOMICS.md) adds mainnet gas repricing, commercial frontend/RPC options and explicit support scenarios. Use that report for the current candidate-rate discussion; the hosting-only examples below are historical starting sensitivities.

## Hosting and operations

The owner reports a **USD 5/month VPS bill**. This is owner-provided, not an inspected invoice. The VPS is shared. Attribute all USD 5 to Tillward for a conservative starting scenario; a 20% allocation would be USD 1 but is only an example. Keep incremental cash spend separate from allocated cost. Avoid counting the full bill for each project when consolidating costs.

Read-only observations on November 1:

- Keeper active/running; health healthy; three enrolled businesses; no pending transaction.
- Memory snapshots approximately 23 and 46 MiB, not a measured peak or capacity test.
- Approximately 36.87 CPU seconds accumulated since current service start. No monthly CPU forecast inferred.
- Runtime directory 228,328 KiB (about 223 MiB), state 32 KiB. Runtime includes dependencies; journals and backups are additional.
- Shared root filesystem about 3.6 GiB available out of 40 GiB, 91% used. Capacity planning is still needed despite low keeper RAM.

A small VPS is a reasonable starting background-worker host. Production fitness depends on availability, recovery, monitoring and workload rather than a particular monthly price. Full isolated restore and monitoring independent of both current hosts remain open. The USD 5 bill does not include a measured allowance for closing those gaps.

The authenticated team API confirms Vercel Hobby, billing status active. The billing-charges request for October 22 through November 1 returned `404 costs_not_found`: unavailable evidence, not proof of zero cost. Frontend hosting allocation, paid RPC, independent monitoring and backup costs remain unknown. Vercel's documented Hobby plan permits personal non-commercial use; a commercial launch must budget for an eligible plan or another host rather than assume zero frontend hosting cost. No plan was changed. Source: https://vercel.com/docs/plans/hobby . Machine-readable hosting observations: deployments/wave2-hosting-costs.json.

## Sponsored gas

Run `node scripts/measure-keeper-costs.mjs` from the repo root. It reads all explorer pages for outgoing dedicated-keeper transactions, reconciles canonical RPC receipts and repayment events, and requires explorer/RPC fee agreement. It writes deployments/wave2-keeper-costs.json. No signing or transfer occurs.

| Repayment (test MUSD) | Gas used | Actual price (wei/gas) |
|---:|---:|---:|
| 1 | 403,568 | 146 |
| 0.2 | 400,000 | 146 |
| 0.2 | 400,000 | 146 |

Total paid: **175,720,928 wei = 0.000000000175720928 test BTC**. Total repayment: **1.4 test MUSD**. This is a small QA sample, not customer usage or revenue. Earlier sub-1-MUSD settlements predate the current sponsorship batching threshold and do not prove current threshold bypass.

Use about 400,000 gas only as an initial transaction-size input. Production dollar cost is `sum(gasUsed * actualGasPriceWei) / 1e18 * BTC_USD`, including failed sponsored attempts. Reprice at measured mainnet conditions and intended sponsorship scope before choosing a fee. No current mainnet gas or BTC/USD quote is asserted. Owner/customer borrowing, approvals, checkout and withdrawals are outside this keeper sample. Spending caps and journal reservations are not incurred costs.

Gas is incurred per settlement; revenue follows repayment amount. Small repayments can therefore be uneconomic at a chosen fee. Batching may help but waiting time and owner expectations must be explicit. No sponsorship or batching policy was changed for this study.

## Support

No reliable support-time ledger or hourly opportunity cost exists yet. Engineering/debugging is not automatically recurring customer support. Track onboarding, incident handling and routine support separately from feature development. Founder time needs an explicit value even without a salary.

Use docs/validation/support-cost-log.csv for future entries. It has no fabricated history. Record minutes and category without customer secrets. Interviews remain held.

## Sensitivity examples, not selected prices

Assume only for arithmetic that 1 MUSD = USD 1, with fees collected separately from repayment:

| Actual monthly repayment | Revenue at 0.5% | Revenue at 1% |
|---:|---:|---:|
| 1,000 MUSD | USD 5 | USD 10 |
| 10,000 MUSD | USD 50 | USD 100 |
| 50,000 MUSD | USD 250 | USD 500 |

USD 5 hosting alone requires 1,000 MUSD/month repaid at 0.5%, or 500 at 1%. These are **hosting-only floors**, excluding frontend, gas, support, monitoring, backups, security review, taxes and other expenses.

If support were two hours/month at an illustrative USD 15/hour, hosting plus support would be USD 35: break-even repayment 7,000 MUSD at 0.5% or 3,500 at 1%, still excluding other costs. Neither support time nor hourly rate is measured or selected.

Next evidence: allocated frontend charges, commercial hosting requirements, representative gas sponsorship, logged support time and chosen hourly valuation. Then compare rates with plausible actual repayment volumes. No rate or billing implementation is approved by these examples.
