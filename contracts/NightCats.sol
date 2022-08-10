// SPDX-License-Identifier: UNLICENSED
// dev: https://twitter.com/ultrasupahotfir
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface Necklace {
    function clearRaffleEntries() external;
}

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
    uint256 curseCounter = 0;

    // uris
    string public baseStateUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmVM3agU7eZXyvYgUwzX8LZFtgz4FfNR31pbLAH4Ykdtkb/";
    string public cursedStateUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmYDxzyU5xqm5ZUMbJS8T3jUGeG6bQwdjDp4nvKQnkM2Xx/";
    string public immuneStateUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmYKbDn17t26WH72gfGKR1MShHgbv3rvhroFJfCe5A5kKv/";
    string public deadStateUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmW48BxfkzNz1NcML16P2be6SnkeoEbvqFnayhE7Chanes/";
    string public godCatUri = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmTEVBu1BpBjNjZdx8wxXwkYAm2856Yvq58AC1mdcY9YuT/";

    // periods
    uint public curseTimestamp;
    uint256 public catsKilledDuringThisCurse = 0;
    uint public cursePeriod = 3 days;
    uint public immunityPeriod = 3 days;

    // libraries
    using Strings for uint256;

    constructor() ERC721A("NightCats", "NCATS") {}

    function setFreeMintSupply(uint256 _freeMintSupply) public onlyOwner {
        freeMintSupply = _freeMintSupply;
    }

    function setPaidMintSupply(uint256 _paidMintSupply) public onlyOwner {
        paidMintSupply = _paidMintSupply;
    }

    function setOpenseaLink(string calldata _openseaLink) public onlyOwner {
        openseaLink = _openseaLink;
    }

    function setBaseStateUri(string calldata _baseStateUri) public onlyOwner {
        baseStateUri = _baseStateUri;
    }

    function setCursedStateUri(string calldata _cursedStateUri) public onlyOwner {
        cursedStateUri = _cursedStateUri;
    }

    function setDeadStateUri(string calldata _deadStateUri) public onlyOwner {
        deadStateUri = _deadStateUri;
    }

    function setImmuneStateUri(string calldata _immuneStateUri) public onlyOwner {
        immuneStateUri = _immuneStateUri;
    }

    function setGodCatUri(string calldata _godCatUri) public onlyOwner {
        godCatUri = _godCatUri;
    }

    function setCursePeriod(uint256 _cursePeriod) public onlyOwner {
        cursePeriod = _cursePeriod;
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

    function mint(uint256 _quantity) public payable {
        require(isPublicSaleLive, "Public sale is not yet live!");
        require((balanceOf(msg.sender) + _quantity) <= maxPerWallet, "You already have enough NightCats!");
        require((totalSupply() + _quantity) <= (reserveSupply + freeMintSupply + paidMintSupply), "You are trying to mint over the max limit!");
        if ((totalSupply() + _quantity) > (reserveSupply + freeMintSupply)) {
            require((msg.value * _quantity) >= mintPrice, "Please send at least 0.025 ETH per cat to mint!");
        }
        super._safeMint(msg.sender, _quantity);
    }

    function setGodCatId(uint256 _tokenId) public onlyOwner {
        godCatTokenId = _tokenId;
        if (necklaceContract != address(0)) {
            Necklace(necklaceContract).clearRaffleEntries();
        }
    }

    function inflictCurse() public onlyOwner {
        if (curseCounter < 2) {
            curseCounter++;
        }
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

    function checkMoreThanOneCurseInflicted() internal view {
        require(curseCounter >= 2, "You can't kill yet!");
    }

    function killCat(uint256 _catId) public {
        require(super.ownerOf(godCatTokenId) == msg.sender, "You are not the God Cat!");
        checkMoreThanOneCurseInflicted();
        require(isCurseActive(), "Curse is not active!");
        require(catsKilledDuringThisCurse < maxKillsPerCurse, "You have already exhausted this curse!");
        require(isImmuneState(catToState[_catId]), "This cat is not immune to the curse! You can't kill your own slave cat!");
        catToState[_catId] = deadState;
        catsKilledDuringThisCurse++;
    }

    function tokenURI(uint256 _catId) override public view returns (string memory) {
        if (!revealed) {
            return "";
        }
        if (_catId == godCatTokenId) {
            return string(abi.encodePacked(godCatUri, Strings.toString(_catId)));
        } else {
            if (isDeadState(catToState[_catId])) {
                return string(abi.encodePacked(deadStateUri, Strings.toString(_catId)));
            }
            if (isCurseActive() && isImmuneState(catToState[_catId])) {
                return string(abi.encodePacked(immuneStateUri, Strings.toString(_catId)));
            }
            if (isCurseActive()) {
                return string(abi.encodePacked(cursedStateUri, Strings.toString(_catId)));
            }
            return string(abi.encodePacked(baseStateUri, Strings.toString(_catId)));
        }
    }
}
