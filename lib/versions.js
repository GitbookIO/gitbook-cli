var fs = require("fs");
var path = require("path");
var _ = require("lodash");

var config = require("./config");

// Return a list of all versions
function listVersion() {
	var folders = fs.readdirSync(config.VERSIONS_ROOT);
	return _.chain(folders)
	.map(function(version) {
		return {
			version: version,
			path: path.resolve(config.VERSIONS_ROOT, version)
		};
	})
	.concat([
		{
			version: require("gitbook/package.json").version,
			path: require.resolve("gitbook")
		}
	])
	.value();
};

module.exports = {
	list: listVersion
};
