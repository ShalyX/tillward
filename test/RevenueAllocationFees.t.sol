// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "./RevenueFees.t.sol";
import "../contracts/RevenueAccountV3.sol";
import "../contracts/RevenueFactoryV3.sol";
contract RevenueAllocationFeesRegressionTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    TokenMock token;
    ProtocolMock protocol;
    RevenueAccountV3 account;
    IServiceAccount service;
    address customer=address(0xCAFE);
    address treasury=address(0xFEE);
    function setUp() public {
        token=new FeeTokenMock();protocol=new ProtocolMock(token);
        account=new RevenueAccountV3(address(this),address(protocol),treasury);
        service=IServiceAccount(address(account));vm.deal(address(this),10 ether);
    }
    function receipt(uint256 n,bytes32 id) internal {
        account.createInvoice(id,"Receipt",n,uint64(block.timestamp+1 days));
        token.mint(customer,n);vm.prank(customer);token.approve(address(account),n);
        vm.prank(customer);account.payInvoice(id);
    }
    function prepare(uint256 floor) internal {
        account.openLoan{value:1 ether}(5000e18,address(0),address(0));
        account.withdraw(5000e18);
        account.setPolicy(9900,floor,false);
        service.setServiceEnabled(true);
        receipt(500e18,keccak256("one"));
    }
    function testMaximumAllocationIs99Percent() public {
        vm.expectRevert();account.setPolicy(9901,0,false);
        vm.expectRevert();account.setPolicy(10000,0,false);
        account.setPolicy(9900,0,false);
    }
    function testAtomicFeeMayCrossRepaymentFloor() public {
        prepare(5e18);
        require(account.settle(type(uint256).max,address(0),address(0))==495e18,"full repayment");
        require(protocol.debt(address(account))==4705e18,"lender received full 495");
        require(token.balanceOf(treasury)==4.95e18,"exact 1% fee");
        require(token.balanceOf(address(account))==0.05e18,"authorized fee crosses floor");
        require(account.cashFloor()==5e18,"floor setting not changed");
        require(service.totalFeesPaid()==4.95e18&&service.totalServiceRepaid()==495e18,"paid counters");
        require(account.pendingRepayment()==0,"no pending repayment");
    }
    function testFloorLimitsRepaymentBeforeFeeAndProtectsOtherAllocations() public {
        prepare(100e18);
        (uint256 quote,)=account.repaymentQuote();require(quote==400e18,"ordinary floor cap");
        account.settle(type(uint256).max,address(0),address(0));
        require(token.balanceOf(treasury)==4e18,"fee on actual 400");
        require(token.balanceOf(address(account))==96e18,"authorized below floor");
        require(account.pendingRepayment()==95e18,"other allocation intact");
    }
    function testFloorWithNoRepaymentChargesNothing() public {
        prepare(500e18);vm.expectRevert();account.settle(495e18,address(0),address(0));
        require(token.balanceOf(treasury)==0&&service.totalFeesPaid()==0,"no fee without repayment");
    }
    function testFeeFailureRollsBackLenderPaymentAndAllCounters() public {
        prepare(5e18);FeeTokenMock(address(token)).blockRecipient(treasury,false);
        vm.expectRevert();account.settle(495e18,address(0),address(0));
        assertUnchanged();
        FeeTokenMock(address(token)).blockRecipient(address(0),false);
        account.settle(495e18,address(0),address(0));
        require(service.totalFeesPaid()==4.95e18,"retry charges once");
        vm.expectRevert();account.settle(495e18,address(0),address(0));
        require(token.balanceOf(treasury)==4.95e18,"repeat cannot charge twice");
    }
    function assertUnchanged() internal view {
        require(protocol.debt(address(account))==5200e18,"lender rollback");
        require(account.pendingRepayment()==495e18&&account.totalRepaid()==0,"repayment rollback");
        require(service.totalFeesPaid()==0&&service.totalServiceRepaid()==0,"fee counters rollback");
        require(token.balanceOf(address(account))==500e18&&token.balanceOf(treasury)==0,"token rollback");
        require(service.retainedReceiptFunds()==5e18,"retained ledger rollback");
    }
    function testShortFeeDeliveryAlsoRollsBackEverything() public {
        prepare(5e18);FeeTokenMock(address(token)).blockRecipient(treasury,true);
        vm.expectRevert();account.settle(495e18,address(0),address(0));assertUnchanged();
    }
    function testNativeFailureChargesNothing() public {
        prepare(5e18);protocol.setFail(true);
        vm.expectRevert();account.settle(495e18,address(0),address(0));assertUnchanged();
    }
    function testOtherPendingFundsCannotFundFeeOrShrinkQuote() public {
        prepare(0);token.burn(address(account),5e18);
        (uint256 amount,uint256 fee,bool funded)=service.serviceQuote(type(uint256).max);
        require(amount==495e18&&fee==4.95e18&&!funded,"fee cannot shrink repayment quote");
        vm.expectRevert();account.settle(495e18,address(0),address(0));
        require(account.pendingRepayment()==495e18&&protocol.debt(address(account))==5200e18,"allocation untouched");
    }
    function testBorrowedOrDonatedFundsDoNotRestoreSpentReceiptAuthorization() public {
        prepare(0);service.setServiceEnabled(false);
        account.withdraw(5e18);
        require(service.retainedReceiptFunds()==0,"withdrawal consumes retained funds");
        token.mint(address(account),100e18); // Untracked funds are not authorized retained receipts.
        vm.expectRevert();service.setServiceEnabled(true);
        require(token.balanceOf(treasury)==0,"donation cannot be billed");
    }
    function testWithdrawReservesFundingWithoutInventingFeeDebt() public {
        prepare(0);
        require(service.feeReserve()==4.95e18,"funding reservation");
        require(account.availableToWithdraw()==0.05e18,"only unreserved retained cash");
        vm.expectRevert();account.withdraw(0.05e18+1);
        account.withdraw(0.05e18);account.settle(495e18,address(0),address(0));
        require(token.balanceOf(address(account))==0&&service.feeReserve()==0,"no outstanding fee");
    }
    function testPartialSettlementAndChangedRuleChargeOnlyActualRepayment() public {
        prepare(0);account.setPolicy(0,0,false);
        account.settle(200e18,address(0),address(0));
        require(account.pendingRepayment()==295e18&&token.balanceOf(treasury)==2e18,"partial exact");
        account.settle(type(uint256).max,address(0),address(0));
        require(token.balanceOf(treasury)==4.95e18,"old allocations retain funding");
        require(service.retainedReceiptFunds()==0.05e18,"remaining receipt ledger");
    }
    function testOwnerReleaseFreesReservationWithoutCharging() public {
        prepare(0);account.releaseAllocation(495e18);
        require(service.feeReserve()==0&&service.totalFeesPaid()==0,"release is not repayment");
        require(account.availableToWithdraw()==500e18,"all unallocated funds available");
        account.withdraw(500e18);require(service.retainedReceiptFunds()==0,"ledger tracks withdrawals");
    }
    function testNoEnrollmentAndNoStrangerCanAuthorizeService() public {
        account.setPolicy(9900,0,false);receipt(500e18,keccak256("no loan"));
        vm.expectRevert();vm.prank(customer);service.setServiceEnabled(true);
        vm.expectRevert();account.settle(1,address(0),address(0));
        service.setServiceEnabled(true);
        vm.expectRevert();account.settle(495e18,address(0),address(0));
        require(token.balanceOf(treasury)==0,"no fee before loan");
    }
    function testPauseBlocksBothTransfersAndNewReceiptsRemainRetained() public {
        prepare(0);account.setPolicy(9900,0,true);
        receipt(100e18,keccak256("paused"));
        vm.expectRevert();account.settle(495e18,address(0),address(0));
        require(service.retainedReceiptFunds()==105e18&&account.pendingRepayment()==495e18,"pause allocations");
        require(token.balanceOf(treasury)==0,"pause no fee");
    }
    function testOwnerDirectRepaymentWorksEvenWhenFeeRecipientFails() public {
        prepare(5e18);FeeTokenMock(address(token)).blockRecipient(treasury,false);
        vm.expectRevert();vm.prank(customer);service.settleDirect(495e18,address(0),address(0));
        service.settleDirect(495e18,address(0),address(0));
        require(account.totalRepaid()==495e18&&service.totalServiceRepaid()==0,"owner direct scope");
        require(token.balanceOf(treasury)==0&&token.balanceOf(address(account))==5e18,"no fee on owner route");
    }
    function testCloseIsFeeFreeAndReconcilesRetainedLedger() public {
        prepare(0);token.mint(address(account),4500e18);
        account.closeLoan();
        require(protocol.debt(address(account))==0&&service.totalFeesPaid()==0,"exit fee free");
        require(service.retainedReceiptFunds()==0&&account.pendingRepayment()==0,"close consumes ledger honestly");
        require(address(account).balance==1 ether,"collateral returned");
    }
    function testMinimumDebtLimitsActualRepaymentAndFee() public {
        account.openLoan{value:1 ether}(2000e18,address(0),address(0));account.withdraw(2000e18);
        account.setPolicy(9900,0,false);service.setServiceEnabled(true);receipt(500e18,keccak256("minimum"));
        account.settle(type(uint256).max,address(0),address(0));
        require(protocol.debt(address(account))==2000e18,"minimum maintained");
        require(token.balanceOf(treasury)==2e18&&account.pendingRepayment()==295e18,"fee on 200 only");
    }
    function testDustRoundsDownWithoutArrears() public {
        prepare(0);account.settle(99,address(0),address(0));
        require(token.balanceOf(treasury)==0&&service.totalFeesPaid()==0,"no fractional fee debt");
        account.settle(101,address(0),address(0));
        require(token.balanceOf(treasury)==1&&service.totalFeesPaid()==1,"integer floor per settlement");
    }
    function testFeeTransferCannotReenterSettlement() public {
        prepare(0);FeeTokenMock(address(token)).setReentry(address(account));
        account.settle(200e18,address(0),address(0));
        require(!FeeTokenMock(address(token)).reentrySucceeded(),"reentry rejected");
        require(account.pendingRepayment()==295e18&&service.totalFeesPaid()==2e18,"one settlement");
    }
    function testFactoryTermsAndOwnerIsolation() public {
        RevenueFactoryV3 factory=new RevenueFactoryV3(address(protocol),treasury);
        address first=factory.createAccount();vm.prank(customer);address second=factory.createAccount();
        RevenueAccountV3 a=RevenueAccountV3(payable(first));
        require(first!=second&&factory.accountOf(customer)==second&&factory.isAccount(first),"registry");
        require(a.feeTreasury()==treasury&&!a.serviceEnabled()&&a.accountVersion()==3,"immutable terms, opt in");
        vm.expectRevert();factory.createAccount();
        vm.expectRevert();vm.prank(customer);a.setServiceEnabled(true);
    }
    function testMixedReceiptsWithdrawalsAndPartialSettlementKeepFundingSeparate() public {
        prepare(0);account.withdraw(0.05e18);
        account.setPolicy(2000,0,false);receipt(100e18,keccak256("second"));
        require(account.pendingRepayment()==515e18&&service.retainedReceiptFunds()==84.95e18,"mixed allocations");
        account.settle(200e18,address(0),address(0));
        require(account.pendingRepayment()==315e18&&service.retainedReceiptFunds()==82.95e18,"partial accounting");
        require(token.balanceOf(address(account))==397.95e18&&token.balanceOf(treasury)==2e18,"conservation");
        account.withdraw(account.availableToWithdraw());
        require(service.retainedReceiptFunds()==3.15e18,"only remaining fee funding reserved");
        account.settle(type(uint256).max,address(0),address(0));
        require(account.pendingRepayment()==0&&service.retainedReceiptFunds()==0,"no fee debt after second settlement");
        require(token.balanceOf(treasury)==5.15e18,"only actual repayment fees");
    }
    function testInvalidTreasuryAndDisabledServiceCannotCharge() public {
        vm.expectRevert();new RevenueAccountV3(address(this),address(protocol),address(0));
        vm.expectRevert();new RevenueAccountV3(address(this),address(protocol),address(token));
        vm.expectRevert();new RevenueAccountV3(address(this),address(protocol),address(protocol));
        prepare(0);service.setServiceEnabled(false);
        vm.expectRevert();account.settle(495e18,address(0),address(0));
        require(service.totalFeesPaid()==0&&service.feeReserve()==0,"revocation has no arrears");
        service.settleDirect(495e18,address(0),address(0));
        require(protocol.debt(address(account))==4705e18,"direct repayment after revocation");
    }
    function testFuzzRepaymentFeeAndProtectedCash(uint96 raw,uint16 bpsSeed,uint96 floorSeed) public {
        uint256 n=uint256(raw)%2000e18+100;
        uint16 bps=uint16(uint256(bpsSeed)%9901);
        uint256 floor=uint256(floorSeed)%(n+1);
        account.openLoan{value:1 ether}(5000e18,address(0),address(0));account.withdraw(5000e18);
        account.setPolicy(bps,floor,false);service.setServiceEnabled(true);receipt(n,keccak256("fuzz"));
        uint256 pending=account.pendingRepayment();
        (uint256 r,uint256 f,bool funded)=service.serviceQuote(type(uint256).max);
        if(r==0||!funded){vm.expectRevert();account.settle(type(uint256).max,address(0),address(0));return;}
        require(n-r>=floor,"repayment satisfies floor before fee");
        account.settle(type(uint256).max,address(0),address(0));
        require(protocol.debt(address(account))==5200e18-r,"full lender repayment");
        require(token.balanceOf(treasury)==r/100&&f==r/100,"1% actual");
        require(token.balanceOf(address(account))==n-r-f,"conservation");
        require(token.balanceOf(address(account))>=pending-r,"other repayments protected");
        require(service.retainedReceiptFunds()==n-pending-f,"retained provenance");
    }
}
