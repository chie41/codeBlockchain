const { ethers } = require("hardhat");

// Địa chỉ các ví và contract
const Acc0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // ví nhận (account #0)
const Acc1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // ví đang giữ NFT
const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // địa chỉ contract NFT
const TOKEN_ID = 1;

async function main() {
    // Lấy danh sách signer từ mạng localhost (hardhat node)
    const [acc0, acc1] = await ethers.getSigners();

    // Kết nối tới contract NFT
    const nft = await ethers.getContractAt("MyIPFSNFT", CONTRACT);

    console.log("👀 Owner trước khi gửi:", await nft.ownerOf(TOKEN_ID));

    // ✅ Dùng acc1 (vì acc1 đang sở hữu NFT) để ký giao dịch chuyển
    const tx = await nft.connect(acc1).safeTransferFrom(acc1.address, Acc0, TOKEN_ID);
    await tx.wait();

    console.log("✅ Giao dịch hoàn tất!");
    console.log("👑 Owner sau khi gửi:", await nft.ownerOf(TOKEN_ID));
}

// Chạy script
main().catch(console.error);
