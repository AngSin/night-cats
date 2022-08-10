import { expect } from "chai";
import hre  from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NightCats tokenURI", async() => {
	const deployContract = async () => {
		const NightCats = await hre.ethers.getContractFactory("NightCats");
		return await NightCats.deploy();
	}

	describe("cursed state", () => {
		it("should return cursed state after inflicting curse", async () => {
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.inflictCurse();
			expect(await contract.tokenURI(12)).to.equal(`${await contract.cursedStateUri()}12`);
		});
	});

	describe("Normal Cats", () => {
		it("should return unrevealed cat uri", async () => {
			const contract = await deployContract();
			expect(await contract.tokenURI(12)).to.equal("");
		});

		it("should return revealed cat uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			expect(await contract.tokenURI(12)).to.equal(`${await contract.baseStateUri()}12`);
		});

		it("should return undead cat uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			await contract.inflictCurse();
			expect(await contract.tokenURI(12)).to.equal(`${await contract.cursedStateUri()}12`);
		});

		it("should return immune url when curse is active", async () => {
			const immuneCat = 12;
			const contract = await deployContract();
			await contract.revealCats();
			await contract.changeStateOfCat(immuneCat, "immune");
			await contract.inflictCurse();
			expect(await contract.tokenURI(immuneCat)).to.equal(`${await contract.immuneStateUri()}12`);
		});

		it("should return dead url for dead cats regardless of curse", async () => {
			const catToKill = 12;
			const contract = await deployContract();
			await contract.revealCats();
			await contract.changeStateOfCat(catToKill, "dead");
			expect(await contract.tokenURI(catToKill)).to.equal(`${await contract.deadStateUri()}12`);
			await contract.inflictCurse();
			expect(await contract.tokenURI(catToKill)).to.equal(`${await contract.deadStateUri()}12`);
		});
	});

	describe("God Cat tokenUri", () => {
		it("should return god cat uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			await contract.setGodCatId(99);
			expect(await contract.tokenURI(99)).to.equal(`${await contract.godCatUri()}99`);
		});
	});
});