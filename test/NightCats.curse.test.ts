import { expect } from "chai";
import hre  from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NightCats", async() => {
	const deployContract = async () => {
		const NightCats = await hre.ethers.getContractFactory("NightCats");
		return await NightCats.deploy();
	}

	describe("curseTimestamp", () => {
		it("should be unset to start with", async () => {
			const contract = await deployContract();
			expect(await contract.curseTimestamp()).to.equal(0n);
		});
	});

	describe("isCurseActive", () => {
		it("should be in inflicting curse state within 3 days of inflicting curse", async () => {
			const contract = await deployContract();
			await contract.inflictCurse();
			expect(await contract.isCurseActive()).to.equal(true);
		});

		it("should not be in inflicting curse state if 3 days have passed since inflicting curse", async () => {
			const contract = await deployContract();
			await contract.inflictCurse();
			const moreThanThreeDaysInSeconds = (60 * 60 * 24 * 3) + 1;
			await time.increase(moreThanThreeDaysInSeconds);
			expect(await contract.isCurseActive()).to.equal(false);
		});
	});
});