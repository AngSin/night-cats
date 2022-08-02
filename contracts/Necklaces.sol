// SPDX-License-Identifier: UNLICENSED
// dev: https://twitter.com/ultrasupahotfir
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Necklaces is ERC721A, Ownable {
    // cat contract
    address catContract;

    // mint limits
    uint256 public MAX_IMMUNITY = 6667;
    uint256 public MAX_RESURRECTION = 3333;
    uint256 public MAX = MAX_IMMUNITY + MAX_RESURRECTION;

    // necklace state
    string immunityState = "immunity";
    string resurrectionState = "resurrection";
    mapping(uint256 => string) public necklaceToState;

    constructor() ERC721A("Necklaces", "NLACES") {}

    function setMaxImmunity(uint256 _MAX_IMMUNITY) public onlyOwner {
        MAX_IMMUNITY = _MAX_IMMUNITY;
    }

    function setMaxResurrection(uint256 _MAX_RESURRECTION) public onlyOwner {
        MAX_RESURRECTION = _MAX_RESURRECTION;
    }

    function _checkCatContract() internal view virtual {
        require(msg.sender == catContract, "caller is not the NightCats contract!");
    }

    modifier onlyCatContract() {
        _checkCatContract();
        _;
    }

    function _checkCatOwner() internal view virtual {
        require(IERC721A(catContract).balanceOf(msg.sender) > 0, "You must own a cat to mint a necklace!");
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

    function mintNecklace() public onlyCatOwner {
        uint256 randomNum = block.timestamp % 2;
        string memory state;
        if (getResurrectionNecklaceCount() == MAX_RESURRECTION) {
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
        _mint(msg.sender, 1);
    }
}
