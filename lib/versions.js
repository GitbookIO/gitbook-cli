var fs = require("fs");
var config = require("./config");

function listVersion() {
	var folders = fs.readdirSync(config.VERSIONS_ROOT);
	console.log(folders);

	return folders;
};

