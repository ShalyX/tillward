// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {OwnedSurplusGuard} from "../contracts/qa/OwnedSurplusGuard.sol";
import {TokenMock,Vm} from "./RevenueAccount.t.sol";
interface GuardVm is Vm {function chainId(uint256) external;}

contract SurplusGuardNativeMock {
    TokenMock public musd;
    address public borrowerOperations=address(this);
    address public troveManager=address(this);
    address public sortedTroves=address(this);
    address public collSurplusPool=address(this);
    address public priceFeed=address(this);
    uint256 public constant MCR=110e16;
    uint256 public constant MUSD_GAS_COMPENSATION=200e18;
    mapping(address=>uint256) public getTroveStatus;
    mapping(address=>uint256) public getCollateral;
    address public next;
    bool public lie;
    uint256 public calls;
    uint256 public icr=111e16;
    uint256 public compositeDebt=2202e18;
    constructor(TokenMock token){musd=token;}
    function initialize(address business) external {getTroveStatus[business]=1;}
    function setNext(address n) external {next=n;}
    function setLie(bool b) external {lie=b;}
    function setICR(uint256 n) external {icr=n;}
    function setDebt(uint256 n) external {compositeDebt=n;}
    function fetchPrice() external pure returns(uint256){return 80000e18;}
    function getCurrentICR(address,uint256) external view returns(uint256){return icr;}
    function contains(address business) external view returns(bool){return getTroveStatus[business]==1;}
    function getNext(address) external view returns(address){return next;}
    function getEntireDebtAndColl(address) external view returns(uint256,uint256,uint256,uint256,uint256,uint256){return (3e16,compositeDebt,0,0,0,0);}
    function redeemCollateral(uint256 amount,address business,address,address,uint256,uint256 iterations) external {
        require(iterations==1&&amount==2002e18,"Native bounds");calls++;
        musd.burn(msg.sender,amount);
        if(!lie){getTroveStatus[business]=4;getCollateral[business]=1e15;}
    }
}
contract SurplusGuardBusinessMock {
    address public owner;
    address public borrowerOperations;
    address public musd;
    constructor(address o,SurplusGuardNativeMock p){owner=o;borrowerOperations=address(p);musd=address(p.musd());}
}
contract SurplusGuardFactoryMock {
    mapping(address=>bool) public isAccount;
    address public borrowerOperations;
    constructor(address p){borrowerOperations=p;}
    function register(address a) external {isAccount[a]=true;}
}
contract OwnedSurplusGuardTest {
    GuardVm constant vm=GuardVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    TokenMock token;SurplusGuardNativeMock native;SurplusGuardBusinessMock business;SurplusGuardFactoryMock factory;OwnedSurplusGuard guard;
    function setUp() public {
        vm.chainId(31611);token=new TokenMock();native=new SurplusGuardNativeMock(token);
        factory=new SurplusGuardFactoryMock(address(native));business=new SurplusGuardBusinessMock(address(this),native);
        factory.register(address(business));native.initialize(address(business));
        guard=new OwnedSurplusGuard(address(factory),address(business));token.mint(address(guard),2005e18);
    }
    function testRedeemsOnlyOwnedEligibleBorrower() public {
        guard.redeem(block.timestamp+60);
        require(native.getTroveStatus(address(business))==4&&native.getCollateral(address(business))==1e15,"Actual own surplus required");
        require(native.calls()==1&&token.balanceOf(address(guard))==3e18,"Exact redemption amount");
    }
    function testChangedFirstEligibleBorrowerAbortsBeforeNativeCall() public {
        native.setNext(address(0xBAD));vm.expectRevert();guard.redeem(block.timestamp+60);
        require(native.calls()==0&&native.getTroveStatus(address(business))==1,"No native mutation");
    }
    function testUnexpectedNativeResultRollsBackAllEffects() public {
        native.setLie(true);vm.expectRevert();guard.redeem(block.timestamp+60);
        require(native.calls()==0&&token.balanceOf(address(guard))==2005e18,"Atomic rollback");
    }
    function testUnauthorizedCannotRedeemOrRecover() public {
        vm.prank(address(0xBAD));vm.expectRevert();guard.redeem(block.timestamp+60);
        vm.prank(address(0xBAD));vm.expectRevert();guard.recoverFunds();require(native.calls()==0,"No calls");
    }
    function testInsufficientFundingDoesNotTouchNativeLoan() public {
        token.burn(address(guard),4e18);vm.expectRevert();guard.redeem(block.timestamp+60);require(native.calls()==0,"No calls");
    }
    function testExpiredRequestDoesNotTouchNativeLoan() public {
        vm.warp(block.timestamp+100);vm.expectRevert();guard.redeem(block.timestamp-1);require(native.calls()==0,"No calls");
    }
    function testBelowMCRDoesNotTouchAnyBorrower() public {native.setICR(109e16);vm.expectRevert();guard.redeem(block.timestamp+60);require(native.calls()==0,"No calls");}
    function testRedemptionCapDoesNotTouchAnyBorrower() public {native.setDebt(2301e18);vm.expectRevert();guard.redeem(block.timestamp+60);require(native.calls()==0,"No calls");}
    function testFarFutureDeadlineRejected() public {vm.expectRevert();guard.redeem(block.timestamp+181);require(native.calls()==0,"No calls");}
    function testDuplicateRedemptionCannotTouchAnotherBorrower() public {
        guard.redeem(block.timestamp+60);vm.expectRevert();guard.redeem(block.timestamp+60);require(native.calls()==1,"No duplicate");
    }
    function testOwnerCanRecoverUnusedFunds() public {
        guard.recoverFunds();require(token.balanceOf(address(this))==2005e18&&token.balanceOf(address(guard))==0,"Owner recovery");
    }
    function testWrongChainDeploymentFails() public {vm.chainId(1);vm.expectRevert();new OwnedSurplusGuard(address(factory),address(business));}
    function testUnregisteredOrUnownedBusinessFails() public {
        SurplusGuardBusinessMock unregistered=new SurplusGuardBusinessMock(address(this),native);
        vm.expectRevert();new OwnedSurplusGuard(address(factory),address(unregistered));
        SurplusGuardBusinessMock other=new SurplusGuardBusinessMock(address(0xBAD),native);factory.register(address(other));
        vm.expectRevert();new OwnedSurplusGuard(address(factory),address(other));
    }
    receive() external payable {}
}
