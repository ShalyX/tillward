# Architecture
Brief: PROJECT_BRIEF.md. Contracts are the authoritative financial state; browser is an untrusted transaction preparer.

## Flow
Owner wallet -> factory -> isolated borrower account -> fixed official Mezo BorrowerOperations/TroveManager/MUSD.
Customer wallet -> exact MUSD allowance -> pay invoice -> account receives MUSD -> pending repayment allocation + operating balance.
Anyone -> bounded settle -> account repays only its own native debt -> receipt event + fresh debt query.
Owner -> withdraw available operations / edit policy / pause future allocation.

## Components
- Solidity account/factory compiled for London. Immutable owner and native protocol addresses. No arbitrary external call function, upgrade admin, price speculation or unrestricted keeper authority.
- Typed frontend with wallet signing and public RPC reads. No server wallet. Account addresses, policy, invoices and payments reconstructed from chain; local storage only holds view preferences/pending transaction hints.
- Deployment manifest pins network, official addresses, deployed code, deployment block and source version. Unconfigured writes disabled.
- Foundry unit/adversarial tests and pinned-protocol fork feasibility. JS numeric tests for UI parity.
- Native HintHelpers and SortedTroves provide insertion hints for opening, repaying and adding collateral. Interest is repaid before principal when projecting the nominal collateral ratio. The native protocol revalidates every hint.
- Browser public reads prefer the documented WebSocket endpoint, with HTTP fallback; each snapshot pins one block and refuses silent example fallback. A known confirmed block is a lower bound if a backend reports an older head. The footer identifies the snapshot block.
- Optional local one-shot/watch keeper signs only bounded testnet settlement calls. It validates the deployment/registry, observes native limits, and journals signed requests outside the repo before broadcast. A managed executor is a separate deployment gate.

## Financial boundaries
Invoice IDs unique per account; exact expected MUSD only; unpaid -> paid or canceled, no repeated payment. External calls use checks/effects/interaction and reentrancy guard. Atomic failure preserves receipt and allocation invariants.
Balance includes borrowed operating funds and customer receipts. Pending allocation is a subset, not extra tokens. Withdraw <= balance - allocation and preserves cash floor. Owner may explicitly release allocation. Pause affects future allocation/settlement, not customer ownership or existing debt.
Settlement <= pending allocation, balance minus floor, and actual protocol repayable debt above the mandatory floor/reserve. Owner can change policy openly. Keeper cannot withdraw, change recipient, borrow, redirect repayment or invent receipt amounts.
Native interest accrual and minimum debt are read from protocol, not hardcoded economic guesses. Gas for contract calls is paid by the signing wallet in BTC. Funds in account remain subject to contract/native protocol risk.

## Design direction
Functional workspace, provisional name. Explore cash-ledger, repayment-path and invoice-first structures; choose repayment-path overview because the product explains where each receipt goes. Pale cool surfaces, dark ink, restrained cobalt for repayment, green for operating funds; tabular amounts; large split visualization with clear labels. No speculative performance chart. Setup is the main action for empty accounts. Narrow layout places cash, debt, split, then receipts; no squeezed desktop navigation. Motion only shows state/transaction progress, reduced-motion respected. Identity is provisional, no logo-world commitment.

## Runtime
Static browser app and onchain financial state. Local dev and built app must be inspected. New private Sites preview may be published for review; judge-accessible release remains a later explicit audience decision. Native testnet deployment needs a dedicated funded test wallet; no mainnet writes.


## 2026-10-22 reliability / operations update

R08: src/chain-state.mjs resolves a confirmed receipt before choosing the snapshot boundary. Receipt block and the previous persisted confirmation are lower bounds; a stale RPC head cannot move the view backwards. Pending hashes survive missing receipts; idle polling reconciles them. Approved browser account recovery uses eth_accounts and session-scoped opt-in, without a new connection prompt.

R08/R09: activity uses 10,000-block pages with 2,000-block chunks and an explicit older-page cursor, so the deployment's age no longer disables history. Failed chunks reject a page atomically. Invoice pages preserve exact historical checkout lookup. The owner sees guided account/borrow/policy/invoice steps and explicit MUSD top-up/loan-close/BTC-withdraw controls.

R05/R06: an isolated systemd keeper discovers businesses from pinned-factory AccountCreated events and persists validated, confirmed discovery pages. A rotating account queue shares one non-owner gas wallet, pending transaction journal, nonce sequence and global gas budget. Per-account failures back off; pending nonce recovery blocks further signing. Independent health/backup timers and Telegram incident/recovery alerts cover local service operation. Three enrolled accounts, native unattended repayment and same-hash restart recovery are verified. See KEEPER_ENROLLMENT.md for operating limits and remaining infrastructure work. No browser or business-owner key is hosted.

M5: Tillward is the selected public-facing identity; contract names/addresses and compatibility storage keys retain their historical names. Branding details and assets are in BRAND.md.

Public browser-exit verification is in deployments/browser-wallet-proof.json. The browser owner signed every transaction through Rabby; CLI checks only independently read those transactions. Invoice approval was exact and fully consumed. Native closing and repayment MUSD burns were checked. Owner BTC recovery was verified using actual balance delta net of the receipt/legacy transaction gas price, because Mezo omitted effectiveGasPrice on that receipt.
