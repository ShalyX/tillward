# Production operating economics

November 1, 2026. Cost study for the proposed fee on actual receipt-funded repayment. No model/rate selected, billing enabled, host migration or mainnet write. Interviews stay held.

## Recommendation for discussion

Use **1% of actual receipt-funded repayment** as the leading pricing candidate, subject to owner selection and customer validation. At current modelled costs, 0.5% leaves little headroom for a small service. This does not demonstrate willingness to pay or a sustainable company: it is an operating contribution model with explicit exclusions.

Prioritise businesses plausibly repaying around 3,000 MUSD/month rather than assuming every low-volume account is profitable. Do not raise repayment shares or lower cash floors to meet revenue targets. A fee on 100 MUSD actually repaid from a 500 MUSD receipt would be 1 MUSD at the candidate rate; the fee source remains a separate unresolved implementation choice.

## Mainnet gas measurement

Read-only sample at 2026-11-01T14:27:45.787Z, chain 31612, block 12924750. Boar gas quote 1462500 wei/gas; native oracle BTC reference USD 77,925.17. Fixed-block price-feed address: 0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88.

Twenty-four spaced blocks from 2026-10-30T21:06:33.000Z to 2026-11-01T14:27:35.000Z contained only 2 transactions with usable gasPrice. This is too sparse for a meaningful distribution or congestion forecast. The secondary Imperator check was unavailable. Native oracle prices are not guaranteed exchange execution prices.

A 450,000-gas attempt costs approximately USD 0.0513 at the quote, or USD 0.5128 at ten times that gas price. The 450,000 allowance is above the 403,568-gas observed QA maximum; Tillward has no mainnet settlement deployment and fee-transfer overhead is unimplemented. This is a testnet gas-size proxy repriced at mainnet, not a mainnet Tillward receipt or eth_estimateGas result.

Budget 20 successful settlements/business/month and an extra 10% full-gas paid-attempt allowance. These are assumptions. Model failed paid attempts separately from read-only retries, which incur RPC cost but no transaction gas. Gas-unit growth and BTC price changes add further risk; the 10x case varies gas price only.

At 1%, the baseline gas-only break-even repayment per attempt, including the 10% allowance, is about USD 5.64; at 10x gas it is USD 56.41. At 0.5%, double those figures. These exclude every non-gas cost. The current 1 MUSD sponsorship threshold is a testnet service policy and would not guarantee profitable production sponsorship. No threshold or service timing was changed.

## Frontend and RPC

- Keep Vercel: budget USD 20/month for one Pro deploying seat, plus applicable usage and tax. Includes USD 20 usage credit; do not add another mandatory USD 20 on top. Published plan includes a 1M-request/1TB CDN tier. This is a price quote from docs, not an incurred bill or a hard cost ceiling. No upgrade purchased.
- Static alternative: Cloudflare static-asset requests/storage are free under published pricing. The Vite app is a candidate because financial execution happens in the browser/keeper, not Vercel Functions. Migration, headers, routes, wallet connections and media need verification. This is a potential USD 20 saving, not an approved migration or promise of zero total platform costs.
- Local JS/CSS assets: 387,755 bytes; 10,000 full cold asset loads approximately 3.88 GB. The video is 18,061,267 bytes; 1,000 full plays approximately 18.06 GB. File-size arithmetic only, excluding headers/fonts/HTML and caching/compression; not observed traffic.
- RPC is distinct from hosting and gas. Current keeper loops sleep 60 seconds after processing and check at most 25 businesses/cycle. For an upper planning estimate, use 43,200 cycles/month, five account reads/check plus ten shared reads/cycle. At ten businesses this is 2.592M requests/month, at 25 or more 5.832M. Processing delays, backoff, caching, discovery and wallet/frontend activity change the real count. With more than 25 businesses, rotation also increases per-account waiting time; equal RPC cost does not imply equal latency.
- Price those requests illustratively at dRPC published 20 CU/request and USD 0.30/M CU: USD 15.55 and USD 34.99/month respectively, before any plan minimum/credits. This is a metered comparison, not a selected provider or SLA quote. Boar offers 50M CU/month free and USD 0.40/M CU paid; its CU weights and rate limits need separate measurement. Do not copy dRPC weights onto Boar. Public endpoints are not assumed to provide an SLA.

