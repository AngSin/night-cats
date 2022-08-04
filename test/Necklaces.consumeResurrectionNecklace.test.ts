import { expect } from "chai";
import hre  from "hardhat";
import {time} from "@nomicfoundation/hardhat-network-helpers";

describe("Necklaces minting", async() => {
	const deployContract = async (contractName = "Necklaces") => {
		const Contract = await hre.ethers.getContractFactory(contractName);
		return await Contract.deploy();
	}

	describe("consumeResurrectionNecklace", () => {
		it("should resurrect a dead cat", async () => {
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await catContract.mintReserve();
			await time.setNextBlockTimestamp(422222222293);
			await necklaceContract.mintNecklace(0);
			await necklaceContract.mintNecklace(0);
			await catContract.changeStateOfCat(0, "dead");

			expect(await necklaceContract.totalSupply()).to.equal(2);
			expect(await necklaceContract.necklaceToState(0)).to.equal("resurrection");
			expect(await catContract.catToState(0)).to.equal("dead");
			await necklaceContract.consumeResurrectionNecklace(0, 0);
			expect(await necklaceContract.totalSupply()).to.equal(1);
			expect(await catContract.catToState(0)).to.equal("normal");
		});

		it("should not let user burn someone else's necklace", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await time.setNextBlockTimestamp(422222222393);
			await necklaceContract.mintNecklace(0);
			await necklaceContract.mintNecklace(0);
			await catContract.connect(otherAccount).mint();
			await catContract.changeStateOfCat(400, "dead");

			expect(await necklaceContract.totalSupply()).to.equal(2);
			expect(await necklaceContract.necklaceToState(0)).to.equal("resurrection");
			expect(await catContract.catToState(400)).to.equal("dead");
			await expect(necklaceContract.connect(otherAccount).consumeResurrectionNecklace(0, 400))
				.to.be.revertedWith("Necklace is not yours to consume!");
		});

		it("should revert if it is not a resurrection necklace", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await time.setNextBlockTimestamp(422222223311);
			await catContract.connect(otherAccount).mint();
			await necklaceContract.connect(otherAccount).mintNecklace(400);
			await catContract.changeStateOfCat(400, "dead");

			expect(await necklaceContract.totalSupply()).to.equal(1);
			expect(await necklaceContract.necklaceToState(0)).to.equal("immunity");
			expect(await catContract.catToState(400)).to.equal("dead");
			await expect(necklaceContract.connect(otherAccount).consumeResurrectionNecklace(0, 400))
				.to.be.revertedWith("Necklace is not a resurrection necklace!");
		});

		it("should not let user resurrect someone else's cat", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await time.setNextBlockTimestamp(422222224392);
			await catContract.connect(otherAccount).mint();
			await necklaceContract.connect(otherAccount).mintNecklace(400);
			await catContract.changeStateOfCat(0, "dead");

			expect(await necklaceContract.totalSupply()).to.equal(1);
			expect(await necklaceContract.necklaceToState(0)).to.equal("resurrection");
			expect(await catContract.catToState(0)).to.equal("dead");
			await expect(necklaceContract.connect(otherAccount).consumeResurrectionNecklace(0, 0))
				.to.be.revertedWith("This is not your cat!");
		});

		it("should not invoke if user is not a cat owner", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await time.setNextBlockTimestamp(422222224593);
			await necklaceContract.mintNecklace(0);
			await necklaceContract.mintNecklace(0);
			await catContract.changeStateOfCat(0, "dead");

			expect(await necklaceContract.totalSupply()).to.equal(2);
			expect(await necklaceContract.necklaceToState(0)).to.equal("resurrection");
			expect(await catContract.catToState(0)).to.equal("dead");
			await expect(necklaceContract.connect(otherAccount).consumeResurrectionNecklace(0, 0)).to.be.revertedWith("You must own a cat to do this!");
		});
	});
});