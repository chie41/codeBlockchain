const { ethers } = require("hardhat");

async function main() {
    const AMOUNT = "1000"; // amount to transfer via transferFrom

    const accounts = await ethers.getSigners();
    const owner = accounts[0];      // holder of tokens
    const spender = accounts[1];    // address that will be approved
    const receiver = accounts[2];   // recipient

    console.log("📌 Owner:", owner.address);
    console.log("📌 Spender:", spender.address);
    console.log("📌 Receiver:", receiver.address);

    // Deploy a fresh token so script is self-contained
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ Deployed MyToken to:", tokenAddress);

    // Show initial balances
    const balOwnerBefore = await token.balanceOf(owner.address);
    console.log("💰 Owner balance before:", ethers.formatUnits(balOwnerBefore, 18));

    // Owner approves spender for AMOUNT
    const amountParsed = ethers.parseUnits(AMOUNT, 18);
    console.log(`⏳ Owner approving spender for ${AMOUNT} tokens...`);
    const approveTx = await token.connect(owner).approve(spender.address, amountParsed);
    await approveTx.wait();
    console.log("✅ Approve tx hash:", approveTx.hash);

    const allowance = await token.allowance(owner.address, spender.address);
    console.log("🔐 Allowance (owner -> spender):", ethers.formatUnits(allowance, 18));

    // Spender calls transferFrom
    console.log("⏳ Spender calling transferFrom to move tokens to receiver...");
    const tx = await token.connect(spender).transferFrom(owner.address, receiver.address, amountParsed);
    await tx.wait();
    console.log("✅ transferFrom success! Tx hash:", tx.hash);

    // Balances after
    const balOwnerAfter = await token.balanceOf(owner.address);
    const balReceiverAfter = await token.balanceOf(receiver.address);
    const allowanceAfter = await token.allowance(owner.address, spender.address);

    console.log("💰 Owner balance after:", ethers.formatUnits(balOwnerAfter, 18));
    console.log("💰 Receiver balance after:", ethers.formatUnits(balReceiverAfter, 18));
    console.log("🔐 Allowance remaining:", ethers.formatUnits(allowanceAfter, 18));
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
