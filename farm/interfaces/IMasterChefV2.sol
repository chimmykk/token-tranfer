// SPDX-License-Identifier: GPLv3
pragma solidity ^0.8.20;

interface IMasterChefV2 {
    function BBC() external view returns (address);

    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function pendingBBC(
        uint256 _pid,
        address _user
    ) external view returns (uint256);

    function userInfo(
        uint256 _pid,
        address _user
    ) external view returns (uint256, uint256, uint256);

    function emergencyWithdraw(uint256 _pid) external;

    function lpToken(uint256 _pid) external view returns (address);

    function poolLength() external view returns (uint256 pools);

    function getBoostMultiplier(
        address _user,
        uint256 _pid
    ) external view returns (uint256);

    function updateBoostMultiplier(
        address _user,
        uint256 _pid,
        uint256 _newMultiplier
    ) external;
} 