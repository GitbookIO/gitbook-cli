var path = require("path");
var fs = require('fs-extra');

var CONFIG_ROOT = path.resolve(getUserHome(), ".gitbook");
var VERSIONS_ROOT = path.resolve(CONFIG_ROOT, "versions");

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function init() {
	fs.mkdirsSync(CONFIG_ROOT);
	fs.mkdirsSync(VERSIONS_ROOT);
}

module.exports = {
	init: init,

	GITBOOK_VERSION: ">1.x.x",
	ROOT: CONFIG_ROOT,
	VERSIONS_ROOT: VERSIONS_ROOT
};
