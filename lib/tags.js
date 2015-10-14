var _ = require("lodash");
var semver = require('semver');
var config = require('./config');

var ALLOWED_TAGS = ['latest', 'beta', 'alpha'];

// Check if a version is a tag
function isTag(version) {
    return _.contains(ALLOWED_TAGS, version);
}

// Check if a version is valid for gitbook-cli
function isValid(version) {
    if (isTag(version)) return true;

    var versionWithoutPre = version.replace(/\-(\S+)/g, '');

    try {
        return semver.satisfies(versionWithoutPre, config.GITBOOK_VERSION);
    } catch(e) {
        return false;
    }
}

// Extract tag for a version
function getTag(version) {
    if (isTag(version)) return version;

    var v = semver.parse(version);
    return v.prerelease[0] || 'latest';
}

// Sort tags
function sortTags(a, b) {
    if (isTag(a) && isTag(b)) {
        var indexA = ALLOWED_TAGS.indexOf(a);
        var indexB = ALLOWED_TAGS.indexOf(b);

        if (indexA > indexB) return -1;
        if (indexB > indexA) return 1;

        return 0;
    }
    if (isTag(a)) return -1;
    if (isTag(b)) return 1;

    if (semver.gt(a, b)) {
        return -1;
    }
    if (semver.lt(a, b)) {
        return 1;
    }
    return 0;
}

// Test that a tag satisfies a condition
function satisfies(version, condition, opts) {
    opts = _.defaults(opts || {}, {
        acceptTagCondition: true
    });

    if (isTag(version)) {
        return (condition == '*' || version == condition);
    }

    // Condition is a tag ('beta', 'latest')
    if (opts.acceptTagCondition) {
        var tag = getTag(version);
        if (tag == condition) return true;
    }

    return semver.satisfies(version, condition);
}

module.exports = {
    isTag: isTag,
    isValid: isValid,
    sort: sortTags,
    satisfies: satisfies,
    getTag: getTag
};
