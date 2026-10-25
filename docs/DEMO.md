# Judge-facing demo

Approved product: receipt-linked BTC-backed working capital. The two-minute pitch combines fresh actual public UI captures with labeled historical testnet evidence. No animation claims to execute a new transaction.

| Scene | User state and action | Visible result | Criterion | Evidence or limit |
| --- | --- | --- | --- | --- |
| Working-capital need | BTC-holding business needs operating money | Borrowed MUSD supports expenses | Product viability | Target-user hypothesis, no demand claim |
| Business setup | Owner creates account and opens loan | Account owns native MUSD debt and BTC collateral | Mezo integration | Recorded Rabby 2,000 MUSD / 0.045 test BTC flow |
| Receipt rule | Owner chooses share and cash floor | 500 MUSD at 20% allocates 100; 400 remains for operations | UX and viability | Calculator is illustrative |
| Customer checkout | Customer approves exact amount then pays | Paid invoice and onchain receipt | Integration and UX | Actual paid invoice list; separate-customer proof |
| Repayment | Eligible allocation settles | Actual debt/token evidence, 502 collected / 100.4 repaid recorded | Integration and technical | Recorded totals are testnet integration, not revenue |
| Owner exit | Owner tops up, closes and recovers BTC | Zero debt and returned 0.045 test BTC | Technical implementation | Historical browser proof, original demo loan stays open |
| Current state | Judge opens public app and source | Wallet-free inspection and reproducible repo | Materials | No mainnet deployment or independent audit |

Main failure risk: slow or inconsistent RPC snapshots. The default product preview is clearly illustrative; real account reads fail explicitly and can be retried. Recorded evidence and its block numbers remain available in the repository. Wallet interactions are owner-confirmed testnet operations.

Public entry: https://tillward.vercel.app . Source: https://github.com/ShalyX/tillward . Prepared answers and reviewer steps are in submission/.
