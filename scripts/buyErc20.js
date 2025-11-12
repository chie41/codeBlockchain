const { ethers } = require("hardhat");

const TOKEN_ID = 2;
const { marketplace: MARKET_ADDR, nft: NFT_ADDR } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));

async function main() {
    const [, buyer] = await ethers.getSigners();
    const market = await ethers.getContractAt("NftMarketplace", MARKET_ADDR, buyer);

    const L = await market.getListing(NFT_ADDR, TOKEN_ID);
    if (L.payToken === ethers.ZeroAddress) {
        throw new Error("Listing nhận ETH, không phải ERC20");
    }

    const payToken = await ethers.getContractAt("IERC20", L.payToken, buyer);

    // Buyer approve marketplace chi tiêu trước
    const tx1 = await payToken.approve(MARKET_ADDR, L.price);
    await tx1.wait();

    const tx2 = await market.buyWithERC20(NFT_ADDR, TOKEN_ID);
    await tx2.wait();

    console.log("Bought with ERC20!");
}

main().catch(console.error);
