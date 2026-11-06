// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {RevenueAccount} from "../contracts/RevenueAccount.sol";
import {RevenueAccountV2} from "../contracts/RevenueAccountV2.sol";
import {RevenueFactoryV2} from "../contracts/RevenueFactoryV2.sol";
import {OwnedSurplusGuard} from "../contracts/qa/OwnedSurplusGuard.sol";
import {IMusd} from "../contracts/NativeInterfaces.sol";
import {Vm} from "./RevenueAccount.t.sol";
import {ISurplusOperations,ISurplusManager,ISurplusPool,ISurplusSorted} from "./NativeSurplusFork.t.sol";
interface GuardForkVm is Vm {function chainId(uint256) external;}
contract NativeGuardSurplusForkTest {
    GuardForkVm constant vm=GuardForkVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant OPERATIONS=0x44b1bac67dDA612a41a58AAf779143B181dEe031;
    uint256 constant PRICE=81804799990000000000000;
    function testGuardRedemptionThenV2ClaimAndRecovery() public {
        if(!vm.envOr("RUN_NATIVE_FORK",false))return;
        vm.createSelectFork("https://mezo-mainnet.boar.network",12684025);
        // Local fixture only: replay missing oracle precompile and use the guard's
        // required testnet chain ID. Native lending/token/pool contracts stay real.
        vm.chainId(31611);
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("latestRoundData()"),abi.encode(uint80(12683929),int256(PRICE),uint256(1792669455),uint256(1792669455),uint80(0)));
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("decimals()"),abi.encode(uint8(18)));
        vm.deal(address(this),100 ether);
        RevenueAccount funding=new RevenueAccount(address(this),OPERATIONS);
        funding.openLoan{value:10 ether}(10000e18,address(0),address(0));funding.withdraw(10e18);
        RevenueFactoryV2 factory=new RevenueFactoryV2(OPERATIONS,address(0xFEE));
        RevenueAccountV2 business=RevenueAccountV2(payable(factory.createAccount()));
        OwnedSurplusGuard guard=new OwnedSurplusGuard(address(factory),address(business));
        ISurplusOperations operations=ISurplusOperations(OPERATIONS);
        uint256 composite=2000e18+operations.getBorrowingFee(2000e18)+operations.MUSD_GAS_COMPENSATION();
        uint256 collateral=(composite*1101000000000000000+PRICE-1)/PRICE;
        business.openLoan{value:collateral}(2000e18,address(0),address(0));business.withdraw(2000e18);
        require(ISurplusSorted(operations.sortedTroves()).getLast()==address(business),"Only own borrower first");
        IMusd token=IMusd(address(business.musd()));require(token.transfer(address(guard),2005e18),"Fund guard");
        vm.warp(block.timestamp+60);guard.redeem(block.timestamp+60);
        ISurplusManager manager=ISurplusManager(operations.troveManager());ISurplusPool pool=ISurplusPool(manager.collSurplusPool());
        uint256 entitlement=pool.getCollateral(address(business));
        require(entitlement>0&&manager.getTroveStatus(address(business))==4,"Native redemption and entitlement");
        business.claimSurplus();require(pool.getCollateral(address(business))==0&&address(business).balance==entitlement,"Exact native claim");
        business.withdrawBTC(entitlement);guard.recoverFunds();
        require(address(business).balance==0&&address(guard).balance==0&&token.balanceOf(address(guard))==0,"No stranded test funds");
        require(business.totalFeesPaid()==0,"No service fee on surplus recovery");
        vm.expectRevert();business.claimSurplus();
    }
    receive() external payable {}
}
