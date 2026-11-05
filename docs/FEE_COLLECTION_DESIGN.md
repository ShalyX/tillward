# Approved proposed fee-collection model

Updated November 5, 2026. The owner selected these rules for the proposed model. Existing deployed contracts still charge no fee. V2 is now implemented and verified locally; see reviews/WAVE2_FEE_VERIFICATION.md. This document does not enable public billing or deploy contracts. It supersedes deferred collection and the separate prefunded service-balance suggestion.

## Rules

1. Maximum repayment allocation is 99% (9,900 basis points).
2. Determine repayment R using existing loan rules, cash-floor calculation and the applicable requested maximum. Do not reduce that valid repayment to make room for Tillward's fee.
3. Tillward charges 1% of actual successfully verified receipt-funded repayment R. The fee comes exclusively from authorized retained receipt funds, never the repayment itself, borrowed principal, collateral or funds reserved for other repayments.
4. Repayment and fee transfer execute in one atomic transaction. Both succeed or neither happens. Verify the native lender receives R in full and the designated treasury receives the calculated fee.
5. The cash floor applies to repayment calculations only. The associated owner-authorized service expense may take the post-fee balance below the floor. Do not require repayment plus fee to preserve the floor.
6. No outstanding service fees, deferred collection or partial fee collection. If retained fee funding is unavailable or transfer fails, revert the whole settlement, including the native repayment. Do not record a payable or silently submit a smaller repayment.

## Example with a meaningful floor

Receive 500 MUSD, allocate 495 at 99%, retain 5. With an existing 5 MUSD floor and no other balances or allocations, the valid repayment is 495: post-repayment balance is 5, satisfying that floor. Collect 4.95 from the retained 5 atomically. Final balance is 0.05, which is permitted even though it is below the floor. The lender receives all 495; Tillward receives 4.95; there is no unpaid fee.

A larger floor may limit repayment under the existing rules. That is ordinary repayment calculation, not a fee-related reduction. Calculate the 1% fee from the resulting actual repayment.

## Accounting requirements for implementation

Let B be the pre-settlement MUSD balance and P the total pending repayment allocation. Choose R by the existing repayment rules before accounting for the fee. For the fee-bearing service path, successful settlement must leave at least P-R available for other pending repayments: B-R-fee >= P-R. This is an allocation-protection check, not a post-fee cash-floor check. Independently require the fee to be funded by authorized retained receipts; total token balance alone does not establish that source.

Track retained receipt funding explicitly so deposits of borrowed MUSD or other sources cannot silently become fee funding. Coordinate owner withdrawals, allocation release, partial settlements and policy changes with that ledger. Preserve enough authorized retained funding for pending service settlements or clearly reject unfunded settlements. Retained funding reservations are not earned fees or unpaid invoices. At a maximum 99% split, a fresh receipt's retained 1% mathematically covers a 1% fee on its repayment allocation; later withdrawals and mixed balances still require explicit accounting.

Use integer arithmetic at MUSD's 18 decimals with an explicit rounding rule. Do not add a minimum fee or round a charge above the authorized rate. Rounding precision must not create a deferred fee claim. Fee accrual is not a separate collection stage: only successfully paid fees count as collected service revenue.

## Authorization and atomicity

The owner explicitly accepts the 100 bps rate, treasury, eligible repayment route, 99% allocation maximum and the fact that service fees may reduce cash below the repayment floor. Do not change the owner's floor setting to implement this exception. Do not apply fees retroactively or unilaterally change terms.

Use guarded contract execution and exact token/debt-delta checks. Native repayment, fee transfer, pending allocation updates, receipt-funding accounting and events all roll back on failure. A replayed transaction cannot charge twice. A new valid settlement charges only on its newly repaid amount. Failed attempts can still consume network gas; that is distinct from a collected service fee.

Loan closure, collateral top-up/withdrawal/recovery and direct self-service repayment remain outside the proposed hosted receipt-routing fee scope. Preserve owner access and never manufacture a fee from those actions. A failed hosted fee transfer may halt that atomic service transaction; it must not remove direct owner repayment/exit access.

## Existing deployments and verification

The current RevenueAccount allows 100% allocation and has no service enrollment, fee transfer or retained-receipt fee-funding ledger. Existing immutable accounts cannot gain this authority from a keeper/UI update. Implementing this design requires reviewed contract changes and explicit enrollment/migration; none have been deployed here.

Verify: maximum 99% enforced; exact full lender repayment; atomic rollback on fee failure; successful post-fee balance below floor; ordinary floor-limited repayment; protection of other pending allocations; retained-only fee funding; withdrawals and partial settlements; decimal rounding; no outstanding fee state; replay/recovery; and unchanged direct owner exit access. Rebenchmark gas for the atomic transfer path before production pricing claims. Independent security review/mainnet readiness remain separate.
