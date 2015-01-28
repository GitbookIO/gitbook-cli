var Q = require("q");
var fs = require('fs-extra');
var path = require("path");
var semver = require("semver");
var _ = require("lodash");
var npmi = require("npmi");
var tmp = require("tmp");
var color = require('bash-color');
var parsedArgv = require('optimist').argv;

var config = require("./config");

// Check version
function checkVersion(version) {
	return semver.satisfies(version, config.GITBOOK_VERSION);
}

// Return a list of all versions
function listVersions() {
	var folders = fs.readdirSync(config.VERSIONS_ROOT);
	return _.chain(folders)
	.map(function(version) {
		return {
			version: version,
			path: path.resolve(config.VERSIONS_ROOT, version)
		};
	})
	.filter(function(gb) {
		return checkVersion(gb.version);
	})
	.sort(function(a, b) {
		if (semver.gt(a.version, b.version)) {
			return 1;
		}
		if (semver.lt(a.version, b.version)) {
			return -1;
		}
		return 0;
	})
	.value();
}

// Require a specific version of gitbook (or the default one)
function requireVersion(version) {
	var versions = listVersions();
	version = version? _.find(versions, { version: version }) : _.last(versions);
	if (!version) return null;
	try {
		return require(version.path);
	} catch (err) {
		console.log(color.red("Error loading version "+version.version+": "+(err.stack || err.message || err)));
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

		if (!checkVersion(version)) throw "Invalid gitbook version, should satisfies "+config.GITBOOK_VERSION;

		// Copy to the install folder
		return Q.nfcall(fs.copy.bind(fs), gitbookRoot, outputFolder)
		.thenResolve(version);
	});

}

// Uninstall a specific version of gitbook
function uninstallVersion(version) {
	if (!version) return Q.reject(new Error("Need a version of gitbook to uninstall"));
	var outputFolder = path.resolve(config.VERSIONS_ROOT, version);

	return Q.nfcall(fs.lstat.bind(fs), outputFolder)
	.then(function(stat) {
		if (stat.isSymbolicLink()) {
			return Q.nfcall(fs.unlink.bind(fs), outputFolder);
		}
		return Q.nfcall(fs.remove.bind(fs), outputFolder);
	});
}

// Return a specific version
function getVersion(version, doInstall) {
	var versions, realVersion, gitbook = null;

	versions = _.pluck(listVersions());

	if (!version) {
		try {
			var bookRoot = parsedArgv._[1] || process.cwd();
			var bookJson = require(path.resolve(bookRoot, "book"));
			version = bookJson.gitbook;
		} catch (e) {}
	}

	version = version || "latest";
	realVersion = version;

	if (version == "latest") {
		realVersion = _.last(versions).version;
	}

	// test loading gitbook
	if (realVersion) {
		gitbook = requireVersion(realVersion);
		if (gitbook) return Q(gitbook);
	}

	// don't install
	if (doInstall == false) return Q.reject("Invalid version of gitbook: "+version);

	return installVersion(version)
	.then(function() {
		return getVersion(version)
	});
};

// Link a flder to a version
function linkVersion(version, folder) {
	if (!version) return Q.reject(new Error("Need a version to represent this folder"));
	if (!folder) return Q.reject(new Error("Need a folder"));
	var outputFolder = path.resolve(config.VERSIONS_ROOT, version);

	return Q.nfcall(fs.symlink.bind(fs), folder, outputFolder);
};

module.exports = {
	get: getVersion,
	list: listVersions,
	require: requireVersion,
	install: installVersion,
	uninstall: uninstallVersion,
	link: linkVersion
};
