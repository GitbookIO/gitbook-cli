var Q = require("q");
var fs = require('fs-extra');
var path = require("path");
var _ = require("lodash");
var npmi = require("npmi");
var tmp = require("tmp");

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

// Install a specific version of gitbook
function installVersion(version, forceInstall) {
	return Q.nfcall(tmp.dir.bind(tmp))
	.then(function(tmpDir) {
		var options = {
		    name: 'gitbook',
		    version: version,
		    path: tmpDir,
		    forceInstall: !!forceInstall,
		    npmLoad: {
		        loglevel: 'silent',
		        loaded: false,
		        prefix: tmpDir
		    }
		};
		console.log("Installing version", version);
		return Q.nfcall(npmi.bind(npmi), options).thenResolve(tmpDir);
	})
	.then(function(tmpDir) {
		var gitbookRoot = path.resolve(tmpDir, "node_modules/gitbook");
		var packageJson = fs.readJsonSync(path.resolve(gitbookRoot, "package.json"));
		var version = packageJson.version;

		var outputFolder = path.resolve(config.VERSIONS_ROOT, version);

		// Copy to the install folder
		return Q.nfcall(fs.copy.bind(fs), gitbookRoot, outputFolder)
		.thenResolve(version);
	});

}

// Uninstall a specific version of gitbook
function uninstallVersion(version) {
	if (!version) return Q.reject(new Error("Need a version of gitbook to uninstall"));
	var outputFolder = path.resolve(config.VERSIONS_ROOT, version);

	return Q.nfcall(fs.remove.bind(fs), outputFolder);

}

module.exports = {
	list: listVersion,
	require: requireVersion,
	install: installVersion,
	uninstall: uninstallVersion
};
