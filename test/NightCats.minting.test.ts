import { expect } from "chai";
import hre  from "hardhat";
import {BigNumber} from "ethers";

describe("NightCats", async() => {
	const deployContract = async () => {
		const NightCats = await hre.ethers.getContractFactory("NightCats");
		return await NightCats.deploy();
	}

	describe("mintPrice", () => {
		it("should have correct mint price", async () => {
			const correctMintPriceInWei = 25000000000000000n;
			const contract = await deployContract()
			expect(await contract.mintPrice()).to.equal(correctMintPriceInWei);
		});
	});

	describe("mintReserve", () => {
		it("should mint reserve successfully", async () => {
			const contract = await deployContract();
			await contract.mintReserve();
			expect(await contract.totalSupply()).to.equal(await contract.totalSupply());
		});

		it("should not mint reserve if already minted", async () => {
			const contract = await deployContract();
			await contract.mintReserve();
			await expect(contract.mintReserve()).to.be.revertedWith("Reserve is already minted!");
		});

		it("should not mint reserve if not owner", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await expect(contract.connect(otherAccount).mintReserve()).to.be.revertedWith("Ownable: caller is not the owner");
		});
	});

	describe("setIsPublicSaleLive", () => {
		it("should revert if caller is not owner", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await expect(contract.connect(otherAccount).setIsPublicSaleLive(true)).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("should revert if reserve is not minted", async () => {
			const contract = await deployContract();
			await expect(contract.setIsPublicSaleLive(true)).to.be.revertedWith("Reserve should be minted before starting public sale!");
		});

		it("should succeed", async () => {
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			expect(await contract.isPublicSaleLive()).to.equal(true);
		});
	});

	describe("mint", () => {
		it("should revert if public sale is not live", async() => {
			const contract = await deployContract();
			await expect(contract.mint()).to.be.revertedWith("Public sale is not yet live!");
		});

		it("should revert if user already has some NightCats", async() => {
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			await expect(contract.mint()).to.be.revertedWith("You already have some NightCats!");
		});

		it("should mint for free before 1000 public mints", async() => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			await contract.connect(otherAccount).mint();
			expect(await contract.totalSupply()).to.equal((await contract.reserveSupply()).add(1n));
		});

		it("should mint for 0.025 ETH after 1000 public mints", async() => {
			const [owner, otherAccount0, otherAccount1] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			let totalSupply = await contract.totalSupply();
			for (let i = 1; i <= 1_000; i++) {
				await contract.connect(otherAccount0).mint();
				await contract.connect(otherAccount0).transferFrom(otherAccount0.address, owner.address, totalSupply);
				totalSupply = totalSupply.add(1n);
			}
			const unusedWallet = otherAccount1;
			expect(await contract.totalSupply()).to.equal(BigNumber.from(1_400));
			await contract.connect(unusedWallet).mint({
				value: hre.ethers.utils.parseEther("0.025"),
			});
			expect(await contract.totalSupply()).to.equal(BigNumber.from(1_401));
		});

		it("should revert if less than 0.025 ETH is sent after 1000 public mints", async() => {
			const [owner, otherAccount0, otherAccount1] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			let totalSupply = await contract.totalSupply();
			for (let i = 1; i <= 1_000; i++) {
				await contract.connect(otherAccount0).mint();
				await contract.connect(otherAccount0).transferFrom(otherAccount0.address, owner.address, totalSupply);
				totalSupply = totalSupply.add(1n);
			}
			const unusedWallet = otherAccount1;
			expect(await contract.totalSupply()).to.equal(BigNumber.from(1_400));
			await expect(contract.connect(unusedWallet).mint({
				value: hre.ethers.utils.parseEther("0.024"),
			})).to.be.revertedWith("Please send at least 0.025 ETH to mint!");
		});
	});
});