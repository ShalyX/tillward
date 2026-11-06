// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IOwnedSurplusAccount {
    function owner() external view returns(address);
    function borrowerOperations() external view returns(address);
    function musd() external view returns(address);
}
interface IOwnedSurplusFactory {
    function isAccount(address) external view returns(bool);
    function borrowerOperations() external view returns(address);
}
interface IOwnedSurplusNative {
    function troveManager() external view returns(address);
    function sortedTroves() external view returns(address);
    function priceFeed() external view returns(address);
    function collSurplusPool() external view returns(address);
    function musd() external view returns(address);
    function MCR() external view returns(uint256);
    function MUSD_GAS_COMPENSATION() external view returns(uint256);
    function fetchPrice() external view returns(uint256);
    function getTroveStatus(address) external view returns(uint256);
    function getEntireDebtAndColl(address) external view returns(uint256,uint256,uint256,uint256,uint256,uint256);
    function getCurrentICR(address,uint256) external view returns(uint256);
    function contains(address) external view returns(bool);
    function getNext(address) external view returns(address);
    function getCollateral(address) external view returns(uint256);
    function redeemCollateral(uint256,address,address,address,uint256,uint256) external;
}
interface IOwnedSurplusToken {
    function balanceOf(address) external view returns(uint256);
    function transfer(address,uint256) external returns(bool);
}

// Public-testnet QA fixture only. Not deployed by the Tillward factory.
// A valid first hint + one iteration + atomic own-account postconditions prevent
// a sorted-list race from redeeming an unrelated borrower.
contract OwnedSurplusGuard {
    address public immutable owner;
    address public immutable business;
    IOwnedSurplusNative public immutable manager;
    IOwnedSurplusNative public immutable sorted;
    IOwnedSurplusNative public immutable pool;
    IOwnedSurplusNative public immutable feed;
    IOwnedSurplusToken public immutable token;
    uint256 public immutable reserve;
    uint256 public constant MAX_REDEMPTION=2100e18;
    uint256 private entered=1;
    event OwnBorrowerRedeemed(address indexed business,uint256 amount,uint256 surplus);
    event FundsRecovered(uint256 musd,uint256 btc);
    modifier onlyOwner(){require(msg.sender==owner,"Owner only");_;}
    modifier guarded(){require(entered==1,"Reentrancy");entered=2;_;entered=1;}
    constructor(address factory,address account) {
        require(block.chainid==31611,"Public testnet only");
        IOwnedSurplusAccount a=IOwnedSurplusAccount(account);
        require(IOwnedSurplusFactory(factory).isAccount(account)&&a.owner()==msg.sender,"Registered own account only");
        address operations=a.borrowerOperations();
        require(IOwnedSurplusFactory(factory).borrowerOperations()==operations,"Operations mismatch");
        IOwnedSurplusNative native=IOwnedSurplusNative(operations);
        require(native.musd()==a.musd(),"Token mismatch");
        owner=msg.sender;business=account;token=IOwnedSurplusToken(a.musd());
        manager=IOwnedSurplusNative(native.troveManager());
        sorted=IOwnedSurplusNative(native.sortedTroves());
        pool=IOwnedSurplusNative(manager.collSurplusPool());
        feed=IOwnedSurplusNative(manager.priceFeed());reserve=native.MUSD_GAS_COMPENSATION();
    }
    function redeem(uint256 deadline) external onlyOwner guarded {
        require(block.chainid==31611&&block.timestamp<=deadline&&deadline<=block.timestamp+180,"Fresh testnet request required");
        require(manager.getTroveStatus(business)==1&&sorted.contains(business),"Own loan must be active");
        uint256 price=feed.fetchPrice();uint256 mcr=manager.MCR();
        require(price>0&&manager.getCurrentICR(business,price)>=mcr,"Own loan below MCR");
        address next=sorted.getNext(business);
        require(next==address(0)||manager.getCurrentICR(next,price)<mcr,"Own loan not first eligible");
        require(pool.getCollateral(business)==0,"Existing entitlement");
        (,uint256 principal,uint256 interest,,,)=manager.getEntireDebtAndColl(business);
        uint256 amount=principal+interest-reserve;
        uint256 beforeBalance=token.balanceOf(address(this));
        require(amount>0&&amount<=MAX_REDEMPTION&&beforeBalance>=amount,"Redemption funding/bounds");
        manager.redeemCollateral(amount,business,address(0),address(0),0,1);
        uint256 surplus=pool.getCollateral(business);
        require(manager.getTroveStatus(business)==4&&surplus>0&&beforeBalance-token.balanceOf(address(this))==amount,"Own full redemption not proven");
        emit OwnBorrowerRedeemed(business,amount,surplus);
    }
    function recoverFunds() external onlyOwner guarded {
        uint256 musd=token.balanceOf(address(this));uint256 btc=address(this).balance;
        if(musd>0)require(token.transfer(owner,musd),"Token recovery failed");
        if(btc>0){(bool ok,)=payable(owner).call{value:btc}("");require(ok,"BTC recovery failed");}
        emit FundsRecovered(musd,btc);
    }
    receive() external payable {}
}
