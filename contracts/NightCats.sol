// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract NightCats is ERC721A, Ownable {
    bool public isReserveMinted = false;
    bool public isPublicSaleLive = false;
    uint256 public reserveSupply = 400;
    uint256 public freeMintSupply = 1000;
    uint256 public paidMintSupply = 4155;
    uint256 public mintPrice = 0.025 ether;

    constructor() ERC721A("NightCats", "NCATS") {}

    function mintReserve() public onlyOwner {
        require (isReserveMinted == false, "Reserve is already minted!");
        isReserveMinted = true;
        _safeMint(msg.sender, reserveSupply);
    }

    function setIsPublicSaleLive(bool _isPublicSaleLive) public onlyOwner {
        require(isReserveMinted, "Reserve should be minted before starting public sale!");
        isPublicSaleLive = _isPublicSaleLive;
    }

    function mint() public payable {
        require(isPublicSaleLive, "Public sale is not yet live!");
        require(balanceOf(msg.sender) == 0, "You already have some NightCats!");
        require(totalSupply() < (reserveSupply + freeMintSupply + paidMintSupply), "All NightCats have been minted!");
        if (totalSupply() >= (reserveSupply + freeMintSupply)) {
            require(msg.value >= mintPrice, "Please send at least 0.025 ETH to mint!");
        }
        _safeMint(msg.sender, 1);
    }
}
