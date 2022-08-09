// @ts-ignore
const fs = require('fs');
// @ts-ignore
const { generateDirectories } = require('./generateDirectories.ts');

const baseImageUrl = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/base.png";
const cursedImageUrl = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/cursed.png";
const immuneImageUrl = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/immune.png";
const deadImageUrl = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/dead.png";
const godImageUrl = "https://ultrasupahotfire.mypinata.cloud/ipfs/QmQmeueFQD68XDRqx1537jcdHrDQZx5VASGuB2WcbCQPfv/god.png";

const maxCats = 5555;

generateDirectories();

for (let i = 0; i < maxCats; i++) {
	const filePath = './'
}