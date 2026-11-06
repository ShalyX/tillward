// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "./RevenueAccountV3.sol";

// New factory/registry, never an upgrade to existing V1/V2 accounts.
contract RevenueFactoryV3 {
    address public immutable borrowerOperations;
    address public immutable feeTreasury;
    mapping(address=>address) public accountOf;
    mapping(address=>bool) public isAccount;
    event AccountCreated(address indexed owner,address indexed account);
    constructor(address operations,address treasury) {
        require(operations.code.length>0 && treasury!=address(0),"Invalid terms");
        borrowerOperations=operations;feeTreasury=treasury;
    }
    function createAccount() external returns(address account) {
        require(accountOf[msg.sender]==address(0),"Account already exists");
        account=address(new RevenueAccountV3(msg.sender,borrowerOperations,feeTreasury));
        accountOf[msg.sender]=account;isAccount[account]=true;
        emit AccountCreated(msg.sender,account);
    }
}
