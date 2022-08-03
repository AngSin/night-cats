// SPDX-License-Identifier: UNLICENSED
// dev: https://twitter.com/ultrasupahotfir
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract NightCats is ERC721A, Ownable {
    // necklace contract
    address necklaceContract;

    // flags
    bool public isReserveMinted = false;
    bool public isPublicSaleLive = false;
    bool public revealed = false;

    // supplies
    uint256 public maxPerWallet = 3;
    uint256 public reserveSupply = 400;
    uint256 public freeMintSupply = 1000;
    uint256 public paidMintSupply = 4155;

    // mint price
    uint256 public mintPrice = 0.025 ether;

    // states
    uint256 public godCatTokenId;
    uint public inflictingCurseTimestamp;
    string public immuneState = "immune";
    mapping(uint256 => string) public catToState;

    // uris
    string public unrevealedStateUri = "ipfs://unrevealed/";
    string public normalStateUri = "ipfs://normalState/";
    string public undeadStateUri = "ipfs://undeadState/";
    string public godCatUri = "ipfs://godCat";
    string public godCatAscendingUri = "ipfs://godCatAscending";
    string public godCatAscendedUri = "ipfs://godCatAscended";

    // periods
    uint public ascendingPeriod = 3 days;
    uint public immunityPeriod = 3 days;

    // libraries
    using Strings for uint256;

    constructor() ERC721A("NightCats", "NCATS") {}

    modifier onlyNecklaceContract() {
        _checkNecklaceContract();
        _;
    }

    function _checkNecklaceContract() internal view virtual {
        require(msg.sender == necklaceContract, "caller is not the Necklaces contract!");
    }

    function setNecklaceContract(address _necklaceContract) public onlyOwner {
        necklaceContract = _necklaceContract;
    }

    function mintReserve() public onlyOwner {
        require (isReserveMinted == false, "Reserve is already minted!");
        isReserveMinted = true;
        super._safeMint(msg.sender, reserveSupply);
    }

    function setIsPublicSaleLive(bool _isPublicSaleLive) public onlyOwner {
        require(isReserveMinted, "Reserve should be minted before starting public sale!");
        isPublicSaleLive = _isPublicSaleLive;
    }

    function mint() public payable {
        require(isPublicSaleLive, "Public sale is not yet live!");
        require(balanceOf(msg.sender) <= maxPerWallet, "You already have some NightCats!");
        require(totalSupply() < (reserveSupply + freeMintSupply + paidMintSupply), "All NightCats have been minted!");
        if (totalSupply() >= (reserveSupply + freeMintSupply)) {
            require(msg.value >= mintPrice, "Please send at least 0.025 ETH to mint!");
        }
        super._safeMint(msg.sender, 1);
    }

    function setGodCatId(uint256 _tokenId) public onlyOwner {
        godCatTokenId = _tokenId;
    }

    function inflictCurse() public onlyOwner {
        inflictingCurseTimestamp = block.timestamp;
    }

    function isCurseInflicting() public view returns(bool){
        return (inflictingCurseTimestamp + ascendingPeriod) >= block.timestamp;
    }

    function revealCats() public onlyOwner {
        revealed = true;
    }

    function checkStateIsImmunity(string memory _state) internal view returns(bool){
        return (keccak256(abi.encodePacked(_state)) == keccak256(abi.encodePacked(immuneState)));
    }

    function gainImmunity(uint256 _catId) external onlyNecklaceContract {
        require(!checkStateIsImmunity(catToState[_catId]), "Cat is already immune!");
        catToState[_catId] = immuneState;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        if (!revealed) {
            return string(abi.encodePacked(unrevealedStateUri, Strings.toString(_tokenId)));
        }
        if (_tokenId == godCatTokenId) {
            if (inflictingCurseTimestamp == 0) {
                return godCatUri;
            }
            if (isCurseInflicting()) {
                return godCatAscendingUri;
            } else {
                return godCatAscendedUri;
            }
        }
        if (isCurseInflicting()) {
            return string(abi.encodePacked(undeadStateUri, Strings.toString(_tokenId)));
        }
        return string(abi.encodePacked(normalStateUri, Strings.toString(_tokenId)));
    }
}
