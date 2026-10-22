// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "../contracts/RevenueAccount.sol";
import "../contracts/RevenueFactory.sol";

interface Vm {
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function deal(address,uint256) external;
    function expectRevert() external;
    function warp(uint256) external;
    function createSelectFork(string calldata) external returns(uint256);
    function createSelectFork(string calldata,uint256) external returns(uint256);
    function envOr(string calldata,bool) external returns(bool);
    function mockCall(address,bytes calldata,bytes calldata) external;
}

contract TokenMock {
    bool public deductFee;
    mapping(address=>uint256) public balanceOf;
    mapping(address=>mapping(address=>uint256)) public allowance;
    function mint(address to,uint256 n) external {balanceOf[to]+=n;}
    function burn(address from,uint256 n) external {balanceOf[from]-=n;}
    function approve(address to,uint256 n) external returns(bool) {allowance[msg.sender][to]=n;return true;}
    function transfer(address to,uint256 n) external returns(bool) {balanceOf[msg.sender]-=n;balanceOf[to]+=n;return true;}
    function transferFrom(address from,address to,uint256 n) external returns(bool) {allowance[from][msg.sender]-=n;balanceOf[from]-=n;balanceOf[to]+=deductFee?n-1:n;return true;}
    function setFee(bool b) external {deductFee=b;}
}

contract ProtocolMock {
    TokenMock public token;
    mapping(address=>uint256) public debt;
    bool public failRepayment;
    constructor(TokenMock t) {token=t;}
    function musd() external view returns(address){return address(token);}
    function troveManager() external view returns(address){return address(this);}
    function minNetDebt() external pure returns(uint256){return 1800e18;}
    function MUSD_GAS_COMPENSATION() external pure returns(uint256){return 200e18;}
    function openTrove(uint256 n,address,address) external payable {require(debt[msg.sender]==0);require(n>=1800e18);debt[msg.sender]=n+200e18;token.mint(msg.sender,n);}
    function repayMUSD(uint256 n,address,address) external {require(!failRepayment);require(debt[msg.sender]-n>=2000e18);debt[msg.sender]-=n;token.burn(msg.sender,n);}
    function getTroveStatus(address a) external view returns(uint256){return debt[a]>0?1:0;}
    function getEntireDebtAndColl(address a) external view returns(uint256,uint256,uint256,uint256,uint256,uint256){return(1 ether,debt[a],0,0,0,0);}
    function setFail(bool b) external {failRepayment=b;}
}

