const { ethers } = require("hardhat");

const { marketplace: MARKET_ADDR, nft: NFT_ADDR } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
const TOKEN_ID = 1; // NFT muốn list
const PRICE = ethers.parseEther("0.1"); // nếu payToken = 0 (ETH), đơn vị là wei
const PAY_TOKEN = "0x0000000000000000000000000000000000000000"; // ETH; ERC20 thì thay địa chỉ

async function main() {
    const [seller] = await ethers.getSigners();
    const market = await ethers.getContractAt("NftMarketplace", MARKET_ADDR, seller);

    // approve marketplace nắm giữ NFT trước khi list
    const nft = await ethers.getContractAt("IERC721", NFT_ADDR, seller);
    // Nếu dùng chuẩn OZ, có hàm approve(tokenId)
    const tx1 = await nft.approve(MARKET_ADDR, TOKEN_ID);
    await tx1.wait();

    const tx2 = await market.list(NFT_ADDR, TOKEN_ID, PRICE, PAY_TOKEN);
    await tx2.wait();

    console.log("Listed:", await market.getListing(NFT_ADDR, TOKEN_ID));
}

main().catch(console.error);
