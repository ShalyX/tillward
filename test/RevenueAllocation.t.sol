// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "./RevenueFees.t.sol";
import "../contracts/RevenueAccountV3.sol";

contract RevenueAllocationTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    FeeTokenMock token;
    ProtocolMock protocol;
    RevenueAccountV3 account;
    address customer=address(0xCAFE);
    address treasury=address(0xFEE);
    function setUp() public {
        token=new FeeTokenMock();protocol=new ProtocolMock(token);
        account=new RevenueAccountV3(address(this),address(protocol),treasury);
        vm.deal(address(this),10 ether);
        account.setPolicy(8000,0,false);account.setServiceEnabled(true);
    }
    function receipt(uint256 amount,bytes32 id) internal {
        account.createInvoice(id,"Final receipt",amount,uint64(block.timestamp+1 days));
        token.mint(customer,amount);vm.prank(customer);token.approve(address(account),amount);
        vm.prank(customer);account.payInvoice(id);
    }
    function loan() internal {
        account.openLoan{value:1 ether}(2000e18,address(0),address(0));account.withdraw(2000e18);
    }
    function testOversizedReceiptReservesOnlyOutstandingPayableDebt() public {
        loan();receipt(5000e18,keccak256("large"));
        require(account.pendingRepayment()==2000e18,"reserve only remaining payable debt");
        require(account.retainedReceiptFunds()==3000e18,"unneeded allocation stays retained");
        require(account.feeReserve()==20e18&&account.availableToWithdraw()==2980e18,"excess available without cleanup");
    }
    function testRepeatedReceiptsShareOneOutstandingDebtCap() public {
        loan();receipt(5000e18,keccak256("one"));receipt(5000e18,keccak256("two"));
        require(account.pendingRepayment()==2000e18,"no duplicate debt reservation");
        require(account.retainedReceiptFunds()==8000e18,"second excess retained");
    }
    function testClosureReleasesEverythingWithNoRoutingFee() public {
        loan();receipt(5000e18,keccak256("close"));account.closeLoan();
        require(account.pendingRepayment()==0&&account.feeReserve()==0,"no stale reservation after closure");
        require(account.availableToWithdraw()==3000e18,"all remaining receipt funds available");
        require(account.totalFeesPaid()==0&&token.balanceOf(treasury)==0,"no fee for unused allocation or closure");
        account.withdraw(3000e18);require(token.balanceOf(address(account))==0,"owner withdraws without release action");
    }
    function testFeeOnlyOnActualPartialRepaymentThenClosureReleasesRemainder() public {
        loan();receipt(5000e18,keccak256("repay"));
        require(account.settle(type(uint256).max,address(0),address(0))==200e18,"native minimum still enforced");
        require(token.balanceOf(treasury)==2e18&&account.pendingRepayment()==1800e18,"fee only on actual 200");
        account.closeLoan();require(account.availableToWithdraw()==2998e18&&account.pendingRepayment()==0,"close leaves no cleanup");
        require(token.balanceOf(treasury)==2e18,"no fee on closing remainder");
    }
    function testNoLoanReceiptHasNoRepaymentOrFeeReservation() public {
        receipt(1000e18,keccak256("no-loan"));
        require(account.pendingRepayment()==0&&account.feeReserve()==0,"no future loan allocation");
        require(account.retainedReceiptFunds()==1000e18&&account.availableToWithdraw()==1000e18,"receipt fully available");
    }
    function testReceiptAfterClosureStaysAvailable() public {
        loan();receipt(5000e18,keccak256("before"));account.closeLoan();receipt(100e18,keccak256("after"));
        require(account.pendingRepayment()==0&&account.availableToWithdraw()==3100e18,"closed loan cannot trap new receipts");
    }
    function testNativeDebtReductionUpdatesViewsWithoutReleaseTransaction() public {
        loan();receipt(5000e18,keccak256("external"));
        vm.prank(address(account));protocol.repayMUSD(200e18,address(0),address(0));
        require(account.pendingRepayment()==1800e18&&account.feeReserve()==18e18,"native debt cap reflected immediately");
        receipt(100e18,keccak256("later"));require(account.pendingRepayment()==1800e18,"later receipt does not revive released allocation");
    }
    function testNativeClosureCannotCarryReservationsIntoNewLoan() public {
        loan();receipt(5000e18,keccak256("external-close"));
        vm.prank(address(account));protocol.closeTrove();
        require(account.pendingRepayment()==0&&account.availableToWithdraw()==3000e18,"inactive loan automatically releases views");
        account.openLoan{value:1 ether}(2000e18,address(0),address(0));
        require(account.pendingRepayment()==0,"old reservation never follows new loan");
    }
    function testNativeClosureFailureKeepsReservationsAndFundsIntact() public {
        loan();receipt(5000e18,keccak256("failed-close"));protocol.setFail(true);
        vm.expectRevert();account.closeLoan();
        require(account.pendingRepayment()==2000e18&&token.balanceOf(address(account))==5000e18,"failed close rolls back");
        require(account.totalFeesPaid()==0&&account.totalRepaid()==0,"failed close changes no counters");
    }
    function testFuzzAllocationNeverExceedsLoanAndClosureLeavesNoReservation(uint96 raw,uint16 bpsRaw) public {
        loan();uint256 n=uint256(raw)%100000e18+2000e18;uint16 bps=uint16(uint256(bpsRaw)%9901);
        account.setPolicy(bps,0,false);receipt(n,keccak256("fuzz-cap"));
        uint256 expected=n*bps/10000;if(expected>2000e18)expected=2000e18;
        require(account.pendingRepayment()==expected,"exact capped share");
        require(account.retainedReceiptFunds()==n-expected,"receipt conservation");
        account.closeLoan();
        require(account.pendingRepayment()==0&&account.feeReserve()==0,"no cleanup across amounts/shares");
        require(account.availableToWithdraw()==n-2000e18,"all remaining cash available");
        require(account.totalFeesPaid()==0&&token.balanceOf(treasury)==0,"no fees on unused allocations");
    }
    receive() external payable {}
}