contract RevenueAccountTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    TokenMock token;
    ProtocolMock protocol;
    RevenueAccount account;
    address customer=address(0xCAFE);
    bytes32 constant invoice=keccak256("Agency final invoice 001");
    function setUp() public {
        token=new TokenMock();protocol=new ProtocolMock(token);
        account=new RevenueAccount(address(this),address(protocol));
        vm.deal(address(this),100 ether);
    }
    function prepare(uint256 n) internal {
        account.openLoan{value:1 ether}(5000e18,address(0),address(0));
        account.setPolicy(2000,1000e18,false);
        account.createInvoice(invoice,"Final invoice 001",n,uint64(block.timestamp+1 days));
        token.mint(customer,n);
        vm.prank(customer);token.approve(address(account),n);
        vm.prank(customer);account.payInvoice(invoice);
    }
    function testReceiptSplitsAndRepaysNativeDebt() public {
        prepare(500e18);
        require(account.pendingRepayment()==100e18,"20% allocated");
        require(account.availableToWithdraw()==4400e18,"withdraw excludes both allocation and operating floor");
        uint256 beforeDebt=protocol.debt(address(account));
        account.settle(type(uint256).max,address(0),address(0));
        require(protocol.debt(address(account))==beforeDebt-100e18,"native debt falls");
        require(account.pendingRepayment()==0,"allocation consumed");
    }
    function testInvoiceCannotBePaidTwice() public {
        prepare(500e18);
        token.mint(customer,500e18);vm.prank(customer);token.approve(address(account),500e18);
        vm.expectRevert();vm.prank(customer);account.payInvoice(invoice);
        require(account.pendingRepayment()==100e18,"retry cannot allocate twice");
    }
    function testKeeperCannotChangePolicyOrWithdraw() public {
        prepare(500e18);
        vm.expectRevert();vm.prank(customer);account.setPolicy(0,0,false);
        vm.expectRevert();vm.prank(customer);account.withdraw(1);
        vm.prank(customer);account.settle(100e18,address(0),address(0));
        require(protocol.debt(address(account))==5100e18,"keeper only repays");
    }
    function testCashFloorAndAllocationProtectWithdrawals() public {
        prepare(500e18);
        vm.expectRevert();account.withdraw(4401e18);
        account.withdraw(4400e18);
        account.setPolicy(2000,1100e18,false);
        vm.expectRevert();account.settle(type(uint256).max,address(0),address(0));
        require(account.pendingRepayment()==100e18,"floor preserves allocation");
    }
    function testPausePreservesExistingAllocationAndStopsSettlement() public {
        prepare(500e18);account.setPolicy(2000,1000e18,true);
        vm.expectRevert();account.settle(100e18,address(0),address(0));
        account.createInvoice(keccak256("next"),"Next",500e18,uint64(block.timestamp+1 days));
        token.mint(customer,500e18);vm.prank(customer);token.approve(address(account),500e18);
        vm.prank(customer);account.payInvoice(keccak256("next"));
        require(account.pendingRepayment()==100e18,"paused receipts go to operations");
    }
    function testNativeMinimumDebtCapsRepayment() public {
        prepare(20000e18);account.setPolicy(10000,0,false);
        require(account.settle(type(uint256).max,address(0),address(0))==3200e18,"floor caps repayment");
        require(protocol.debt(address(account))==2000e18,"reserve plus min debt");
        require(account.pendingRepayment()==800e18,"excess deferred");
        vm.expectRevert();account.settle(1,address(0),address(0));
    }
    function testRepaymentFailureKeepsAllocationAndFunds() public {
        prepare(500e18);protocol.setFail(true);
        vm.expectRevert();account.settle(100e18,address(0),address(0));
        require(account.pendingRepayment()==100e18,"allocation retained");
        require(token.balanceOf(address(account))==5500e18,"funds retained");
    }
    function testExpiredInvoiceAndBadPolicyFail() public {
        vm.expectRevert();account.setPolicy(10001,0,false);
        account.createInvoice(invoice,"Expired",500e18,uint64(block.timestamp+10));
        vm.warp(block.timestamp+11);vm.expectRevert();vm.prank(customer);account.payInvoice(invoice);
    }
    function testExplicitAllocationRelease() public {
        prepare(500e18);vm.expectRevert();vm.prank(customer);account.releaseAllocation(100e18);
        account.releaseAllocation(40e18);require(account.pendingRepayment()==60e18,"owner release");
    }
    function testCanceledInvoiceNeverTakesCustomerFunds() public {
        account.createInvoice(invoice,"Canceled",500e18,uint64(block.timestamp+1 days));
        account.cancelInvoice(invoice);token.mint(customer,500e18);
        vm.prank(customer);token.approve(address(account),500e18);
        vm.expectRevert();vm.prank(customer);account.payInvoice(invoice);
        require(token.balanceOf(customer)==500e18,"canceled payment cannot move money");
    }
    function testFeeTokenDeliveryRollsBackPaymentAndAllocation() public {
        account.createInvoice(invoice,"Exact payment",500e18,uint64(block.timestamp+1 days));
        token.setFee(true);token.mint(customer,500e18);
        vm.prank(customer);token.approve(address(account),500e18);
        vm.expectRevert();vm.prank(customer);account.payInvoice(invoice);
        (,,,,bool paid,)=account.invoices(invoice);
        require(!paid&&account.pendingRepayment()==0,"failed payment cannot allocate");
        require(token.balanceOf(customer)==500e18,"failed delivery rolls back funds");
    }
    function testUnfundedPaymentCanRetryAfterTopUp() public {
        account.createInvoice(invoice,"Retry",500e18,uint64(block.timestamp+1 days));
        token.mint(customer,499e18);vm.prank(customer);token.approve(address(account),500e18);
        vm.expectRevert();vm.prank(customer);account.payInvoice(invoice);
        token.mint(customer,1e18);vm.prank(customer);account.payInvoice(invoice);
        require(account.totalCollected()==500e18,"retry collects once");
    }
    function testNoLoanDefersAllocationWithoutLosingOperatingCash() public {
        account.createInvoice(invoice,"Before borrowing",500e18,uint64(block.timestamp+1 days));
        token.mint(customer,500e18);vm.prank(customer);token.approve(address(account),500e18);
        vm.prank(customer);account.payInvoice(invoice);
        (uint256 quote,uint8 reason)=account.repaymentQuote();
        require(quote==0&&reason==3,"no loan is explicit deferred state");
        require(account.availableToWithdraw()==400e18,"operating share remains available");
    }
    function testRepaymentCallerCapAndRepeatedCallsRespectBudget() public {
        prepare(500e18);account.settle(60e18,address(0),address(0));
        require(account.pendingRepayment()==40e18,"caller cap observed");
        account.settle(100e18,address(0),address(0));
        vm.expectRevert();account.settle(100e18,address(0),address(0));
        require(account.totalRepaid()==100e18,"allocation cannot be replayed");
    }
    function testFactoryIsolatesOwnersAndRejectsDuplicateAccounts() public {
        RevenueFactory factory=new RevenueFactory(address(protocol));
        address first=factory.createAccount();vm.prank(customer);address second=factory.createAccount();
        require(first!=second,"separate accounts");
        require(RevenueAccount(payable(second)).owner()==customer,"customer owns their account");
        require(factory.isAccount(first)&&factory.accountOf(customer)==second,"factory registry");
        vm.expectRevert();factory.createAccount();
        vm.expectRevert();vm.prank(customer);RevenueAccount(payable(first)).setPolicy(0,0,true);
    }
    function testCannotWithdrawCollateralHeldByProtocol() public {
        prepare(500e18);vm.expectRevert();account.withdrawBTC(1);
    }
    function testFuzzSplitNeverOverallocates(uint96 amount,uint16 rate) public {
        uint256 n=uint256(amount)+1;uint16 bps=uint16(uint256(rate)%10001);
        account.setPolicy(bps,0,false);account.createInvoice(invoice,"Fuzz",n,uint64(block.timestamp+1 days));
        token.mint(customer,n);vm.prank(customer);token.approve(address(account),n);
        vm.prank(customer);account.payInvoice(invoice);
        require(account.pendingRepayment()==n*bps/10000,"exact integer split");
        require(account.availableToWithdraw()+account.pendingRepayment()==n,"conservation");
    }
    receive() external payable {}
}

