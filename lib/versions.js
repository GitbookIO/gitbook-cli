var fs = require("fs");
var path = require("path");
var _ = require("lodash");

var config = require("./config");

// Return a list of all versions
function listVersion() {
	var folders = fs.readdirSync(config.VERSIONS_ROOT);
	return _.map(folders, function(version) {
		return {
			version: version,
			path: path.resolve(config.VERSIONS_ROOT, version)
		};
	});
};

module.exports = {
	list: listVersion
};
