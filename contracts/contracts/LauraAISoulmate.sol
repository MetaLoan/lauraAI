// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SoulFaceSoulmate is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    IERC20 public paymentToken;
    address public treasury;
    uint256 public mintPrice; // ERC20 amount in token's smallest unit (e.g. 1e18 for 1 FF with 18 decimals)

    event SoulmateBorn(address indexed owner, uint256 indexed tokenId, string tokenURI);
    event MintPayment(address indexed payer, address indexed treasury, uint256 amount);

    constructor(address tokenAddress, address treasuryAddress, uint256 initialMintPrice) ERC721("SoulFace Soulmate", "SOUL") Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        require(treasuryAddress != address(0), "Invalid treasury address");
        require(initialMintPrice > 0, "Invalid mint price");
        paymentToken = IERC20(tokenAddress);
        treasury = treasuryAddress;
        mintPrice = initialMintPrice;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.soulface.io/metadata/";
    }

    function safeMint(address to, string memory uri) public payable {
        require(to != address(0), "Invalid recipient");
        require(paymentToken.transferFrom(msg.sender, treasury, mintPrice), "FF transfer failed");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit MintPayment(msg.sender, treasury, mintPrice);
        emit SoulmateBorn(to, tokenId, uri);
    }

    function setMintPrice(uint256 _price) public onlyOwner {
        require(_price > 0, "Invalid mint price");
        mintPrice = _price;
    }

    function setTreasury(address _treasury) public onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }

    function setPaymentToken(address _token) public onlyOwner {
        require(_token != address(0), "Invalid token address");
        paymentToken = IERC20(_token);
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
