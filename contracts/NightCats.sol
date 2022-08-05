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

    // opensea link
    string public openseaLink;

    // flags
    bool public isReserveMinted = false;
    bool public isPublicSaleLive = false;
    bool public revealed = false;

    // limits
    uint256 public maxPerWallet = 3;
    uint256 public reserveSupply = 400;
    uint256 public freeMintSupply = 1000;
    uint256 public paidMintSupply = 4155;
    uint256 public maxKillsPerCurse = 15;

    // mint price
    uint256 public mintPrice = 0.025 ether;

    // states
    uint256 public godCatTokenId;
    string public immuneState = "immune";
    string public deadState = "dead";
    string public normalState = "normal";
    mapping(uint256 => string) public catToState;

    // uris
    string public unrevealedStateUri = "ipfs://unrevealed/";
    string public normalStateUri = "ipfs://normalState/";
    string public undeadStateUri = "ipfs://undeadState/";
    string public godCatUri = "ipfs://godCat";
    string public godCatAscendingUri = "ipfs://godCatAscending";
    string public godCatAscendedUri = "ipfs://godCatAscended";

    // periods
    uint public curseTimestamp;
    uint256 public catsKilledDuringThisCurse = 0;
    uint public cursePeriod = 3 days;
    uint public immunityPeriod = 3 days;

    // libraries
    using Strings for uint256;

    constructor() ERC721A("NightCats", "NCATS") {}

    function setOpenseaLink(string calldata _openseaLink) public onlyOwner {
        openseaLink = _openseaLink;
    }

    function fetchAllUnder1e() public {

    }

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
        curseTimestamp = block.timestamp;
        catsKilledDuringThisCurse = 0;
    }

    function isCurseActive() public view returns(bool){
        return (curseTimestamp + cursePeriod) >= block.timestamp;
    }

    function revealCats() public onlyOwner {
        revealed = true;
    }

    function isImmuneState(string memory _state) internal view returns(bool){
        return (keccak256(abi.encodePacked(_state)) == keccak256(abi.encodePacked(immuneState)));
    }

    function isDeadState(string memory _state) internal view returns(bool){
        return (keccak256(abi.encodePacked(_state)) == keccak256(abi.encodePacked(deadState)));
    }

    function gainImmunity(uint256 _catId) external onlyNecklaceContract {
        require(!isImmuneState(catToState[_catId]), "Cat is already immune!");
        catToState[_catId] = immuneState;
    }

    function resurrectCat(uint256 _catId) external onlyNecklaceContract {
        require(isDeadState(catToState[_catId]), "The cat is not dead!");
        catToState[_catId] = normalState;
    }

    function changeStateOfCat(uint256 _catId, string calldata _state) external onlyOwner {
        catToState[_catId] = _state;
    }

    function getAllImmuneCats() external view returns (uint256[] memory) {
        uint256 numOfImmuneCats;
        for (uint256 i = 0; i < super.totalSupply(); i++) {
            if (isImmuneState(catToState[i])) {
                numOfImmuneCats++;
            }
        }
        uint256[] memory immuneCats = new uint256[](numOfImmuneCats);
        uint256 immuneCatsIndex = 0;
        for (uint256 i = 0; i < super.totalSupply(); i++) {
            if (isImmuneState(catToState[i])) {
                immuneCats[immuneCatsIndex] = i;
                immuneCatsIndex++;
            }
        }
        return immuneCats;
    }

    function killCat(uint256 _catId) public {
        require(super.ownerOf(godCatTokenId) == msg.sender, "You are not the God Cat!");
        require(isCurseActive(), "Curse is not active!");
        require(catsKilledDuringThisCurse < maxKillsPerCurse, "You have already exhausted this curse!");
        require(isImmuneState(catToState[_catId]), "This cat is not immune to the curse! You can't kill your own slave cat!");
        catToState[_catId] = deadState;
        catsKilledDuringThisCurse++;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        if (!revealed) {
            return string(abi.encodePacked(unrevealedStateUri, Strings.toString(_tokenId)));
        }
        if (_tokenId == godCatTokenId) {
            if (curseTimestamp == 0) {
                return godCatUri;
            }
            if (isCurseActive()) {
                return godCatAscendingUri;
            } else {
                return godCatAscendedUri;
            }
        } else {
            if (isCurseActive()) {
                return string(abi.encodePacked(undeadStateUri, Strings.toString(_tokenId)));
            }
            return string(abi.encodePacked(normalStateUri, Strings.toString(_tokenId)));
        }
    }
}
