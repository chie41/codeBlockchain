const { ethers } = require("hardhat");

// Địa chỉ contract NFT đã deploy
const CONTRACT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Dùng link HTTPS Pinata (gateway) thay vì ipfs://
const TOKEN_URI = "https://azure-tragic-badger-533.mypinata.cloud/ipfs/bafkreicjunphu6cbngqw4dbknf2szx66wleofvuqcp7wlyye2mp2dtvvia";

async function main() {
    const [owner] = await ethers.getSigners();
    const nft = await ethers.getContractAt("MyIPFSNFT", CONTRACT);

    const tx = await nft.mintTo(owner.address, TOKEN_URI);
    await tx.wait();

    console.log("✅ Minted NFT mới cho:", owner.address);
    console.log("📄 Metadata URI:", TOKEN_URI);
}

main().catch(console.error);
