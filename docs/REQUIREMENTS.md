# Requirements
Canonical brief: PROJECT_BRIEF.md. Official brief verified live 2026-10-22; detailed selection evidence ../..//mezo-selection-brief.md.

| ID | Behavior and observable acceptance | Failure/recovery | Milestone |
|---|---|---|---|
| R01 | Only account owner can borrow, configure policy, create invoice, withdraw or release allocation | Wrong caller reverts; owner cannot be changed silently | M1/M2 |
| R02 | Account supplies BTC and opens a native Mezo MUSD position; read native debt and collateral | Wrong chain/unsupported deployment fail closed; no mock fallback | M1 |
| R03 | Owner sets repayment share 0-100%, cash floor, and pause; configuration is onchain | Reject invalid values, clear treatment of existing pending allocation | M2 |
| R04 | Exact MUSD invoice paid once, allocated from actual received amount; record payer and receipt | Duplicate, expired, canceled, wrong token/amount and failed transfer revert atomically | M2 |
| R05 | Repayment cannot exceed allocated funds, current balance above floor, or native repayable debt | Minimum debt/reserve constraints produce explicit deferred state; failed call retains funds | M1/M2 |
| R06 | Settlement burns/reduces native debt and records before/after evidence | Pending hash is not confirmed; reconcile receipt and fresh protocol state | M1/M3 |
| R07 | Owner withdraws operating funds without spending allocated repayment or breaching floor | Insufficient balance reverts; explicit release allocation and floor edit are owner actions | M2 |
| R08 | Refresh/wallet switch recovers account, invoices, policy and receipt state from chain | No cross-account state; RPC failure shown with stale/unavailable label | M3 |
| R09 | Desktop/mobile usable setup, overview, invoices, customer checkout, settings and evidence | Empty/loading/error/pending/confirmed states; keyboard and reduced-motion support | M3/M4 |

## Competition
C01 MUSD integration: native borrowing, incoming MUSD and native repayment (R02/R04/R06).
C02 deployed app and contracts on Mezo testnet accepted; public repo, deck, two-minute pitch, form required. All pending until actual publication.
C03 cite reused open-source code and licenses; preserve ownership/IP. Wave 2 must show meaningful new progress.
C04 integration 30%, viability 30%, technical 20%, UX 10%, materials 10%. Proof maps to native transaction + usable complete flow + clear user example.
C05 age/jurisdiction/KYB and full terms require user-specific completion; do not attest on user's behalf.

Unresolved: exact deadline timezone, funded testnet account, native deployment addresses/ABI, current-field originality and customer demand. Local fork tests alone do not satisfy C02.
