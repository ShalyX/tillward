// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "./NativeInterfaces.sol";

contract RevenueAccount {
    address public immutable owner;
    IBorrowerOperations public immutable borrowerOperations;
    ITroveManager public immutable troveManager;
    IMusd public immutable musd;
    uint16 public repaymentBps = 2000;
    uint256 public cashFloor;
    bool public paused;
    uint256 public pendingRepayment;
    uint256 public totalCollected;
    uint256 public totalRepaid;
    uint256 private entered = 1;

    struct Invoice { string label; uint256 amount; uint64 expiresAt; address payer; bool paid; bool canceled; }
    mapping(bytes32 => Invoice) public invoices;
    bytes32[] public invoiceIds;

    event PolicyUpdated(uint16 repaymentBps, uint256 cashFloor, bool paused);
    event LoanOpened(uint256 borrowed, uint256 collateral);
    event LoanClosed(uint256 repaid);
    event InvoiceCreated(bytes32 indexed id, string label, uint256 amount, uint64 expiresAt);
    event InvoiceCanceled(bytes32 indexed id);
    event ReceiptCollected(bytes32 indexed id, address indexed payer, uint256 amount, uint256 allocated);
    event RepaymentSettled(address indexed caller, uint256 amount, uint256 debtBefore, uint256 debtAfter);
    event OperatingWithdrawal(uint256 amount);
    event AllocationReleased(uint256 amount);

    error Unauthorized();
    error InvalidInput();
    error InvoiceUnavailable();
    error NothingToRepay();
    error InsufficientAvailableFunds();
    error ProtocolMismatch();
    error TransferFailed();
    error Paused();
    error Reentrancy();

    modifier onlyOwner() { if (msg.sender != owner) revert Unauthorized(); _; }
    modifier guarded() { if (entered != 1) revert Reentrancy(); entered = 2; _; entered = 1; }

    constructor(address businessOwner, address operations) {
        if (businessOwner == address(0) || operations.code.length == 0) revert InvalidInput();
        owner = businessOwner;
        borrowerOperations = IBorrowerOperations(operations);
        address token = borrowerOperations.musd();
        address manager = borrowerOperations.troveManager();
        if (token.code.length == 0 || manager.code.length == 0) revert ProtocolMismatch();
        musd = IMusd(token);
        troveManager = ITroveManager(manager);
    }

    function openLoan(uint256 amount, address upper, address lower) external payable onlyOwner guarded {
        if (amount == 0 || msg.value == 0) revert InvalidInput();
        borrowerOperations.openTrove{value:msg.value}(amount, upper, lower);
        emit LoanOpened(amount, msg.value);
    }

    function addCollateral(address upper, address lower) external payable onlyOwner guarded {
        if (msg.value == 0) revert InvalidInput();
        borrowerOperations.addColl{value:msg.value}(upper, lower);
    }

    function setPolicy(uint16 bps, uint256 floor, bool stop) external onlyOwner {
        if (bps > 10000) revert InvalidInput();
        repaymentBps = bps; cashFloor = floor; paused = stop;
        emit PolicyUpdated(bps, floor, stop);
    }

    function createInvoice(bytes32 id, string calldata ref, uint256 amount, uint64 expiry) external onlyOwner {
        if (id == bytes32(0) || invoices[id].amount != 0 || amount == 0 || expiry <= block.timestamp ||
            bytes(ref).length == 0 || bytes(ref).length > 64) revert InvalidInput();
        invoices[id] = Invoice(ref, amount, expiry, address(0), false, false);
        invoiceIds.push(id);
        emit InvoiceCreated(id, ref, amount, expiry);
    }

    function cancelInvoice(bytes32 id) external onlyOwner {
        Invoice storage item = invoices[id];
        if (item.amount == 0 || item.paid || item.canceled) revert InvoiceUnavailable();
        item.canceled = true;
        emit InvoiceCanceled(id);
    }

    function payInvoice(bytes32 id) external guarded {
        Invoice storage item = invoices[id];
        if (item.amount == 0 || item.paid || item.canceled || block.timestamp > item.expiresAt) revert InvoiceUnavailable();
        uint256 beforeBalance = musd.balanceOf(address(this));
        item.paid = true; item.payer = msg.sender;
        if (!musd.transferFrom(msg.sender, address(this), item.amount)) revert TransferFailed();
        if (musd.balanceOf(address(this)) - beforeBalance != item.amount) revert TransferFailed();
        uint256 allocated = paused ? 0 : item.amount * repaymentBps / 10000;
        pendingRepayment += allocated; totalCollected += item.amount;
        emit ReceiptCollected(id, msg.sender, item.amount, allocated);
    }

    function invoiceCount() external view returns (uint256) { return invoiceIds.length; }

    function debtState() public view returns (uint256 debt, uint256 collateral, uint256 minimum, uint256 reserve, bool active) {
        active = troveManager.getTroveStatus(address(this)) == 1;
        uint256 interest;
        (collateral, debt, interest,,,) = troveManager.getEntireDebtAndColl(address(this));
        debt += interest;
        minimum = borrowerOperations.minNetDebt();
        reserve = borrowerOperations.MUSD_GAS_COMPENSATION();
    }

    function repaymentQuote() public view returns (uint256 amount, uint8 reason) {
        if (paused) return (0,1);
        if (pendingRepayment == 0) return (0,2);
        (uint256 debt,,uint256 minimum,uint256 reserve,bool active) = debtState();
        if (!active) return (0,3);
        if (debt <= minimum + reserve) return (0,4);
        uint256 balance = musd.balanceOf(address(this));
        if (balance <= cashFloor) return (0,5);
        amount = _min(pendingRepayment, _min(balance - cashFloor, debt - minimum - reserve));
    }

    function settle(uint256 maximum, address upper, address lower) external guarded returns (uint256 amount) {
        if (paused) revert Paused();
        (amount,) = repaymentQuote(); amount = _min(amount, maximum);
        if (amount == 0) revert NothingToRepay();
        (uint256 beforeDebt,,,,) = debtState();
        uint256 beforeBalance = musd.balanceOf(address(this));
        pendingRepayment -= amount;
        borrowerOperations.repayMUSD(amount, upper, lower);
        (uint256 afterDebt,,,,) = debtState();
        if (beforeDebt < afterDebt || beforeDebt - afterDebt != amount ||
            beforeBalance - musd.balanceOf(address(this)) != amount) revert ProtocolMismatch();
        totalRepaid += amount;
        emit RepaymentSettled(msg.sender, amount, beforeDebt, afterDebt);
    }

    function availableToWithdraw() public view returns (uint256) {
        uint256 balance = musd.balanceOf(address(this));
        if (balance <= pendingRepayment || balance - pendingRepayment <= cashFloor) return 0;
        return balance - pendingRepayment - cashFloor;
    }

    function withdraw(uint256 amount) external onlyOwner guarded {
        if (amount == 0 || amount > availableToWithdraw()) revert InsufficientAvailableFunds();
        if (!musd.transfer(owner, amount)) revert TransferFailed();
        emit OperatingWithdrawal(amount);
    }

    function releaseAllocation(uint256 amount) external onlyOwner {
        if (amount == 0 || amount > pendingRepayment) revert InvalidInput();
        pendingRepayment -= amount;
        emit AllocationReleased(amount);
    }

    // Explicit owner action to finish the loan, including its final minimum-debt portion.
    function closeLoan() external onlyOwner guarded {
        (uint256 debt,,,uint256 reserve,bool active) = debtState();
        if (!active) revert NothingToRepay();
        uint256 amount = debt - reserve;
        uint256 balance = musd.balanceOf(address(this));
        if (balance < amount || balance - amount < cashFloor) revert InsufficientAvailableFunds();
        pendingRepayment -= _min(pendingRepayment, amount);
        borrowerOperations.closeTrove();
        if (troveManager.getTroveStatus(address(this)) == 1 || balance - musd.balanceOf(address(this)) != amount) revert ProtocolMismatch();
        totalRepaid += amount;
        emit LoanClosed(amount);
    }

    function claimSurplus() external onlyOwner guarded { borrowerOperations.claimCollateral(); }
    function withdrawBTC(uint256 amount) external onlyOwner guarded {
        if (amount == 0 || amount > address(this).balance) revert InvalidInput();
        (bool ok,) = payable(owner).call{value:amount}("");
        if (!ok) revert TransferFailed();
    }
    function _min(uint256 a,uint256 b) private pure returns(uint256) { return a < b ? a : b; }
    receive() external payable {}
}
