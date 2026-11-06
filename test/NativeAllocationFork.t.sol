// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "./RevenueAccount.t.sol";
import "../contracts/RevenueAccountV3.sol";

contract NativeAllocationForkTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function testNativeOversizedReceiptAndClosureNeedNoAllocationCleanup() public {
        if(!vm.envOr("RUN_NATIVE_FORK",false))return;
        vm.createSelectFork("https://mezo-mainnet.boar.network",12684025);
        // Replay only the unavailable native oracle precompile; native lending/token unchanged.
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("latestRoundData()"),
            abi.encode(uint80(12683929),int256(81804799990000000000000),uint256(1792669455),uint256(1792669455),uint80(0)));
        vm.mockCall(0x7b7c000000000000000000000000000000000015,abi.encodeWithSignature("decimals()"),abi.encode(uint8(18)));
        address operations=0x44b1bac67dDA612a41a58AAf779143B181dEe031;
        address treasury=address(0xFEE);
        RevenueAccountV3 funder=new RevenueAccountV3(address(this),operations,treasury);
        RevenueAccountV3 a=new RevenueAccountV3(address(this),operations,treasury);
        IMusd token=a.musd();vm.deal(address(this),100 ether);
        funder.openLoan{value:10 ether}(5000e18,address(0),address(0));funder.withdraw(5000e18);
        a.openLoan{value:10 ether}(2000e18,address(0),address(0));a.withdraw(2000e18);
        a.setPolicy(8000,0,false);a.setServiceEnabled(true);
        (uint256 initialDebt,,,uint256 reserve,)=a.debtState();uint256 payableDebt=initialDebt-reserve;
        bytes32 id=keccak256("Oversized native receipt");a.createInvoice(id,"Final receipt",5000e18,uint64(block.timestamp+1 days));
        (bool ok,bytes memory result)=address(token).call(abi.encodeWithSignature("approve(address,uint256)",address(a),5000e18));
        require(ok&&(result.length==0||abi.decode(result,(bool))),"exact approval");a.payInvoice(id);
        require(a.pendingRepayment()==payableDebt&&payableDebt<4000e18,"allocation capped to native payable debt");
        require(a.retainedReceiptFunds()==5000e18-payableDebt,"excess retained immediately");
        (uint256 quote,)=a.repaymentQuote();require(quote>0&&quote<payableDebt,"native minimum requires owner close");
        a.settle(type(uint256).max,address(0),address(0));uint256 fee=quote/100;
        require(token.balanceOf(treasury)==fee&&a.totalServiceRepaid()==quote,"fee only on actual native repayment");
        a.closeLoan();(uint256 finalDebt,,,,bool active)=a.debtState();
        require(!active&&finalDebt==0&&a.pendingRepayment()==0&&a.feeReserve()==0,"closed with no cleanup");
        uint256 remaining=5000e18-payableDebt-fee;
        require(a.availableToWithdraw()==remaining&&token.balanceOf(address(a))==remaining,"remaining funds available");
        require(address(a).balance==10 ether,"collateral recovered to business");
        a.withdraw(remaining);require(token.balanceOf(address(a))==0,"withdraw without allocation release");
    }
    receive() external payable {}
}
