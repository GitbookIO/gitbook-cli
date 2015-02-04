var Q = require("q");
var fs = require('fs-extra');
var path = require("path");
var semver = require("semver");
var _ = require("lodash");
var npmi = require("npmi");
var npm = require("npm");
var tmp = require("tmp");
var color = require('bash-color');
var parsedArgv = require('optimist').argv;

var config = require("./config");

// Init NPM
var initNPM = _.memoize(function() {
	return Q.nfcall(npm.load, { silent: true, loglevel: 'silent' });
});

// Check if a version is valid for gitbook-cli
function checkVersion(version) {
	return semver.satisfies(version, config.GITBOOK_VERSION);
}

// Sort versions
function sortVersion(a, b) {
	if (semver.gt(a, b)) {
		return -1;
	}
	if (semver.lt(a, b)) {
		return 1;
	}
	return 0;
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
		return sortVersion(a.version, b.version);
	})
	.value();
}

// Return a list of versions available in the registry
function availableVersions() {
	return initNPM()
	.then(function() {
		return Q.nfcall(npm.commands.view, ["gitbook@*", "version", "dist-tags"], true);
	})
	.then(function(versions) {
		versions = _.filter(versions, function(v) {
			return checkVersion(v.version);
		});
		if (versions.length == 0) throw "No valid version on the NPM registry";

		return {
			versions: _.chain(versions)
				.pluck("version")
				.sort(sortVersion)
				.value(),
			tags: _.chain(versions)
				.pluck("dist-tags")
				.first()
				.omit(function(tagVersion, tagName) {
					return !checkVersion(tagVersion);
				})
				.value()
		};
	});
}

// Resolve a version name or tag to an installable version number
function resolveVersion(version) {
	var _version = version;

	return availableVersions()
	.then(function(available) {
		// Resolve if tag
		if (available.tags[version]) version = available.tags[version];

		version = _.find(available.versions, function(v) {
			return semver.satisfies(v, version);
		});

		// Check version
		if (!version) throw "Invalid version or tag '"+_version+"', see available using 'gitbook versions:available'";
		return version;
	});
}

// Resolve a version locally
function resolveVersionLocally(version) {
	var versions = listVersions();
	version = _.chain(versions)
		.pluck("version")
		.find(function(v) {
			return semver.satisfies(v, version);
		})
		.value();

	if (!version) return Q.reject(new Error("Version not found locally: "+version));
	return Q(version);
}

// Require a specific version of gitbook (or the default one)
function requireVersion(version) {
	var versions = listVersions();
	version = _.find(versions, function(gb) {
		return semver.satisfies(gb.version, version);
	});
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
	return resolveVersion(version)
	.then(function(_version) {
		version = _version;
		return Q.nfcall(tmp.dir.bind(tmp));
	})
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

// Return a specific version, install it if needed
function getCurrentVersion(version, doInstall) {
	return Q()

	// If not defined, load version required from book.json
	.then(function() {
		if (version) return;
		try {
			var bookRoot = parsedArgv._[1] || process.cwd();
			var bookJson = require(path.resolve(bookRoot, "book"));
			version = bookJson.gitbook;
		} catch (e) {}
	})

	// Resolve version locally
	.then(function() {
		version = version || "*";
		return resolveVersionLocally(version)
	})

	// Install if needed
	.fail(function(err) {
		if (doInstall == false) throw err;

		return installVersion(version)
		.then(function() {
			return getCurrentVersion(version, false)
		});
	});
}

// Return the gitbook associated with the current version
function getVersion(version) {
	return getCurrentVersion(version)
	.then(function(resolved) {
		var gitbook = requireVersion(resolved);
		if (!gitbook) throw "Version "+resolved+" is corrupted";
		return gitbook;
	});
}

// Link a flder to a version
function linkVersion(version, folder) {
	if (!version) return Q.reject(new Error("Need a version to represent this folder"));
	if (!folder) return Q.reject(new Error("Need a folder"));
	var outputFolder = path.resolve(config.VERSIONS_ROOT, version);

	return Q.nfcall(fs.symlink.bind(fs), folder, outputFolder);
}

module.exports = {
	get: getVersion,
	current: getCurrentVersion,
	list: listVersions,
	require: requireVersion,
	install: installVersion,
	uninstall: uninstallVersion,
	available: availableVersions,
	link: linkVersion
};
