# Tillward business model hypothesis

Status: proposed for validation, October 31, 2026. No fee is charged by the current Tillward contracts or checkout, and no customer revenue is claimed.

The buyer would be a BTC-holding business using MUSD working capital. The service connects invoicing, owner-selected receipt allocations, native debt repayment and loan records. Test whether this saves meaningful work compared with borrowing and repaying manually. Customers paying invoices should not need a separate Tillward subscription.

## Options to test

| Model | Why a business might accept it | Main objection or implementation cost |
|---|---|---|
| Flat monthly business subscription | Predictable expense; invoice amount and owner-selected split remain easy to understand | Low-volume businesses may prefer manual operation; reliable service access and billing are not implemented |
| Disclosed fee on collected receipts | Price follows use | Can be expensive on thin margins, complicates cash-floor/split accounting and requires reviewed contract and checkout changes |

Provisional recommendation: test a flat business subscription first. It permits a clear operating cost without changing receipt allocation semantics. This is a research recommendation, not a selected price or authorization to start billing. Ask open-ended willingness to pay before presenting alternatives; do not turn hypothetical acceptance into revenue.

## Cost and break-even evidence

Measure monthly incremental hosting/monitoring cost H, attributable gas sponsorship G, and support hours S at an explicit hourly cost C. With N paying businesses and monthly price P, contribution is N*P - H - G - S*C before other costs and taxes. Break-even P is (H+G+S*C)/N for N>0. Record actual keeper gas usage and distinguish a configured gas cap from incurred spend. Shared VPS costs need an explicit allocation assumption; zero new hosting invoices do not mean zero cost.

Before selecting a price, collect five qualified pricing responses, list actual unit costs, and test whether the value is recurring. Public submission can present this as a proposed model with assumptions and open risks. Enabling fees or paid access is a separate implementation decision; it must preserve exact invoice amounts, explicit authority, cash-floor accounting and auditable repayment.
