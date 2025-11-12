// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function getApproved(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

/// @title Minimal NFT Marketplace (ETH or ERC20 payments)
contract NftMarketplace is IERC721Receiver {
    error NotOwner();
    error NotSeller();
    error NotListed();
    error AlreadyListed();
    error WrongPaymentToken();
    error InvalidPrice();
    error TransferFailed();

    event Listed(address indexed nft, uint256 indexed tokenId, address indexed seller, uint256 price, address payToken);
    event Cancelled(address indexed nft, uint256 indexed tokenId, address indexed seller);
    event Purchased(address indexed nft, uint256 indexed tokenId, address indexed buyer, uint256 price, address payToken, uint256 fee);

    struct Listing {
        address seller;
        uint256 price;      // in smallest unit of payToken (wei for ETH)
        address payToken;   // address(0) for ETH; ERC20 address otherwise
    }

    address public owner;
    address public feeRecipient;
    uint96  public feeBps; // fee in basis points (e.g. 250 = 2.5%)

    // nft => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _feeRecipient, uint96 _feeBps) {
        owner = msg.sender;
        feeRecipient = _feeRecipient == address(0) ? msg.sender : _feeRecipient;
        feeBps = _feeBps; // e.g. 250 = 2.5%
    }

    // --- Admin: cập nhật phí & nơi nhận phí ---
    function setFeeBps(uint96 _feeBps) external onlyOwner {
        require(_feeBps <= 2000, "fee too high"); // <=20% (tuỳ bạn)
        feeBps = _feeBps;
    }

    function setFeeRecipient(address _to) external onlyOwner {
        require(_to != address(0), "zero addr");
        feeRecipient = _to;
    }

    function transferOwnership(address _new) external onlyOwner {
        require(_new != address(0), "zero addr");
        owner = _new;
    }

    // --- List NFT ---
    function list(address nft, uint256 tokenId, uint256 price, address payToken) external {
        if (price == 0) revert InvalidPrice();
        Listing storage L = listings[nft][tokenId];
        if (L.seller != address(0)) revert AlreadyListed();

        // Yêu cầu người list phải là owner hiện tại
        if (IERC721(nft).ownerOf(tokenId) != msg.sender) revert NotOwner();

        // Người bán phải approve marketplace trước (approve tokenId hoặc setApprovalForAll)
        bool approved = (IERC721(nft).getApproved(tokenId) == address(this)) ||
                        IERC721(nft).isApprovedForAll(msg.sender, address(this));
        require(approved, "NFT not approved");

        // Chuyển NFT vào escrow (Marketplace sẽ giữ NFT)
        IERC721(nft).safeTransferFrom(msg.sender, address(this), tokenId);

        listings[nft][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            payToken: payToken // address(0) => ETH; else -> ERC20
        });

        emit Listed(nft, tokenId, msg.sender, price, payToken);
    }

    // --- Hủy listing ---
    function cancel(address nft, uint256 tokenId) external {
        Listing memory L = listings[nft][tokenId];
        if (L.seller == address(0)) revert NotListed();
        if (msg.sender != L.seller) revert NotSeller();

        delete listings[nft][tokenId];
        // Trả NFT lại cho seller
        IERC721(nft).safeTransferFrom(address(this), L.seller, tokenId);

        emit Cancelled(nft, tokenId, L.seller);
    }

    // --- Mua bằng ETH ---
    function buyWithETH(address nft, uint256 tokenId) external payable {
        Listing memory L = listings[nft][tokenId];
        if (L.seller == address(0)) revert NotListed();
        if (L.payToken != address(0)) revert WrongPaymentToken(); // listing không nhận ETH

        uint256 price = L.price;
        require(msg.value >= price, "insufficient ETH");

        // Tính phí
        uint256 fee = (price * feeBps) / 10000;
        uint256 sellerProceeds = price - fee;

        // Xoá listing trước để tránh reentrancy
        delete listings[nft][tokenId];

        // Thanh toán
        if (fee > 0) {
            (bool ok1, ) = payable(feeRecipient).call{value: fee}("");
            if (!ok1) revert TransferFailed();
        }
        (bool ok2, ) = payable(L.seller).call{value: sellerProceeds}("");
        if (!ok2) revert TransferFailed();

        // Refund dư (nếu có)
        if (msg.value > price) {
            (bool ok3, ) = payable(msg.sender).call{value: (msg.value - price)}("");
            if (!ok3) revert TransferFailed();
        }

        // Chuyển NFT cho buyer
        IERC721(nft).safeTransferFrom(address(this), msg.sender, tokenId);

        emit Purchased(nft, tokenId, msg.sender, price, address(0), fee);
    }

    // --- Mua bằng ERC20 ---
    function buyWithERC20(address nft, uint256 tokenId) external {
        Listing memory L = listings[nft][tokenId];
        if (L.seller == address(0)) revert NotListed();
        if (L.payToken == address(0)) revert WrongPaymentToken(); // listing chỉ nhận ERC20

        uint256 price = L.price;
        IERC20 token = IERC20(L.payToken);

        // Tính phí
        uint256 fee = (price * feeBps) / 10000;
        uint256 sellerProceeds = price - fee;

        // Xoá listing trước để tránh reentrancy
        delete listings[nft][tokenId];

        // Thu tiền từ buyer (buyer phải approve trước)
        if (fee > 0) {
            bool okFee = token.transferFrom(msg.sender, feeRecipient, fee);
            if (!okFee) revert TransferFailed();
        }
        bool okSeller = token.transferFrom(msg.sender, L.seller, sellerProceeds);
        if (!okSeller) revert TransferFailed();

        // Chuyển NFT cho buyer
        IERC721(nft).safeTransferFrom(address(this), msg.sender, tokenId);

        emit Purchased(nft, tokenId, msg.sender, price, L.payToken, fee);
    }

    // --- View helper ---
    function getListing(address nft, uint256 tokenId) external view returns (Listing memory) {
        return listings[nft][tokenId];
    }

    // --- ✅ Cho phép contract này nhận NFT ---
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
