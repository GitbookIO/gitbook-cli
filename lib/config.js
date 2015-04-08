var path = require("path");
var fs = require('fs-extra');
var userHome = require("user-home");

var CONFIG_ROOT = path.resolve(userHome, ".gitbook");
var VERSIONS_ROOT = path.resolve(CONFIG_ROOT, "versions");

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
