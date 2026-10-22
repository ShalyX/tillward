# Research and resources
Updated 2026-10-22. Prior concept comparison: ../../mezo-selection-brief.md.

## Problem and counterevidence
Merchant revenue-linked repayment is established: https://help.shopify.com/en/manual/finance/shopify-capital/united-states . Mezo-specific business demand remains unvalidated; requiring both BTC ownership and MUSD receipts narrows the audience. Manual repayments and ordinary wallet transfers are the baseline alternatives. The smallest useful improvement is a transparent owner-configured split of actual customer receipts with native debt proof.

Existing Mezo winners cover loan defense, treasury, invoicing, payroll, P2P payments, recurring payments and x402: https://mezo.org/blog/announcing-mezo-hackathon-2-winners/ and https://mezo.org/blog/mezo-hackathon-winners/ . Our distinction is revenue-driven amortization, not generic treasury or price-triggered loan defense. No exhaustive novelty claim.

## Official resources
| Resource | Use | Inspection/testing |
|---|---|---|
| https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10 | rules and requirements | Live brief/comments read; 32 submission count; individual entry list incomplete |
| https://mezo.org/docs/developers/getting-started/ | testnet RPC, chain 31611, BTC gas; London-compatible EVM | Read; verify runtime before writes |
| https://github.com/mezo-org/musd | authoritative borrower operations, debt constraints, deployed addresses | Source retrieval in progress; pin commit and license |
| https://rpc.test.mezo.org | read/fork testnet | Probe pending |
| https://faucet.test.mezo.org/ | test BTC | CAPTCHA; no bypass; funded state unknown |
| https://testnet.mezo.org | native borrow comparison | Identified |
| https://explorer.test.mezo.org/ | code and transaction proof | Identified |
| https://discord.mezo.org | developer support | No private access/messages |
| https://www.youtube.com/live/eAiaQpzvVE0 | kickoff | Not watched |

## Feasibility risks
- Borrower-owned account must hold native position and repayment assets. Verify with actual protocol contracts on a fork, then funded testnet.
- Minimum net debt, gas compensation, interest accrual and sorting hints constrain repayments. Accumulate small allocations rather than pretending each micropayment can settle.
- Only final payments eligible; refund management excluded explicitly.
- Fork impersonation/top-up is local testing only. Never claim those are public chain transactions.
- No private key or credential values in documents, code, logs or UI.
