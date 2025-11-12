const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("🚀 Deploying contracts with account:", deployer.address);
    console.log("💰 Balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // =====================================================
    // 1️⃣ Deploy NFT Marketplace
    // =====================================================
    const feeRecipient = deployer.address;
    const feeBps = 250; // 2.5% phí
    const Market = await ethers.getContractFactory("NftMarketplace");
    const market = await Market.deploy(feeRecipient, feeBps);
    await market.waitForDeployment();
    const marketAddr = await market.getAddress();
    console.log("✅ Marketplace deployed at:", marketAddr);

    // =====================================================
    // 2️⃣ Deploy NFT Collection
    // =====================================================
    const NFT = await ethers.getContractFactory("MyNFT");
    const nft = await NFT.deploy("MyNFT", "MNFT");
    await nft.waitForDeployment();
    const nftAddr = await nft.getAddress();
    console.log("✅ NFT deployed at:", nftAddr);

    // =====================================================
    // 3️⃣ Mint NFT test cho deployer
    // =====================================================
    const mintTx = await nft.mint(deployer.address);
    await mintTx.wait();
    console.log("🎨 Minted NFT #1 for", deployer.address);

    // =====================================================
    // 4️⃣ Approve marketplace quản lý NFT
    // =====================================================
    const approveTx = await nft.setApprovalForAll(marketAddr, true);
    await approveTx.wait();
    console.log("🔓 Approved marketplace to manage NFTs");

    // =====================================================
    // 5️⃣ (Tuỳ chọn) List NFT #1 luôn
    // =====================================================
    const price = ethers.parseEther("1"); // 1 ETH
    const listTx = await market.list(nftAddr, 1, price, ethers.ZeroAddress);
    await listTx.wait();
    console.log("📦 Listed NFT #1 for sale at 1 ETH");

    // =====================================================
    // 6️⃣ Ghi thông tin ra file deployed.json
    // =====================================================
    const data = {
        marketplace: marketAddr,
        nft: nftAddr,
        owner: deployer.address,
        network: "localhost",
        listed: [{ tokenId: 1, price: price.toString() }],
        updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync("deployed.json", JSON.stringify(data, null, 2));

    console.log("📝 Saved deployed.json");
    console.log("✅ All steps done successfully!");
}

main().catch((e) => {
    console.error("❌ Deploy failed:", e);
    process.exit(1);
});
//npx hardhat run scripts/deploy.js --network localhost
//npx hardhat console --network localhost
