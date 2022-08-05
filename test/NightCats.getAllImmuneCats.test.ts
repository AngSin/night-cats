import hre from "hardhat";
import {expect} from "chai";
import {BigNumber} from "ethers";

describe("getAllImmuneCats", () => {
	const deployContract = async (contractName = "NightCats") => {
		const Contract = await hre.ethers.getContractFactory(contractName);
		return await Contract.deploy();
	};

	it("should return only the immune cats", async () => {
		const catContract = await deployContract();
		await catContract.mintReserve();
		await catContract.changeStateOfCat(0, "dead");
		await catContract.changeStateOfCat(1, "immune");
		await catContract.changeStateOfCat(2, "normal");
		await catContract.changeStateOfCat(3, "immune");
		await catContract.changeStateOfCat(4, "immune");

		expect(await catContract.getAllImmuneCats())
			.to.eql([BigNumber.from(1),BigNumber.from(3),BigNumber.from(4)]);
	});
});