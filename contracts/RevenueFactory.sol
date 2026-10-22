// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "./RevenueAccount.sol";

contract RevenueFactory {
    address public immutable borrowerOperations;
    mapping(address=>address) public accountOf;
    mapping(address=>bool) public isAccount;
    event AccountCreated(address indexed owner,address indexed account);
    constructor(address operations) {
        require(operations.code.length>0,"Protocol unavailable");
        borrowerOperations=operations;
    }
    function createAccount() external returns(address account) {
        require(accountOf[msg.sender]==address(0),"Account already exists");
        account=address(new RevenueAccount(msg.sender,borrowerOperations));
        accountOf[msg.sender]=account;
        isAccount[account]=true;
        emit AccountCreated(msg.sender,account);
    }
}