contract NativeForkTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function testNativeMezoReceiptRepaysDebt() public {
        if(!vm.envOr("RUN_NATIVE_FORK",false))return;
        // Read-only mainnet source; all writes and artificial funding stay on a local fork.
        vm.createSelectFork("https://mainnet.mezo.public.validationcloud.io",12684025);
        // Anvil/Foundry do not implement Mezo's native oracle precompile. Replay the exact
        // RPC result captured at this block; native lending/token contracts are unchanged.
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("latestRoundData()"),
            abi.encode(uint80(12683929),int256(81804799990000000000000),uint256(1792669455),uint256(1792669455),uint80(0)));
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("decimals()"),abi.encode(uint8(18)));
        RevenueAccount a=new RevenueAccount(address(this),0x44b1bac67dDA612a41a58AAf779143B181dEe031);
        IMusd t=IMusd(0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186);
        vm.deal(address(this),100 ether);
        a.openLoan{value:10 ether}(10000e18,address(0),address(0));
        a.setPolicy(2000,1000e18,false);
        bytes32 id=keccak256("Native fork final payment");
        a.createInvoice(id,"Native fork receipt",500e18,uint64(block.timestamp+1 days));
        a.withdraw(500e18);
        (bool ok,)=address(t).call(abi.encodeWithSignature("approve(address,uint256)",address(a),500e18));require(ok);
        a.payInvoice(id);
        (uint256 beforeDebt,,,,)=a.debtState();
        a.settle(type(uint256).max,address(0),address(0));
        (uint256 afterDebt,,,,)=a.debtState();
        require(beforeDebt-afterDebt==100e18,"real native debt decreases by receipt split");
        require(a.pendingRepayment()==0,"split fully applied");
    }
    receive() external payable {}
}
