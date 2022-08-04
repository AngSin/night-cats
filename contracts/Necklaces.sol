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
}

contract Necklaces is ERC721A, Ownable {
    // cat contract
    address catContract;
    mapping(uint256 => uint256) catToNumOfNecklaces;

    // mint limits
    uint256 public maxImmunity = 6667;
    uint256 public maxResurrection = 3333;
    uint256 public max = maxImmunity + maxResurrection;

    // necklace state
    string immunityState = "immunity";
    string resurrectionState = "resurrection";
    mapping(uint256 => string) public necklaceToState;

    // libraries
    using Strings for uint256;

    constructor() ERC721A("Necklaces", "NLACES") {}

    function setMaxImmunity(uint256 _MAX_IMMUNITY) public onlyOwner {
        maxImmunity = _MAX_IMMUNITY;
    }

    function setMaxResurrection(uint256 _MAX_RESURRECTION) public onlyOwner {
        maxResurrection = _MAX_RESURRECTION;
    }

    function _checkCatContract() internal view virtual {
        require(msg.sender == catContract, "caller is not the NightCats contract!");
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

    function getResurrectionNecklaceCount() public view returns(uint256) {
        uint256 resurrectionNecklaceCounter = 0;
        for (uint256 i = 0; i <= totalSupply(); i++) {
            if (checkStateIsResurrection(necklaceToState[i])) {
                resurrectionNecklaceCounter++;
            }
        }
        return resurrectionNecklaceCounter;
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
        uint256 randomNum = block.timestamp % 2;
        string memory state;
        if (getResurrectionNecklaceCount() >= maxResurrection) {
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
}
