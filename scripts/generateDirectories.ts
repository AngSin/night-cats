// @ts-ignore
const fs = require('fs');

const dir = '../metadata';
const baseDir = '../metadata/base';
const cursedDir = '../metadata/cursed';
const immuneDir = '../metadata/immune';
const deadDir = '../metadata/dead';
const godDir = '../metadata/god';

// @ts-ignore
const generateDirectories = () => {
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}

	if (!fs.existsSync(baseDir)){
		fs.mkdirSync(baseDir);
	}

	if (!fs.existsSync(cursedDir)){
		fs.mkdirSync(cursedDir);
	}

	if (!fs.existsSync(immuneDir)){
		fs.mkdirSync(immuneDir);
	}

	if (!fs.existsSync(deadDir)){
		fs.mkdirSync(deadDir);
	}

	if (!fs.existsSync(godDir)){
		fs.mkdirSync(godDir);
	}
};

module.exports = {
	generateDirectories,
};