// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SoulFaceMarketplace
 * @dev NFT Marketplace for SoulFace Soulmate NFTs
 * Features: list, buy, delist with 2.5% platform fee
 */
contract SoulFaceMarketplace is Ownable, ReentrancyGuard {
    // NFT contract reference
    IERC721 public immutable nftContract;

    // Platform fee: 2.5% (250 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 250;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // tokenId => Listing
    mapping(uint256 => Listing) public listings;

    // Array of all listed token IDs (for enumeration)
    uint256[] private _listedTokenIds;
    mapping(uint256 => uint256) private _tokenIdToIndex;

    // Accumulated platform fees
    uint256 public accumulatedFees;

    // Events
    event ItemListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event ItemSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 platformFee
    );

    event ItemDelisted(uint256 indexed tokenId, address indexed seller);

    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = IERC721(_nftContract);
    }

    /**
     * @dev List an NFT for sale
     * @param tokenId The NFT token ID to list
     * @param price The sale price in wei (BNB)
     */
    function listItem(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "You don't own this NFT"
        );
        require(
            nftContract.getApproved(tokenId) == address(this) ||
                nftContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        require(!listings[tokenId].active, "Item already listed");

        // Create listing
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        // Add to enumeration
        _tokenIdToIndex[tokenId] = _listedTokenIds.length;
        _listedTokenIds.push(tokenId);

        emit ItemListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Buy a listed NFT
     * @param tokenId The NFT token ID to buy
     */
    function buyItem(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Item not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        require(listing.seller != msg.sender, "Cannot buy your own item");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Calculate platform fee
        uint256 platformFee = (price * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 sellerProceeds = price - platformFee;

        // Mark as inactive before transfers (reentrancy protection)
        listing.active = false;

        // Remove from enumeration
        _removeFromEnumeration(tokenId);

        // Accumulate platform fees
        accumulatedFees += platformFee;

        // Transfer NFT to buyer
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);

        // Transfer proceeds to seller
        (bool success, ) = payable(seller).call{value: sellerProceeds}("");
        require(success, "Failed to send proceeds to seller");

        // Refund excess payment
        if (msg.value > price) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - price
            }("");
            require(refundSuccess, "Failed to refund excess");
        }

        emit ItemSold(tokenId, seller, msg.sender, price, platformFee);
    }

    /**
     * @dev Delist an NFT from sale
     * @param tokenId The NFT token ID to delist
     */
    function delistItem(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Item not listed");
        require(listing.seller == msg.sender, "You are not the seller");

        listing.active = false;
        _removeFromEnumeration(tokenId);

        emit ItemDelisted(tokenId, msg.sender);
    }

    /**
     * @dev Get listing information for a token
     * @param tokenId The NFT token ID
     */
    function getListing(
        uint256 tokenId
    )
        external
        view
        returns (address seller, uint256 price, bool active)
    {
        Listing storage listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }

    /**
     * @dev Get all active listings
     * @return tokenIds Array of listed token IDs
     * @return sellers Array of seller addresses
     * @return prices Array of prices
     */
    function getActiveListings()
        external
        view
        returns (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        )
    {
        uint256 length = _listedTokenIds.length;
        tokenIds = new uint256[](length);
        sellers = new address[](length);
        prices = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = _listedTokenIds[i];
            Listing storage listing = listings[tokenId];
            tokenIds[i] = tokenId;
            sellers[i] = listing.seller;
            prices[i] = listing.price;
        }

        return (tokenIds, sellers, prices);
    }

    /**
     * @dev Get the number of active listings
     */
    function getActiveListingsCount() external view returns (uint256) {
        return _listedTokenIds.length;
    }

    /**
     * @dev Withdraw accumulated platform fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");

        accumulatedFees = 0;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Failed to withdraw fees");

        emit FeesWithdrawn(owner(), amount);
    }

    /**
     * @dev Internal function to remove token from enumeration
     */
    function _removeFromEnumeration(uint256 tokenId) private {
        uint256 index = _tokenIdToIndex[tokenId];
        uint256 lastIndex = _listedTokenIds.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = _listedTokenIds[lastIndex];
            _listedTokenIds[index] = lastTokenId;
            _tokenIdToIndex[lastTokenId] = index;
        }

        _listedTokenIds.pop();
        delete _tokenIdToIndex[tokenId];
    }
}
