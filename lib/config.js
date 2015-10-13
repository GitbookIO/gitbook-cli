var path = require("path");
var fs = require('fs-extra');
var color = require('bash-color');
var userHome = require("user-home");

if (!userHome) {
    console.log(color.red("HOME directory needs to be defined"));
    process.exit(1);
}

var CONFIG_ROOT = path.resolve(userHome, ".gitbook");
var VERSIONS_ROOT = path.resolve(CONFIG_ROOT, "versions");


// Init and prepare configuration
function init() {
    fs.mkdirsSync(CONFIG_ROOT);
    fs.mkdirsSync(VERSIONS_ROOT);
}

// Extend configuration
function setRoot(root) {
    CONFIG_ROOT = path.resolve(root);
    VERSIONS_ROOT = path.resolve(CONFIG_ROOT, "versions");

    module.exports.ROOT = CONFIG_ROOT;
    module.exports.VERSIONS_ROOT = VERSIONS_ROOT;
}

module.exports = {
    init: init,
    setRoot: setRoot,

    GITBOOK_VERSION: ">1.x.x",
    ROOT: CONFIG_ROOT,
    VERSIONS_ROOT: VERSIONS_ROOT
};
