const { ethers } = require("hardhat");

const TOKEN_ID = 1;
const { marketplace: MARKET_ADDR, nft: NFT_ADDR } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));

async function main() {
    const [seller] = await ethers.getSigners();
    const market = await ethers.getContractAt("NftMarketplace", MARKET_ADDR, seller);

    const tx = await market.cancel(NFT_ADDR, TOKEN_ID);
    await tx.wait();

    console.log("Cancelled");
}

main().catch(console.error);
