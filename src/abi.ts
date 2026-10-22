import {parseAbi} from 'viem';
export const accountAbi=parseAbi([
 'function owner() view returns(address)',
 'function musd() view returns(address)',
 'function borrowerOperations() view returns(address)',
 'function repaymentBps() view returns(uint16)',
 'function cashFloor() view returns(uint256)',
 'function paused() view returns(bool)',
 'function pendingRepayment() view returns(uint256)',
 'function totalCollected() view returns(uint256)',
 'function totalRepaid() view returns(uint256)',
 'function availableToWithdraw() view returns(uint256)',
 'function debtState() view returns(uint256 debt,uint256 collateral,uint256 minimum,uint256 reserve,bool active)',
 'function repaymentQuote() view returns(uint256 amount,uint8 reason)',
 'function invoiceCount() view returns(uint256)',
 'function invoiceIds(uint256) view returns(bytes32)',
 'function invoices(bytes32) view returns(string label,uint256 amount,uint64 expiresAt,address payer,bool paid,bool canceled)',
 'function openLoan(uint256,address,address) payable',
 'function addCollateral(address,address) payable',
 'function closeLoan()',
 'function claimSurplus()',
 'function withdrawBTC(uint256)',
 'function setPolicy(uint16,uint256,bool)',
 'function createInvoice(bytes32,string,uint256,uint64)',
 'function cancelInvoice(bytes32)',
 'function payInvoice(bytes32)',
 'function settle(uint256,address,address) returns(uint256)',
 'function withdraw(uint256)',
 'function releaseAllocation(uint256)',
 'event ReceiptCollected(bytes32 indexed id,address indexed payer,uint256 amount,uint256 allocated)',
 'event LoanClosed(uint256 repaid)',
 'event RepaymentSettled(address indexed caller,uint256 amount,uint256 debtBefore,uint256 debtAfter)',
 'error Unauthorized()', 'error InvalidInput()', 'error InvoiceUnavailable()',
 'error NothingToRepay()', 'error InsufficientAvailableFunds()', 'error ProtocolMismatch()',
 'error TransferFailed()', 'error Paused()', 'error Reentrancy()'
]);
export const factoryAbi=parseAbi([
 'function accountOf(address) view returns(address)',
 'function isAccount(address) view returns(bool)',
 'function createAccount() returns(address)',
 'event AccountCreated(address indexed owner,address indexed account)'
]);
export const tokenAbi=parseAbi([
 'function balanceOf(address) view returns(uint256)',
 'function allowance(address,address) view returns(uint256)',
 'function approve(address,uint256) returns(bool)',
 'function transfer(address,uint256) returns(bool)'
]);
