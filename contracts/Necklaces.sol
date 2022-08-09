// SPDX-License-Identifier: UNLICENSED
// dev: https://twitter.com/ultrasupahotfir
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface NightCat {
    function gainImmunity(uint256 _catId) external;

    function resurrectCat(uint256 _catId) external;

    function catToState(uint256 _catId) external view returns(string memory);

    function immuneState() external view returns(string memory);
}

contract Necklaces is ERC721A, Ownable {
    // cat contract
    address catContract;
    mapping(uint256 => uint256) catToNumOfNecklaces;

    // mint limits
    uint256 public maxImmunity = 6667;
    uint256 public maxResurrection = 3333;

    // necklace state
    string immunityState = "immunity";
    string resurrectionState = "resurrection";
    mapping(uint256 => string) public necklaceToState;

    // raffle entries
    uint256[] raffleEntries;
    uint256 maxNumOfRaffleEntries = 200;

    // libraries
    using Strings for uint256;

    constructor() ERC721A("Necklaces", "NLACES") {}

    function setMaxImmunity(uint256 _maxImmunity) public onlyOwner {
        maxImmunity = _maxImmunity;
    }

    function setMaxResurrection(uint256 _maxResurrection) public onlyOwner {
        maxResurrection = _maxResurrection;
    }

    function _checkCatContract() internal view virtual {
        require(msg.sender == catContract, "caller is not the NightCats contract!");
    }

    function changeStateOfNecklace(uint256 _necklaceId, string calldata _state) public onlyOwner {
        necklaceToState[_necklaceId] = _state;
    }

    function setMaxNumOfRaffleEntries(uint256 _maxNumOfRaffleEntries) public onlyOwner {
        maxNumOfRaffleEntries = _maxNumOfRaffleEntries;
    }

    modifier onlyCatContract() {
        _checkCatContract();
        _;
    }

    function _checkCatOwnership(uint256 _catId) internal view virtual {
        require(IERC721A(catContract).ownerOf(_catId) == msg.sender, "This is not your cat!");
    }

    function _checkCatOwner() internal view virtual {
        require(IERC721A(catContract).balanceOf(msg.sender) > 0, "You must own a cat to do this!");
    }

    modifier onlyCatOwner() {
        _checkCatOwner();
        _;
    }

    function setCatContract(address _catContract) public onlyOwner {
        catContract = _catContract;
    }

    function getResurrectionMintedCount() public view returns(uint256) {
        uint256 resurrectionNecklaceCounter = 0;
        for (uint256 i = 0; i <= totalSupply(); i++) {
            if (checkStateIsResurrection(necklaceToState[i])) {
                resurrectionNecklaceCounter++;
            }
        }
        return resurrectionNecklaceCounter;
    }

    function _checkCatStateIsImmune(uint256 _catId) internal view {
        require(keccak256(abi.encodePacked(NightCat(catContract).catToState(_catId))) ==
            keccak256(abi.encodePacked(NightCat(catContract).immuneState())), "The cat must be immune against the God Cat's curse!");
    }

    function checkStateIsResurrection(string memory _state) internal view returns(bool){
        return (keccak256(abi.encodePacked(_state)) == keccak256(abi.encodePacked(resurrectionState)));
    }

    function checkStateIsImmunity(string memory _state) internal view returns(bool){
        return (keccak256(abi.encodePacked(_state)) == keccak256(abi.encodePacked(immunityState)));
    }

    function mintNecklace(uint256 _catId) public onlyCatOwner {
        _checkCatOwnership(_catId);
        require(catToNumOfNecklaces[_catId] < 3, "You already minted 3 or more Necklaces with this cat!");
        require(super.totalSupply() < (maxImmunity + maxResurrection), "All necklaces minted out!");
        uint256 randomNum = block.timestamp % 2;
        string memory state;
        if (getResurrectionMintedCount() >= maxResurrection) {
            state = immunityState;
        } else {
            if (randomNum == 0) {
                state = immunityState;
            } else {
                state = resurrectionState;
            }
        }
        uint256 tokenId = totalSupply();
        necklaceToState[tokenId] = state;
        super._mint(msg.sender, 1);
    }

    function createResurrectionNecklace(uint256 _necklaceId0, uint256 _necklaceId1, uint256 _necklaceId2) public onlyCatOwner {
        require(super.ownerOf(_necklaceId0) == msg.sender, "First necklace is not yours to burn!");
        require(checkStateIsImmunity(necklaceToState[_necklaceId0]), "First necklace is not an immunity necklace!");
        require(super.ownerOf(_necklaceId1) == msg.sender, "Second necklace is not yours to burn!");
        require(checkStateIsImmunity(necklaceToState[_necklaceId1]), "Second necklace is not an immunity necklace!");
        require(super.ownerOf(_necklaceId2) == msg.sender, "Third necklace is not yours to burn!");
        require(checkStateIsImmunity(necklaceToState[_necklaceId2]), "Third necklace is not an immunity necklace!");
        necklaceToState[_necklaceId0] = resurrectionState;
        super._burn(_necklaceId1);
        super._burn(_necklaceId2);
    }

    function consumeImmunityNecklace(uint256 _necklaceId, uint256 _catId) public onlyCatOwner {
        require(super.ownerOf(_necklaceId) == msg.sender, "Necklace is not yours to consume!");
        _checkCatOwnership(_catId);
        require(checkStateIsImmunity(necklaceToState[_necklaceId]), "Necklace is not an immunity necklace!");
        NightCat(catContract).gainImmunity(_catId);
        super._burn(_necklaceId);
    }

    function consumeResurrectionNecklace(uint256 _necklaceId, uint256 _catId) public onlyCatOwner {
        require(super.ownerOf(_necklaceId) == msg.sender, "Necklace is not yours to consume!");
        _checkCatOwnership(_catId);
        require(checkStateIsResurrection(necklaceToState[_necklaceId]), "Necklace is not a resurrection necklace!");
        NightCat(catContract).resurrectCat(_catId);
        super._burn(_necklaceId);
    }

    function getRaffleEntries() public view onlyOwner returns (uint256[] memory){
        return raffleEntries;
    }

    function getNumOfRaffleEntries() public view returns(uint256) {
        return raffleEntries.length;
    }

    function fightGodCat(uint256 _catId, uint256[] calldata _necklaceIds) public onlyCatOwner {
        _checkCatOwnership(_catId);
        _checkCatStateIsImmune(_catId);
        require(getNumOfRaffleEntries() < maxNumOfRaffleEntries, "There are already enough challengers!");
        for (uint256 i = 0; i < _necklaceIds.length; i++) {
            uint256 _necklaceId = _necklaceIds[i];
            require(super.ownerOf(_necklaceId) == msg.sender, "This necklace is not yours!");
            if (checkStateIsResurrection(necklaceToState[_necklaceId])) {
                raffleEntries.push(_necklaceId);
                raffleEntries.push(_necklaceId);
                raffleEntries.push(_necklaceId);
                raffleEntries.push(_necklaceId);
            } else {
                raffleEntries.push(_necklaceId);
            }
            super._burn(_necklaceId);
        }
    }

    function clearRaffleEntries() public onlyCatContract {
        delete raffleEntries;
    }
}
