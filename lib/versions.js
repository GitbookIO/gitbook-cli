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
}

// Require a specific version of gitbook (or the default one)
function requireVersion(version) {
	var versions = listVersion();
	var version = version? _.find(versions, { version: version }) : _.last(versions);
	if (!version) return null;
	try {
		return require(version.path);
	} catch (e) {
		return null;
	}
}

module.exports = {
	list: listVersion,
	require: requireVersion
};
