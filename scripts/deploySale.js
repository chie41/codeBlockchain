const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();

    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy();
    await token.waitForDeployment();

    console.log("✅ Token deployed:", await token.getAddress());

    const TokenSale = await ethers.getContractFactory("TokenSale");
    const price = ethers.parseEther("0.001"); // 1 token = 0.001 ETH
    const sale = await TokenSale.deploy(await token.getAddress(), price);
    await sale.waitForDeployment();

    console.log("✅ TokenSale deployed:", await sale.getAddress());

    // ✅ Approve Sale contract được phép bán token
    const approveTx = await token.approve(await sale.getAddress(), ethers.MaxUint256);
    await approveTx.wait();
    console.log("✅ Approved sale contract to spend tokens");
}

main().catch(console.error);
