import { expect } from "chai";
import hre  from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Necklaces minting", async() => {
	const deployContract = async (contractName = "Necklaces") => {
		const Contract = await hre.ethers.getContractFactory(contractName);
		return await Contract.deploy();
	}

	describe("gainImmunity", () => {
		it("should not let any other address besides the necklace contract invoke it", async () => {
			const catContract = await deployContract("NightCats");
			await expect(catContract.gainImmunity(0)).to.be.revertedWith("caller is not the Necklaces contract!");
		});
	});
});