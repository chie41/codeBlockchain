const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // 1️⃣ Deploy NFT
    const NFT = await ethers.getContractFactory("MyNFT");
    const nft = await NFT.deploy("MyNFT", "MNFT");
    await nft.waitForDeployment();
    const nftAddr = await nft.getAddress();
    console.log("✅ NFT deployed at:", nftAddr);

    // 2️⃣ Deploy Marketplace
    const feeRecipient = deployer.address;
    const feeBps = 250; // 2.5%
    const Market = await ethers.getContractFactory("NftMarketplace");
    const market = await Market.deploy(feeRecipient, feeBps);
    await market.waitForDeployment();
    const marketAddr = await market.getAddress();
    console.log("✅ Marketplace deployed at:", marketAddr);

    // 3️⃣ Ghi vào deployed.json
    const data = {
        marketplace: marketAddr,
        nft: nftAddr,
        owner: deployer.address,
        network: "localhost",
        updatedAt: new Date().toISOString()
    };
    fs.writeFileSync("deployed.json", JSON.stringify(data, null, 2));
    console.log("📝 Saved deployed.json");
}

main().catch(console.error);
