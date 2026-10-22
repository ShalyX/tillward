// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// Minimal interfaces matching mezo-org/musd at 490ed984ba24ba6297986e8de1271abad4e8abe5.
interface IMusd {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

interface IBorrowerOperations {
    function musd() external view returns (address);
    function troveManager() external view returns (address);
    function minNetDebt() external view returns (uint256);
    function MUSD_GAS_COMPENSATION() external view returns (uint256);
    function openTrove(uint256, address, address) external payable;
    function repayMUSD(uint256, address, address) external;
    function closeTrove() external;
    function addColl(address, address) external payable;
    function claimCollateral() external;
}

interface ITroveManager {
    function getTroveStatus(address) external view returns (uint256);
    // First three values already INCLUDE pending redistributions. Do not add the last three twice.
    function getEntireDebtAndColl(address) external view returns (
        uint256 collateral, uint256 principal, uint256 interest,
        uint256 pendingCollateral, uint256 pendingPrincipal, uint256 pendingInterest
    );
}
