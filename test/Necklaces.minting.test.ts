import { expect } from "chai";
import hre  from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Necklaces minting", async() => {
	const deployContract = async (contractName = "Necklaces") => {
		const NightCats = await hre.ethers.getContractFactory(contractName);
		return await NightCats.deploy();
	}

	describe("mintNecklace", () => {
		it("should let cat owners mint with right state", async () => {
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await nightCatsContract.mintReserve();
			await necklacesContract.setCatContract(nightCatsContract.address);

			expect(await necklacesContract.totalSupply()).to.equal(0);
			await time.increaseTo(111111111111);
			await necklacesContract.mintNecklace(0);
			expect(await necklacesContract.totalSupply()).to.equal(1);
			expect(await necklacesContract.necklaceToState(0)).to.equal("immunity");
			await time.increaseTo(222222222222);
			await necklacesContract.mintNecklace(1);
			expect(await necklacesContract.totalSupply()).to.equal(2);
			expect(await necklacesContract.necklaceToState(1)).to.equal("resurrection");
		});

		it("should not let addresses without cats mint", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await nightCatsContract.mintReserve();
			await necklacesContract.setCatContract(nightCatsContract.address);

			await expect(necklacesContract.connect(otherAccount).mintNecklace(0)).to.be.revertedWith("You must own a cat to do this!");
		});

		it("should only mint immunity necklaces after all resurrection necklaces have been minted", async () => {
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await nightCatsContract.mintReserve();
			await necklacesContract.setCatContract(nightCatsContract.address);
			await necklacesContract.setMaxResurrection(1);

			for (let i = 0; i < 20; i++) {
				await necklacesContract.mintNecklace(i);
			}

			expect(await necklacesContract.totalSupply()).to.equal(20);
			await necklacesContract.mintNecklace(20);
			expect(await necklacesContract.necklaceToState(20)).to.equal("immunity");
			await necklacesContract.mintNecklace(21);
			expect(await necklacesContract.necklaceToState(21)).to.equal("immunity");
			await necklacesContract.mintNecklace(22);
			expect(await necklacesContract.necklaceToState(22)).to.equal("immunity");
			await necklacesContract.mintNecklace(23);
			expect(await necklacesContract.necklaceToState(23)).to.equal("immunity");
		});

		it("should not let user mint more than available", async () => {
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await necklaceContract.setMaxResurrection(1);
			await necklaceContract.setMaxImmunity(1);
			await catContract.mintReserve();
			await necklaceContract.mintNecklace(0);
			await necklaceContract.mintNecklace(0);
			await expect(necklaceContract.mintNecklace(0)).to.be.revertedWith("All necklaces minted out!");
		});
	});

	describe("getResurrectionMintedCount", () => {
		it.skip("should return correct number of resurrection necklaces", async () => {
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await nightCatsContract.mintReserve();
			await necklacesContract.setCatContract(nightCatsContract.address);

			await time.setNextBlockTimestamp(333333333330);
			await necklacesContract.mintNecklace(0);

			await time.increaseTo(333333333332);
			await necklacesContract.mintNecklace(1);

			await time.increaseTo(333333333334);
			await necklacesContract.mintNecklace(2);

			await time.increaseTo(333333333336);
			await necklacesContract.mintNecklace(3);

			expect(await necklacesContract.totalSupply()).to.equal(4n);
			expect(await necklacesContract.getResurrectionMintedCount()).to.equal(4n);
		});
	});

	describe("createResurrectionNecklace", () => {
		it("should create ResurrectionNecklace", async() => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await necklacesContract.setCatContract(nightCatsContract.address);
			await nightCatsContract.mintReserve();
			await nightCatsContract.setIsPublicSaleLive(true);
			await necklacesContract.setMaxResurrection(0);

			await nightCatsContract.connect(otherAccount).mint(1);
			await necklacesContract.connect(otherAccount).mintNecklace(400);
			await necklacesContract.connect(otherAccount).mintNecklace(400);
			await necklacesContract.connect(otherAccount).mintNecklace(400);
			expect(await necklacesContract.totalSupply()).to.equal(3);

			expect(await necklacesContract.getResurrectionMintedCount()).to.equal(0);
			await necklacesContract.connect(otherAccount).createResurrectionNecklace(0, 1, 2);
			expect(await necklacesContract.necklaceToState(0)).to.equal("resurrection");
			expect(await necklacesContract.getResurrectionMintedCount()).to.equal(1);
			expect(await necklacesContract.totalSupply()).to.equal(1);
		});

		it("should stop user if they don't own a cat", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await necklacesContract.setCatContract(nightCatsContract.address);
			await nightCatsContract.mintReserve();
			await necklacesContract.mintNecklace(0);
			await necklacesContract.mintNecklace(0);
			await necklacesContract.mintNecklace(0);

			await expect(necklacesContract.connect(otherAccount).createResurrectionNecklace(0, 1, 2)).to.be.revertedWith("You must own a cat to do this!");
		});

		it("should not let user burn someone else's immunity necklace", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await necklacesContract.setCatContract(nightCatsContract.address);
			await nightCatsContract.mintReserve();
			await nightCatsContract.setIsPublicSaleLive(true);
			await necklacesContract.mintNecklace(0);
			await necklacesContract.mintNecklace(0);
			await necklacesContract.mintNecklace(0);

			await nightCatsContract.connect(otherAccount).mint(1);
			await necklacesContract.connect(otherAccount).mintNecklace(400);
			await expect(necklacesContract.connect(otherAccount).createResurrectionNecklace(0, 1, 2))
				.to.be.revertedWith("First necklace is not yours to burn!");
		});

		it("should not let users repeat necklaces", async() => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const nightCatsContract = await deployContract("NightCats");
			const necklacesContract = await deployContract("Necklaces");
			await necklacesContract.setCatContract(nightCatsContract.address);
			await nightCatsContract.mintReserve();
			await nightCatsContract.setIsPublicSaleLive(true);
			await necklacesContract.setMaxResurrection(0);

			await nightCatsContract.connect(otherAccount).mint(1);
			await necklacesContract.connect(otherAccount).mintNecklace(400);
			await necklacesContract.connect(otherAccount).mintNecklace(400);
			await necklacesContract.connect(otherAccount).mintNecklace(400);
			expect(await necklacesContract.totalSupply()).to.equal(3);

			expect(await necklacesContract.getResurrectionMintedCount()).to.equal(0);
			await expect(necklacesContract.connect(otherAccount).createResurrectionNecklace(0, 1, 0)).to.be
				.revertedWith("You must use unique necklaces!");
		});
	});
});