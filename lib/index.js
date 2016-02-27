var Q = require('q');
var _ = require('lodash');

var config = require('./config');
var local = require('./local');
var registry = require('./registry');

// Ensure that a version exists
// or install it
function ensureVersion(bookRoot, version, opts) {
    opts = _.defaults(opts || {}, {
        install: true
    });

    return Q()

    // If not defined, load version required from book.json
    .then(function() {
        if (version) return;
        try {
            var bookJson = require(path.resolve(bookRoot, 'book'));
            version = bookJson.gitbook;
        } catch (e) {}
    })

    // Resolve version locally
    .then(function() {
        version = version || '*';
        return local.resolve(version)
    })

    // Install if needed
    .fail(function(err) {
        if (opts.install == false) throw err;

        return registry.install(version)
        .then(function() {
            return ensureVersion(bookRoot, version, {
                install: false
            });
        });
    });
}

// Ensure a version exists (or install it)
// Then load it and returns the gitbook instance
function ensureAndLoad(bookRoot, version, opts) {
    return ensureVersion(bookRoot, version, opts)
    .then(function(version) {
        return local.load(version);
    });
}

// Update current version
//   -> Check that a newer version exists
//   -> Install it
//   -> Remove previous version
function updateVersion(tag) {
    tag = tag || 'latest';

    return local.current(null, {
        install: false
    })
    .fail(function(err) {
        return Q(null);
    })
    .then(function(currentV) {
        return registry.versions()
        .then(function(result) {
            var remoteVersion = result.tags[tag];
            if (!remoteVersion) throw new Error('Tag doesn\'t exist: '+tag);

            if (currentV && tags.sort(remoteVersion, currentV.version) >= 0) return null;

            return registry.install(remoteVersion)
            .then(function() {
                if (!currentV) return;
                return local.remove(currentV.tag);
            })
            .thenResolve(remoteVersion);
        });
    });
}

module.exports = {
    init: config.init,
    setRoot: config.setRoot,

    load: local.load,
    ensure: ensureVersion,
    ensureAndLoad: ensureAndLoad,
    uninstall: local.remove,
    link: local.link,
    versions: local.versions,

    update: updateVersion,

    install: registry.install,
    available: registry.versions
};
