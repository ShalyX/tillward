# Approved product coverage — Wave 2

Purpose: BTC-backed MUSD working capital repaid from owner-selected customer receipts. The keeper, transaction recovery, monitoring and tests support that purpose.

| Requirement | Coverage | Evidence |
| --- | --- | --- |
| R01 owner authority | Implemented, negative contract coverage | Account tests and public owner flows |
| R02 native loan | Publicly verified | Loan, top-up and exit proofs in deployments/ |
| R03 share and pause | V2 99% cap, explicit consent, Pause in rules | Fee tests, live policy/fee proof |
| R04 exact final-payment checkout | Publicly verified | Invoice/payment proofs, 18-decimal regression tests |
| R05 bounded allocations | Local/fork and public positive path | Fee floor/rollback/pending tests; public 495 settlement |
| R06 native debt reduction | Publicly verified | Atomic repayment receipt and native state delta |
| R07 owner funds/exit | Publicly verified | MUSD withdrawal, native closure, BTC return and surplus recovery |
| R08 refresh/history | Implemented and regression checked | Transaction journal and history tests; recorded UI |
| R09 usable workspace | Actual public UI captured | Wave 2 deck and revised composition; no Settings tab |

Original requirements and explicit owner amendments are in REQUIREMENTS.md. Interviews remain held. No business adoption or independent security review is implied by technical completion.
