// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is Ownable {
    IERC20 public token;
    uint256 public price;    // price per token in wei

    event TokenPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event Withdraw(address indexed owner, uint256 amount);

    constructor(address _token, uint256 _price) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token");
        token = IERC20(_token);
        price = _price;
    }

    function buyToken() external payable {
        require(msg.value > 0, "Send ETH to purchase tokens");

        uint256 amount = (msg.value * 1e18) / price; // convert ETH to token units
        require(token.balanceOf(owner()) >= amount, "Not enough tokens in sale");

        token.transferFrom(owner(), msg.sender, amount);
        emit TokenPurchased(msg.sender, amount, msg.value);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No funds available");

        payable(owner()).transfer(bal);
        emit Withdraw(owner(), bal);
    }

    function setPrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
    }
}
