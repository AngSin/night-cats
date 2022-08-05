import hre from "hardhat";
import {expect} from "chai";
import {time} from "@nomicfoundation/hardhat-network-helpers";

describe("killCat", () => {
	const deployContract = async (contractName = "NightCats") => {
		const Contract = await hre.ethers.getContractFactory(contractName);
		return await Contract.deploy();
	};

	it("should kill cat", async () => {
		const catTobeKilled = 19;
		const catContract = await deployContract();
		await catContract.mintReserve();
		await catContract.setGodCatId(3);
		await catContract.inflictCurse();
		await catContract.inflictCurse();
		await catContract.changeStateOfCat(catTobeKilled, "immune");

		expect(await catContract.catToState(catTobeKilled)).to.equal("immune");
		await catContract.killCat(catTobeKilled);
		expect(await catContract.catToState(catTobeKilled)).to.equal("dead");
	});

	it("should not kill cat if more than 3 days have passed since inflicting curse", async () => {
		const catTobeKilled = 19;
		const catContract = await deployContract();
		await catContract.mintReserve();
		await catContract.setGodCatId(3);
		await catContract.inflictCurse();
		await catContract.inflictCurse();
		await catContract.changeStateOfCat(catTobeKilled, "immune");
		expect(await catContract.catToState(catTobeKilled)).to.equal("immune");

		await time.increase(60 * 60 * 24 * 3);
		await expect(catContract.killCat(catTobeKilled)).to.be.revertedWith("Curse is not active!");
	});

	it("should not kill cat if 15 are already killed", async () => {
		const catContract = await deployContract();
		await catContract.mintReserve();
		await catContract.setGodCatId(0);
		await catContract.inflictCurse();
		await catContract.inflictCurse();
		for (let i = 1; i < 16; i++) {
			await catContract.changeStateOfCat(i, "immune");
			await catContract.killCat(i);
		}
		await catContract.changeStateOfCat(16, "immune");
		await expect(catContract.killCat(16))
			.to.be.revertedWith("You have already exhausted this curse!");
	});

	it("should not kill cat if it is not immune", async () => {
		const catTobeKilled = 19;
		const catContract = await deployContract();
		await catContract.mintReserve();
		await catContract.setGodCatId(0);
		await catContract.inflictCurse();
		await catContract.inflictCurse();
		await expect(catContract.killCat(catTobeKilled))
			.to.be.revertedWith("This cat is not immune to the curse! You can't kill your own slave cat!");
	});

	it("should not kill cat if it is the first curse", async () => {
		const catTobeKilled = 19;
		const catContract = await deployContract();
		await catContract.mintReserve();
		await catContract.setGodCatId(0);
		await catContract.inflictCurse();
		await expect(catContract.killCat(catTobeKilled))
			.to.be.revertedWith("You can't kill yet!");
	});
});