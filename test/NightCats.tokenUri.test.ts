import { expect } from "chai";
import hre  from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NightCats tokenURI", async() => {
	const deployContract = async () => {
		const NightCats = await hre.ethers.getContractFactory("NightCats");
		return await NightCats.deploy();
	}

	describe("Normal Cats", () => {
		it("should return unrevealed cat uri", async () => {
			const contract = await deployContract();
			expect(await contract.tokenURI(12)).to.equal("ipfs://unrevealed/12");
		});

		it("should return revealed cat uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			expect(await contract.tokenURI(12)).to.equal("ipfs://baseState/12");
		});

		it("should return undead cat uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			await contract.inflictCurse();
			expect(await contract.tokenURI(12)).to.equal("ipfs://undeadState/12");
		});

		it("should return immune url when curse is active", async () => {
			const immuneCat = 12;
			const contract = await deployContract();
			await contract.revealCats();
			await contract.changeStateOfCat(immuneCat, "immune");
			await contract.inflictCurse();
			expect(await contract.tokenURI(immuneCat)).to.equal("ipfs://immuneState/12");
		})
	});

	describe("God Cat tokenUri", () => {
		it("should return initial god cat uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			await contract.setGodCatId(99);
			expect(await contract.tokenURI(99)).to.equal("ipfs://godCat");
		});

		it("should return ascending uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			await contract.setGodCatId(99);
			await contract.inflictCurse();
			expect(await contract.tokenURI(99)).to.equal("ipfs://godCatAscending");
		});

		it("should return ascended uri", async () => {
			const contract = await deployContract();
			await contract.revealCats();
			await contract.setGodCatId(99);
			await contract.inflictCurse();
			await time.increase((60 * 60 * 24 * 3) + 1);
			expect(await contract.tokenURI(99)).to.equal("ipfs://godCatAscended");
		});
	});
});