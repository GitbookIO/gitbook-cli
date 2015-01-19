var path = require("path");
var mkdirp = require('mkdirp');

var CONFIG_ROOT = path.resolve(getUserHome(), ".gitbook");
var VERSIONS_ROOT = path.resolve(CONFIG_ROOT, "versions");

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function init() {
	mkdirp.sync(CONFIG_ROOT);
	mkdirp.sync(VERSIONS_ROOT);
}

module.exports = {
	init: init,

	ROOT: CONFIG_ROOT,
	VERSIONS_ROOT: VERSIONS_ROOT
};
