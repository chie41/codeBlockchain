const { ethers } = require("hardhat");

const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // địa chỉ contract ở trên
const TOKEN_URI = "https://azure-tragic-badger-533.mypinata.cloud/ipfs/bafybeig2a2xocpr3huzuyzovotylrtqytf5xdsqukuo677drgs63aa656i/metadata.json";

async function main() {
    const [owner] = await ethers.getSigners();
    const nft = await ethers.getContractAt("MyIPFSNFT", CONTRACT);

    const tx = await nft.mintTo(owner.address, TOKEN_URI);
    await tx.wait();

    console.log("✅ Minted NFT cho:", owner.address);
    console.log("Metadata URI:", TOKEN_URI);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
