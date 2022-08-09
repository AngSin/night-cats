import hre from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("NightCats setGodCatId", () => {
	const deployContract = async (contractName = "NightCats") => {
		const Contract = await hre.ethers.getContractFactory(contractName);
		return await Contract.deploy();
	};
	it("should clear raffle entries after setting god cat id", async () => {
		const catContract = await deployContract("NightCats");
		const necklaceContract = await deployContract("Necklaces");
		await catContract.setNecklaceContract(necklaceContract.address);
		await necklaceContract.setCatContract(catContract.address);
		await catContract.mintReserve();
		await catContract.changeStateOfCat(0, "immune");
		await necklaceContract.mintNecklace(0);
		await necklaceContract.changeStateOfNecklace(0, "immunity");
		await necklaceContract.mintNecklace(1);
		await necklaceContract.changeStateOfNecklace(1, "immunity");
		await necklaceContract.mintNecklace(2);
		await necklaceContract.changeStateOfNecklace(2, "immunity");
		expect(await necklaceContract.totalSupply()).to.equal(3);
		await necklaceContract.fightGodCat(0, [0, 1, 2]);
		expect(await necklaceContract.getRaffleEntries()).to.eql([
			BigNumber.from(0),
			BigNumber.from(1),
			BigNumber.from(2),
		]);
		await catContract.setGodCatId(1);
		expect(await necklaceContract.getRaffleEntries()).to.eql([]);
	});
});