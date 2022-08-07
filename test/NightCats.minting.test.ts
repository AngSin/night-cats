import { expect } from "chai";
import hre  from "hardhat";
import {BigNumber} from "ethers";

describe("NightCats", async() => {
	const deployContract = async () => {
		const NightCats = await hre.ethers.getContractFactory("NightCats");
		return await NightCats.deploy();
	}

	describe("openseaLink", () => {
		it("should only let owner change opensea link", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const contract = await deployContract()
			await expect(contract.connect(otherAccount).setOpenseaLink("https://looksrare.org"))
				.to.be.revertedWith("Ownable: caller is not the owner");
			await contract.setOpenseaLink("https://opensea.io/collection");
			expect(await contract.openseaLink()).to.equal("https://opensea.io/collection");
		});
	});

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
			await expect(contract.mint(1)).to.be.revertedWith("Public sale is not yet live!");
		});

		it("should revert if user already has some NightCats", async() => {
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			await expect(contract.mint(1)).to.be.revertedWith("You already have enough NightCats!");
		});

		it("should mint for free before 1000 public mints", async() => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			await contract.connect(otherAccount).mint(1);
			expect(await contract.totalSupply()).to.equal((await contract.reserveSupply()).add(1n));
		});

		it("should mint for 0.025 ETH after public mints", async() => {
			const [owner, otherAccount0, otherAccount1] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			await contract.setFreeMintSupply(1);
			await contract.connect(otherAccount0).mint(1);
			const unusedWallet = otherAccount1;
			expect(await contract.totalSupply()).to.equal(BigNumber.from(401));
			await contract.connect(unusedWallet).mint(1, {
				value: hre.ethers.utils.parseEther("0.025"),
			});
			expect(await contract.totalSupply()).to.equal(BigNumber.from(402));
			expect(contract.connect(otherAccount0).mint(1)).to.be.revertedWith("Please send at least 0.025 ETH per cat to mint!");
		});

		it("should mint multiple cats", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			expect(await contract.totalSupply()).to.equal(400);
			await contract.connect(otherAccount).mint(3);
			expect(await contract.totalSupply()).to.equal(403);
		});

		it("should not let users mint more than supply", async () => {
			const [_, otherAccount] = await hre.ethers.getSigners();
			const contract = await deployContract();
			await contract.mintReserve();
			await contract.setIsPublicSaleLive(true);
			await contract.setFreeMintSupply(1);
			await contract.setPaidMintSupply(0);
			expect(await contract.totalSupply()).to.equal(400);
			await contract.connect(otherAccount).mint(1);
			expect(await contract.totalSupply()).to.equal(401);
			await expect(contract.connect(otherAccount).mint(1)).to.be.revertedWith("You are trying to mint over the max limit!");
		});
	});
});