## Support and onboarding

These are explicit planning assumptions, not measured support history or market wage claims. Founder time has a cost even without salary. Keep feature development, one-off onboarding and recurring customer support separate.

| Case | Minutes/business/month | Shared minutes/month | Hourly value | Support for 10 businesses |
|---|---:|---:|---:|---:|
| lean | 10 | 30 | USD 15 | USD 32.50 |
| base | 20 | 60 | USD 25 | USD 108.33 |
| heavy | 45 | 120 | USD 40 | USD 380.00 |

Base onboarding: 45 minutes/new business at USD 25/hour = USD 18.75 each, separate from recurring costs. Ten newly onboarded businesses add USD 187.50. At the 10-business/30,000-MUSD scenario, first-month onboarding alone consumes the modelled recurring contribution; do not present recurring break-even as immediate acquisition payback. Log future support in validation/support-cost-log.csv; no history fabricated.

## Recurring scenarios

All use the full USD 5 VPS bill, Vercel USD 20, a USD 10 unquoted monitoring/backup contingency, metered RPC estimate, base support, 20 settlements/business and the 10% paid-attempt allowance. Assume MUSD = USD 1. Model cost exclusions are below.

| Businesses | Monthly MUSD actually repaid | Recurring cost USD | Break-even fee | Contribution at 0.5% USD | Contribution at 1% USD |
|---:|---:|---:|---:|---:|---:|
| 10 | 10,000 | 170.17 | 1.70% | -120.17 | -70.17 |
| 10 | 30,000 | 170.17 | 0.57% | -20.17 | 129.83 |
| 25 | 25,000 | 331.53 | 1.33% | -206.53 | -81.53 |
| 25 | 75,000 | 331.53 | 0.44% | 43.47 | 418.47 |
| 100 | 100,000 | 1041.15 | 1.04% | -541.15 | -41.15 |
| 100 | 300,000 | 1041.15 | 0.35% | 458.85 | 1958.85 |

For ten businesses repaying 30,000 MUSD/month, USD 170.17 breaks down as VPS 5 + frontend 20 + operations contingency 10 + support 108.33 + gas 11.28 + RPC 15.55. At 10x gas, total cost rises to USD 271.71, leaving approximately USD 28.29 at a 1% fee. Switching frontend saves USD 20 under these assumptions; it does not fix low repayment volume or heavy support.

A 50% operating contribution target in this ten-business scenario would require roughly 34,000 MUSD/month at 1%, holding service cost and transaction count fixed. This is a sensitivity calculation, not a demand forecast. Fee revenue is not net profit.

## Decision limits and next evidence

Exclude security audit, legal/compliance, taxes, full engineering payroll, acquisition, custom-domain renewal, token conversion/slippage and fee-collection overhead from these totals; budget them separately before commercial launch. The USD 10 operations allowance is not a supplier quote. Neither support assumptions nor representative customer volumes are validated. Mainnet readiness remains a separate decision.

Recommended next decision: choose whether 1% is an acceptable pilot pricing hypothesis, with actual receipt-funded repayment as the base. Final fee funding, rounding, duplicate prevention, cash-floor preservation, sponsorship timing and any cap require a reviewed design before implementation. No automatic fee changes based on risk or gas and no retroactive charges. Keep essential owner loan-exit/recovery actions outside the proposed fee.

Sources checked November 1, 2026:

- https://vercel.com/docs/plans/pro-plan
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://drpc.org/docs/pricing/compute-units
- https://boar.network/rpc/pricing
- https://testnet.mezo.org/docs/users/getting-started/connect

Reproduce mainnet reads and arithmetic: node scripts/model-production-costs.mjs. Evidence: deployments/wave2-production-economics.json. No financial keys are loaded.
