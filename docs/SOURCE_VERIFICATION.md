# Mezo testnet source verification

Verified October 31, 2026 through the explorer's rendered Contract tab. All three display **Contract source code verified (exact match)**:

| Deployment | Explorer |
|---|---|
| RevenueFactory | https://explorer.test.mezo.org/address/0xaf90fe019f7303bb4720437dcfbafe1549474f36?tab=contract |
| Original demo RevenueAccount | https://explorer.test.mezo.org/address/0x5B4b9C9AD2E5c6Ef55A4186ad82580B61A67c6C5?tab=contract |
| Rabby QA RevenueAccount | https://explorer.test.mezo.org/address/0x791fFc8A7420dBB0ed5D9F28E811ec7576936433?tab=contract |

Compiler: v0.8.24+commit.e11b9ed9. EVM: london. Optimizer enabled, 200 runs. MIT license. Standard JSON source inputs were built from the original Foundry artifact metadata, with every source keccak checked against that metadata before upload. Contract addresses and constructor values were preserved; no redeployment or wallet transaction occurred.

The explorer frontend advertises https://api.explorer.test.mezo.org as its API host. Public source verification was submitted to `/api/v2/smart-contracts/{address}/verification/via/standard-input`, with the JSON upload explicitly typed `application/json`, compiler version, contract name, MIT license and automatic constructor detection. An accepted queue response alone was not treated as success; the exact-match result was independently read on each rendered contract page.

Raw browser observations and factory/QA screenshots are in reviews/evidence/wave2-*-verified.*. This verifies correspondence between published source and deployed code. It is not an independent security audit or a mainnet-readiness approval.
