// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "./RevenueAccount.t.sol";
import "../contracts/RevenueAccountV2.sol";

contract NativeFeeForkTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    event SettlementGas(uint256 gasUsed);
    function testNativeAtomicFeePreservesRepaymentAndMayCrossFloor() public {
        if(!vm.envOr("RUN_NATIVE_FORK",false))return;
        vm.createSelectFork("https://mezo-mainnet.boar.network",12684025);
        // Only the unavailable Mezo oracle precompile is replayed. Lending/token unchanged.
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("latestRoundData()"),
            abi.encode(uint80(12683929),int256(81804799990000000000000),uint256(1792669455),uint256(1792669455),uint80(0)));
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("decimals()"),abi.encode(uint8(18)));
        address treasury=address(0xFEE);
        RevenueAccountV2 a=new RevenueAccountV2(address(this),0x44b1bac67dDA612a41a58AAf779143B181dEe031,treasury);
        IMusd t=a.musd();vm.deal(address(this),100 ether);
        a.openLoan{value:10 ether}(5000e18,address(0),address(0));a.withdraw(5000e18);
        a.setPolicy(9900,5e18,false);a.setServiceEnabled(true);
        bytes32 id=keccak256("Native V2 fee receipt");a.createInvoice(id,"V2 native receipt",500e18,uint64(block.timestamp+1 days));
        (bool ok,bytes memory result)=address(t).call(abi.encodeWithSignature("approve(address,uint256)",address(a),500e18));
        require(ok&&(result.length==0||abi.decode(result,(bool))),"exact approval");a.payInvoice(id);
        (uint256 beforeDebt,,,,)=a.debtState();uint256 beforeTreasury=t.balanceOf(treasury);
        uint256 startGas=gasleft();a.settle(type(uint256).max,address(0),address(0));emit SettlementGas(startGas-gasleft());
        (uint256 afterDebt,,,,)=a.debtState();
        require(beforeDebt-afterDebt==495e18,"native repayment intact");
        require(t.balanceOf(treasury)-beforeTreasury==4.95e18,"native exact fee");
        require(t.balanceOf(address(a))==0.05e18&&a.cashFloor()==5e18,"fee below repayment floor");
        require(a.pendingRepayment()==0&&a.feeReserve()==0,"no pending debt or fee reservation");
        require(a.totalFeesPaid()==4.95e18&&a.totalServiceRepaid()==495e18,"native counters");
        vm.expectRevert();a.settle(495e18,address(0),address(0));
    }
    receive() external payable {}
}
