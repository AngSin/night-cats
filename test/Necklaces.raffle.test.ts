import hre from "hardhat";
import {expect} from "chai";
import {time} from "@nomicfoundation/hardhat-network-helpers";
import {BigNumber} from "ethers";

describe("Necklaces raffle", () => {
	const deployContract = async (contractName = "Necklaces") => {
		const Contract = await hre.ethers.getContractFactory(contractName);
		return await Contract.deploy();
	}
	describe("fightGodCat", async () => {
		it("should only let cat owners enter the raffle", async () => {
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await expect(necklaceContract.fightGodCat(0, [0])).to.be.revertedWith("You must own a cat to do this!");
		});

		it("should only let immune cat owners to enter the raffle", async () => {
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.mintReserve();
			await expect(necklaceContract.fightGodCat(0, [0])).to.be.revertedWith("The cat must be immune against the God Cat's curse!");
		});

		it("should revert if immune cat is not msg sender's", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await catContract.changeStateOfCat(0, "immune");
			await catContract.connect(otherAccount).mint(1);
			await necklaceContract.mintNecklace(0);
			await necklaceContract.connect(otherAccount).mintNecklace(400);
			await expect(necklaceContract.connect(otherAccount).fightGodCat(0, [0])).to.be.revertedWith("This is not your cat!");
		});

		it("should revert if necklace is not msg sender's", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await necklaceContract.mintNecklace(0);
			await catContract.connect(otherAccount).mint(1);
			await necklaceContract.connect(otherAccount).mintNecklace(400);
			await catContract.changeStateOfCat(400, "immune");
			await expect(necklaceContract.connect(otherAccount).fightGodCat(400, [0]))
				.to.be.revertedWith("This necklace is not yours!");
		});

		it("should enter raffle 3 times for 3 immunity necklaces", async () => {
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await catContract.changeStateOfCat(0, "immune");
			await time.setNextBlockTimestamp(333333333300);
			await necklaceContract.mintNecklace(0);
			expect(await necklaceContract.necklaceToState(0)).to.equal("immunity");
			await time.increaseTo(333333333309);
			await necklaceContract.mintNecklace(1);
			expect(await necklaceContract.necklaceToState(1)).to.equal("immunity");
			await time.increaseTo(333333333319);
			await necklaceContract.mintNecklace(2);
			expect(await necklaceContract.necklaceToState(2)).to.equal("immunity");
			expect(await necklaceContract.totalSupply()).to.equal(3);
			await necklaceContract.fightGodCat(0, [0, 1, 2]);
			expect(await necklaceContract.getRaffleEntries())
				.to.eql([BigNumber.from(0), BigNumber.from(1), BigNumber.from(2)]);
			expect(await necklaceContract.totalSupply()).to.equal(0);
		});

		it("should enter raffle 12 times for 3 resurrection necklaces", async () => {
			const [owner] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await catContract.changeStateOfCat(0, "immune");
			await necklaceContract.mintNecklace(0);
			await necklaceContract.changeStateOfNecklace(0, "resurrection");
			await necklaceContract.mintNecklace(1);
			await necklaceContract.changeStateOfNecklace(1, "resurrection");
			await necklaceContract.mintNecklace(2);
			await necklaceContract.changeStateOfNecklace(2, "resurrection");
			expect(await necklaceContract.totalSupply()).to.equal(3);
			await necklaceContract.fightGodCat(0, [0, 1, 2]);
			expect(await necklaceContract.getRaffleEntries()).to.eql([
				BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), BigNumber.from(0),
				BigNumber.from(1), BigNumber.from(1), BigNumber.from(1), BigNumber.from(1),
				BigNumber.from(2), BigNumber.from(2), BigNumber.from(2), BigNumber.from(2),
			]);
			expect(await necklaceContract.totalSupply()).to.equal(0);
		});
	});
});