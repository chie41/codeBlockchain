const { ethers } = require("hardhat");

async function main() {
    const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const AMOUNT = "1000";

    const token = await ethers.getContractAt("MyToken", TOKEN_ADDRESS);
    const accounts = await ethers.getSigners();

    const owner = accounts[0];      // ví có token
    const spender = accounts[1];    // ví được approve
    const receiver = accounts[2];   // ví nhận

    console.log("📌 Owner:", owner.address);
    console.log("📌 Spender:", spender.address);
    console.log("📌 Receiver:", receiver.address);

    console.log("⏳ Calling transferFrom...");
    const tx = await token.connect(spender).transferFrom(
        owner.address,
        receiver.address,
        ethers.parseUnits(AMOUNT, 18)
    );
    await tx.wait();

    console.log("✅ transferFrom success!");
    console.log("Tx Hash:", tx.hash);

    const balOwner = await token.balanceOf(owner.address);
    const balReceiver = await token.balanceOf(receiver.address);

    console.log("💰 Owner Balance:", ethers.formatUnits(balOwner, 18));
    console.log("💰 Receiver Balance:", ethers.formatUnits(balReceiver, 18));
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
