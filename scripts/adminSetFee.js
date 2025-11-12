const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    // 🔹 Đọc địa chỉ từ file deployed.json
    const { marketplace } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));

    const [owner, someone] = await ethers.getSigners();
    const market = await ethers.getContractAt("NftMarketplace", marketplace, owner);

    console.log("Using MARKET_ADDR:", marketplace);

    const tx1 = await market.setFeeBps(300); // 3%
    await tx1.wait();

    const tx2 = await market.setFeeRecipient(someone.address);
    await tx2.wait();

    console.log("✅ New feeBps:", Number(await market.feeBps()));
    console.log("✅ New feeRecipient:", await market.feeRecipient());
}

main().catch(console.error);
