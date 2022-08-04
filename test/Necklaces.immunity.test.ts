import { expect } from "chai";
import hre  from "hardhat";

describe("Necklaces minting", async() => {
	const deployContract = async (contractName = "Necklaces") => {
		const Contract = await hre.ethers.getContractFactory(contractName);
		return await Contract.deploy();
	}

	describe("consumeImmunityNecklace", () => {
		it("should change a cat's state to immune", async () => {
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await necklaceContract.setMaxResurrection(0);
			await catContract.mintReserve();
			await necklaceContract.mintNecklace(0);
			await necklaceContract.mintNecklace(0);

			expect(await necklaceContract.totalSupply()).to.equal(2);
			await necklaceContract.consumeImmunityNecklace(0, 0);
			expect(await necklaceContract.totalSupply()).to.equal(1);
			expect(await catContract.catToState(0)).to.equal("immune");
		});

		it("should not let user burn someone else's necklace", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await necklaceContract.setMaxResurrection(0);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await catContract.connect(otherAccount).mint();
			await necklaceContract.connect(otherAccount).mintNecklace(400);

			expect(await catContract.ownerOf(400)).to.equal(otherAccount.address);
			expect(await necklaceContract.totalSupply()).to.equal(1);
			await expect(necklaceContract.consumeImmunityNecklace(0, 0)).to.be.revertedWith("Necklace is not yours to consume!");
			expect(await necklaceContract.totalSupply()).to.equal(1);
		});

		it("should not let user upgrade someone else's cat", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await necklaceContract.setMaxResurrection(0);
			await catContract.mintReserve();
			await catContract.setIsPublicSaleLive(true);
			await catContract.connect(otherAccount).mint();
			await necklaceContract.connect(otherAccount).mintNecklace(400);

			expect(await catContract.ownerOf(400)).to.equal(otherAccount.address);
			expect(await necklaceContract.totalSupply()).to.equal(1);
			await expect(necklaceContract.connect(otherAccount).consumeImmunityNecklace(0, 399))
				.to.be.revertedWith("This is not your cat!");
			expect(await necklaceContract.totalSupply()).to.equal(1);
		});

		it("should revert if cat is already immune", async () => {
			const necklaceContract = await deployContract("Necklaces");
			const catContract = await deployContract("NightCats");
			await necklaceContract.setCatContract(catContract.address);
			await catContract.setNecklaceContract(necklaceContract.address);
			await necklaceContract.setMaxResurrection(0);
			await catContract.mintReserve();
			await necklaceContract.mintNecklace(0);
			await necklaceContract.mintNecklace(0);

			await necklaceContract.consumeImmunityNecklace(0, 0);
			await expect(necklaceContract.consumeImmunityNecklace(1, 0)).to.be.revertedWith("Cat is already immune!");
			expect(await necklaceContract.totalSupply()).to.equal(1);
		});
	});
});