const { ethers } = require("hardhat");

const TOKEN_ID = 1;

const fs = require("fs");
const { marketplace: MARKET_ADDR, nft: NFT_ADDR } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));


async function main() {
        
    const [, buyer] = await ethers.getSigners(); // lấy account #2 làm buyer
    const market = await ethers.getContractAt("NftMarketplace", MARKET_ADDR, buyer);

    // Lấy giá niêm yết để gửi đúng value
    const L = await market.getListing(NFT_ADDR, TOKEN_ID);
    if (L.payToken !== ethers.ZeroAddress) {
        throw new Error("Listing không nhận ETH");
    }

    const tx = await market.buyWithETH(NFT_ADDR, TOKEN_ID, { value: L.price });
    await tx.wait();

    console.log("Bought with ETH!");
}

main().catch(console.error);
