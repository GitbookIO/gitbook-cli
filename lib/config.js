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
