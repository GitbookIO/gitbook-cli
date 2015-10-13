var path = require('path');
var should = require('should');

var versions = require('../lib/versions');

describe('Versions', function() {

    describe('versions.available()', function() {
        var result;

        before(function() {
            return versions.available()
            .then(function(versions) {
                result = versions;
            });
        });

        it('should correctly return a list of versions', function() {
            result.should.have.properties('versions');
            result.versions.should.be.an.Array();
        });

        it('should correctly return a map of tags', function() {
            result.should.have.properties('tags');
            result.tags.should.have.properties('latest');
        });
    });

    describe('versions.install()', function() {
        this.timeout(50000);
        var result;

        before(function() {
            return versions.install('2.0.0')
            .then(function(version) {
                result = version;
            });
        });

        it('should correctly return the installed version', function() {
            result.should.be.a.String();
            result.should.equal('2.0.0');
        });
    });

    describe('versions.list()', function() {
        var result;

        before(function() {
            result = versions.list();
        });

        it('should correctly return the installed version', function() {
            result.should.be.an.Array();
            result.should.have.lengthOf(1);
            result[0].should.have.properties('version', 'path');
            result[0].version.should.equal('2.0.0');
        });
    });

    describe('versions.link()', function() {
        this.timeout(50000);
        var localGitbook = path.resolve(__dirname, '../node_modules/gitbook');

        before(function() {
            return versions.link('latest', localGitbook);
        });

        it('should correctly list latest version', function() {
            var result = versions.list();
            result.should.have.lengthOf(2);
            result[0].should.have.properties('version', 'path');
            result[0].version.should.equal('latest');
            result[0].link.should.equal(localGitbook);
        });
    });

    describe('versions.uninstall()', function() {
        this.timeout(50000);

        before(function() {
            return versions.uninstall('2.0.0');
        });

        it('should correctly remove the version', function() {
            var result = versions.list();
            result.should.have.lengthOf(0);
        });
    });
});
