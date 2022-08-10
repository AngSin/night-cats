// @ts-ignore
const fs = require('fs');
// @ts-ignore
const { generateDirectories } = require('./generateDirectories.ts');

const state = process.argv[2];

const imageUrls = {
	baseImageUrl: "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/base.png",
	cursedImageUrl: "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/cursed.png",
	immuneImageUrl: "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/immune.png",
	deadImageUrl: "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/dead.png",
	godImageUrl: "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/god.png",
};


const maxCats = 5555;

generateDirectories();

for (let i = 0; i < maxCats; i++) {
	const filePath = `../metadata/${state}/`;
	const metadataObj = {
		name: `NightCat ${i}`,
		// @ts-ignore
		image: imageUrls[`${state}ImageUrl`],
	};
	fs.writeFileSync(`${filePath}${i}`, JSON.stringify(metadataObj));
}