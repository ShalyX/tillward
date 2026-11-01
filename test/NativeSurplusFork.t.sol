// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {RevenueAccount} from "../contracts/RevenueAccount.sol";
import {IMusd} from "../contracts/NativeInterfaces.sol";
import {Vm} from "./RevenueAccount.t.sol";

interface ISurplusOperations {
    function troveManager() external view returns(address);
    function sortedTroves() external view returns(address);
    function getBorrowingFee(uint256) external view returns(uint256);
    function MUSD_GAS_COMPENSATION() external view returns(uint256);
}
interface ISurplusManager {
    function collSurplusPool() external view returns(address);
    function getTroveStatus(address) external view returns(uint256);
    function redeemCollateral(uint256,address,address,address,uint256,uint256) external;
}
interface ISurplusPool {function getCollateral(address) external view returns(uint256);}
interface ISurplusSorted {function getLast() external view returns(address);}

// Local fork integration proof only. No broadcast and no public-chain writes.
contract NativeSurplusForkTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant OPERATIONS=0x44b1bac67dDA612a41a58AAf779143B181dEe031;
    uint256 constant PRICE=81804799990000000000000;
    function testNativeRedemptionCreatesSurplusAndOwnerRecoversIt() public {
        if(!vm.envOr("RUN_NATIVE_FORK",false))return;
        vm.createSelectFork("https://mezo-mainnet.boar.network",12684025);
        // Replay the recorded native oracle precompile response, as in the
        // existing fork test. Lending, token and surplus contracts are unmodified.
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("latestRoundData()"),
            abi.encode(uint80(12683929),int256(PRICE),uint256(1792669455),uint256(1792669455),uint80(0)));
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("decimals()"),abi.encode(uint8(18)));
        vm.deal(address(this),100 ether);
        ISurplusOperations operations=ISurplusOperations(OPERATIONS);
        ISurplusManager manager=ISurplusManager(operations.troveManager());
        ISurplusPool pool=ISurplusPool(manager.collSurplusPool());
        RevenueAccount funding=new RevenueAccount(address(this),OPERATIONS);
        funding.openLoan{value:10 ether}(10000e18,address(0),address(0));
        funding.withdraw(10e18);
        RevenueAccount business=new RevenueAccount(address(this),OPERATIONS);
        uint256 composite=2000e18+operations.getBorrowingFee(2000e18)+operations.MUSD_GAS_COMPENSATION();
        uint256 collateral=(composite*1101000000000000000+PRICE-1)/PRICE;
        business.openLoan{value:collateral}(2000e18,address(0),address(0));
        business.withdraw(2000e18);
        require(ISurplusSorted(operations.sortedTroves()).getLast()==address(business),"fixture must redeem only its own lowest-ratio account");
        require(pool.getCollateral(address(business))==0,"no initial entitlement");
        (uint256 debt,,,uint256 reserve,)=business.debtState();
        uint256 redemption=debt-reserve;
        require(IMusd(address(business.musd())).balanceOf(address(this))>=redemption,"self-funded redemption");
        manager.redeemCollateral(redemption,address(business),address(0),address(0),0,1);
        require(manager.getTroveStatus(address(business))==4,"native redemption closed this account");
        uint256 entitlement=pool.getCollateral(address(business));
        require(entitlement>0&&entitlement<collateral,"actual native surplus recorded");
        require(address(business).balance==0,"redemption has not claimed surplus");
        business.claimSurplus();
        require(pool.getCollateral(address(business))==0,"entitlement consumed");
        require(address(business).balance==entitlement,"exact native surplus received by business");
        uint256 ownerBefore=address(this).balance;
        business.withdrawBTC(entitlement);
        require(address(business).balance==0&&address(this).balance==ownerBefore+entitlement,"separate owner withdrawal");
        vm.expectRevert();business.claimSurplus();
    }
    receive() external payable {}
}
