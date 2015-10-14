var Q = require("q");
var fs = require('fs-extra');
var path = require("path");
var _ = require("lodash");
var npmi = require("npmi");
var npm = require("npm");
var tmp = require("tmp");
var color = require('bash-color');
var parsedArgv = require('optimist').argv;

var config = require("./config");
var tags = require("./tags");

// Init NPM
var initNPM = _.memoize(function() {
    return Q.nfcall(npm.load, {
        silent: true,
        loglevel: 'silent'
    });
});

// Return a list of all versions
function listVersions() {
    var folders = fs.readdirSync(config.VERSIONS_ROOT);
    var latest = null;

    return _.chain(folders)
    .map(function(tag) {
        if (!tags.isValid(tag)) return null;

        var versionFolder = path.resolve(config.VERSIONS_ROOT, tag);
        var stat = fs.lstatSync(versionFolder);
        var pkg;

        try {
            pkg = require(path.resolve(versionFolder, 'package.json'));
        } catch(e) {
            return null;
        }

        // Valid gitbook version?
        if (pkg.name != 'gitbook') return null;

        return {
            tag: tag,
            version: pkg.version,
            path: versionFolder,
            link: stat.isSymbolicLink()? fs.readlinkSync(versionFolder) : null,
            releaseTag: tags.isTag(tag)? tag : tags.getTag(pkg.version)
        };
    })
    .compact()
    .sort(function(a, b) {
        return tags.sort(a.tag, b.tag);
    })
    .map(function(v) {
        if (v.releaseTag == 'latest' && !latest) {
            latest = true;
            v.latest = true;
        } else {
            v.latest = false;
        }

        return v;
    })
    .value();
}

// Return a list of versions available in the registry
function availableVersions() {
    return initNPM()
    .then(function() {
        return Q.nfcall(npm.commands.view, ["gitbook", "versions", "dist-tags"], true);
    })
    .then(function(result) {
        result = _.chain(result).values().first().value();
        result = {
            versions: _.chain(result.versions)
                .filter(function(v) {
                    return tags.isValid(v);
                })
                .sort(tags.sort)
                .value(),
            tags: _.chain(result['dist-tags'])
                .omit(function(tagVersion, tagName) {
                    return !tags.isValid(tagVersion);
                })
                .value()
        };

        if (result.versions.length == 0) throw new Error("No valid version on the NPM registry");
        return result;
    });
}

// Resolve a version name or tag to an installable version number
function resolveRemoteVersion(version) {
    var _version = version;

    return availableVersions()
    .then(function(available) {
        // Resolve if tag
        if (available.tags[version]) version = available.tags[version];

        version = _.find(available.versions, function(v) {
            return tags.satisfies(v, version, {
                // Tag is resolved from npm dist-tags
                acceptTagCondition: false
            });
        });

        // Check version
        if (!version) throw "Invalid version or tag '"+_version+"', see available using 'gitbook versions:available'";
        return version;
    });
}

// Resolve a version locally
function resolveVersionLocally(version) {
    var versions = listVersions();
    var _version = _.chain(versions)
        .find(function(v) {
            return tags.satisfies(v.tag, version);
        })
        .value();

    if (!_version) return Q.reject(new Error("Version not found locally: "+version));
    return Q(_version);
}

// Install a specific version of gitbook
function installVersion(version, forceInstall) {
    return resolveRemoteVersion(version)
    .then(function(_version) {
        version = _version;
        return Q.nfcall(tmp.dir.bind(tmp));
    })
    .spread(function(tmpDir) {
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
        console.log("Installing GitBook", version);
        return Q.nfcall(npmi.bind(npmi), options).thenResolve(tmpDir);
    })
    .then(function(tmpDir) {
        var gitbookRoot = path.resolve(tmpDir, "node_modules/gitbook");
        var packageJson = fs.readJsonSync(path.resolve(gitbookRoot, "package.json"));
        var version = packageJson.version;

        var outputFolder = path.resolve(config.VERSIONS_ROOT, version);

        if (!tags.isValid(version)) throw "Invalid GitBook version, should satisfies "+config.GITBOOK_VERSION;

        // Copy to the install folder
        return Q.nfcall(fs.copy.bind(fs), gitbookRoot, outputFolder)
        .thenResolve(version);
    });

}

// Uninstall a specific version of gitbook
function uninstallVersion(version) {
    if (!version) return Q.reject(new Error("Need a version of GitBook to uninstall"));
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
        var gitbook;

        try {
            gitbook = require(resolved.path);
        } catch (err) {
            console.log(color.red("Error loading version "+resolved.tag+": "+(err.stack || err.message || err)));
            return null;
        }

        if (!gitbook) throw "GitBook Version "+resolved.tag+" is corrupted";
        return gitbook;
    });
}

// Link a folder to a version
function linkVersion(version, folder) {
    if (!version) return Q.reject(new Error("Need a version to represent this folder"));
    if (!folder) return Q.reject(new Error("Need a folder"));
    var outputFolder = path.resolve(config.VERSIONS_ROOT, version);

    return Q.nfcall(fs.symlink.bind(fs), folder, outputFolder);
}

// Update current version
// Check that a newer version exists
// Install it
// Remove previous version
function updateVersion(tag) {
    tag = tag || 'latest';

    return getCurrentVersion(null, false)
    .fail(function(err) {
        return Q(null);
    })
    .then(function(currentV) {
        return availableVersions()
        .then(function(result) {
            var remoteVersion = result.tags[tag];
            if (!remoteVersion) throw new Error('Invalid tag: '+tag);

            if (currentV && tags.sort(remoteVersion, currentV.version) >= 0) return null;

            return installVersion(remoteVersion)
            .then(function() {
                if (!currentV) return;
                return uninstallVersion(currentV.tag);
            })
            .thenResolve(remoteVersion);
        });
    });
}

module.exports = {
    get: getVersion,
    current: getCurrentVersion,
    list: listVersions,
    install: installVersion,
    uninstall: uninstallVersion,
    available: availableVersions,
    link: linkVersion,
    update: updateVersion
};
