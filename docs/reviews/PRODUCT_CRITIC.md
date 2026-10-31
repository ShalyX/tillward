# Tillward Product Critic review

Reviewed October 26, 2026 against submitted source baseline `bfbb21f`, the approved product lock, actual AKINDO entry, public app, deck and script.

## Provenance and verdict

**MODIFY.** Preserve the product thesis; improve the repayment-limit explanation and validate the customer/payment assumptions before expanding it.

A separate Product Critic agent inspected the product and returned initial findings. It hit the account usage limit before saving its final report. The root operator completed this document, verified the key contract/UI claims, and owns the final verdict. This is not an independently completed final-agent sign-off.

## What survives criticism

The approved purpose is specific and coherent: a BTC-holding agency, studio or seller borrows MUSD working capital, collects customer invoices in MUSD, and allocates an owner-selected receipt share toward native Mezo debt while retaining a cash reserve. The paid-invoice-to-lower-debt moment is technically demonstrated. Owner policy, invoices, history and explicit loan exit support that purpose. The keeper remains supporting infrastructure rather than taking over the product identity.

Fresh read-only browser inspection loaded the real account at block 16,379,476: 502 MUSD collected, 100.40 repaid, 2,101.82 debt and 1,389.60 available to withdraw. These are testnet observations, not business demand evidence. See `evidence/app-live-account.txt` and its screenshot. The submitted entry and deck make the absence of customer adoption clear.

## PC-01 — P1 product-validation priority: the intersection of required behaviours is unproven

The customer must hold BTC, accept collateralized-loan risk, find MUSD useful for operating expenses, and have customers willing to obtain/pay MUSD. The package does not document a real business that already meets these conditions, current repayment effort, payment frequency, or willingness to adopt Tillward. A technically working split does not establish that switching checkout/payment behaviour is worthwhile.

This is missing evidence, not proof that the audience does not exist. Narrow the first pilot to a business already accepting MUSD. Interview both the borrower and one paying customer. Record their actual operating-payment and repayment workflow, friction, expected invoice values, wallet setup and willingness to continue. Do not add fiat collection or connectors merely to escape this validation question.

## PC-02 — P1 expectation priority: receipt repayment stops at minimum principal

`contracts/RevenueAccount.sol:111-119` caps settlement at `debt - minimum - reserve`. At the endpoint, new receipts increase funds/allocation without enabling further principal amortization. Accrued interest may create small later headroom. Explicit owner closure remains available (`155-166`).

For an illustrative 2,202 total-debt position with a 2,000 minimum-plus-reserve floor, only about 202 can amortize before new interest. The larger the initial loan above the floor, the more useful the receipt-linked range. This is an intended protocol boundary, not a contract exploit. It materially changes the near-minimum-loan value proposition.

The UI's reason 4 says “Keep collecting or close the loan” (`src/main.ts:32`). The broad explanation that small allocations accumulate until eligible fails to distinguish insufficient cash from the minimum-principal endpoint. Show remaining automatic repayment headroom and explain the final owner close step. Demonstrate that endpoint as well as the first successful repayment. Preserve the safeguard rather than promising unlimited automatic amortization.

## PC-03 — P2: a cash floor is a reserved balance, not currently spendable cash

Both settlement and withdrawal reserve the floor (`RevenueAccount.sol:118-119`, `137-145`). The owner must lower policy to access it. The detailed policy screen says this, but narration about keeping money available for everyday expenses can imply immediate availability. The dashboard separately labels available-to-withdraw funds accurately.

Use “reserved balance” where the floor is explained, distinguish it from withdrawable operating funds, and make the deliberate policy-change step understandable. Validate whether the proposed customer wants this reserve model. Do not characterize an owner-adjustable policy as locked or stolen funds.

## PC-04 — P2: differentiation is a workflow hypothesis, not a defensible moat yet

The clearest difference from manual native borrowing, a wallet transfer and manual repayment is a single business-account record connecting receipt allocation to debt reduction. That is a credible demonstration. Evidence of saved work, better repayment behaviour, repeat use, or a viable revenue model is absent. No exhaustive novelty or adoption claim is justified.

Ask a pilot business to compare one actual invoice cycle with its existing method. Measure steps, time, failed payments and whether it keeps using the rule. Establish an acceptable business model before adding a fee or claiming commercial viability.

## PC-05 — P2: live proof is harder to discover as the demo ages

The default app is an explicitly labeled example; testnet onboarding then asks for a wallet. The existing real-account URL works without one, but is most discoverable through the pitch/judge guide. At the reviewed head, live totals were nonzero while recent activity and the first Activity page were empty. A judge must load older history to see old receipt evidence (`evidence/app-live-activity.txt`). This is pagination, not evidence that payments disappeared.

Give the no-wallet judge path a direct, visible route to a historical receipt and its repayment evidence. Avoid making a fresh judge complete funding/signing just to understand the demonstrated product.

## Recommended scope

Before treating the current slice as robust: address the Red Team's replaced-transaction recovery issue and exact checkout amount display. For presentation: clarify minimum debt and reserve semantics, expose the recorded receipt proof directly, and reconcile stale public documentation. For the next product stage: run customer/payment validation. These are recommendations; no app, contract, keeper, video or submission was changed by this review.
