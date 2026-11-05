# Tillward business model hypothesis

Updated November 1, 2026. The owner selected **1% of actual receipt-funded repayment** as the proposed business model on November 1, 2026. This selects the proposal, not billing implementation or activation. No fees or paid access are enabled; no customer revenue is claimed. Interviews remain on hold.

The buyer would be a BTC-holding business using MUSD working capital. The service connects invoicing, owner-selected receipt allocations, native debt repayment and loan records. Test whether this saves meaningful work compared with borrowing and repaying manually. Customers paying invoices should not need a separate Tillward subscription.

## Options to test

| Model | Why a business might accept it | Main objection or implementation cost |
|---|---|---|
| Flat monthly business subscription | Predictable expense; invoice amount and owner-selected split remain easy to understand | Low-volume businesses may prefer manual operation; reliable service access and billing are not implemented |
| Disclosed fee on actual receipt-funded repayment | Price follows delivered repayment, rather than gross receipts | Smaller repayment shares reduce revenue; requires explicit fee funding, cash-floor accounting and reviewed implementation |

The owner's preferred hypothesis is now repayment-based routing fees; the earlier subscription-first recommendation is superseded. Keep subscriptions as a comparison, not a selected fallback. For a 500 MUSD receipt with 100 MUSD actually repaid, a hypothetical 1% repayment fee is 1 MUSD. The 1% rate is now selected for the proposal; it is not enabled in the product. Pending allocations, failed/deferred attempts and retries must not create duplicate charges.

Collection rules selected November 5: allocation capped at 99%; a 1% fee on actual repayment is paid atomically from authorized retained receipt funds. Repayment satisfies its existing cash-floor rules; the associated authorized fee may take the remaining balance below the floor. The lender receives the full calculated repayment. Other pending repayment funds remain protected. No outstanding fees or deferred collection. Native borrowing interest/fees remain separate. Under this proposed receipt-funded model, collateral top-ups, withdrawals, ordinary loan closure and surplus recovery are outside the fee base. Essential owner controls remain accessible. Settlement is permissionless: commercial viability cannot assume customers are forced to use the hosted keeper or pay for direct contract calls.

## Cost and break-even evidence

See [COST_BASELINE.md](COST_BASELINE.md) and deployments/wave2-keeper-costs.json. Measure hosting/monitoring H, sponsored gas G and support hours S at hourly cost C. Let R be monthly MUSD actually repaid through the fee-bearing service, f the fee rate and U an explicit USD value per MUSD assumption. Contribution before other costs and taxes is `f*R*U - H - G - S*C`; break-even f is `(H+G+S*C)/(R*U)` for positive R and U. This assumes fees are collected in addition to R. Deducting from a repayment allocation changes actual repayment and needs different accounting. Business receipt volume is not the fee base. MUSD parity, fee collection, support load and willingness to pay are unproven.

No interview count is an organizer pricing prerequisite. Customer research is an optional, currently held workstream. Before selecting a rate, make costs and plausible repayment volumes explicit. Public submission can describe a proposed model with assumptions; billing implementation and publication of selected pricing remain separate decisions.

The November 1 [production cost study](PRODUCTION_ECONOMICS.md) proposes **1% of actual receipt-funded repayment** as the candidate subsequently selected by the owner for the proposal only. At ten businesses and 30,000 MUSD monthly repayment, modelled recurring costs are about USD 170: 0.5% fails to cover them, while 1% leaves about USD 130 before excluded costs and onboarding. These are unvalidated operating assumptions, not demand evidence or net profit. At 10,000 MUSD monthly repayment even 1% fails this same cost model.

The selected proposed collection model is documented in FEE_COLLECTION_DESIGN.md. Both repayment and the fully funded fee succeed in one transaction or both revert. No fee-related reduction in repayment, separate fee top-up balance or deferred collection. The design is selected; V2 billing is implemented and tested locally, with public billing still disabled. See reviews/WAVE2_FEE_VERIFICATION.md.
