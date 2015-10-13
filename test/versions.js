var path = require('path');
var should = require('should');

var versions = require('../lib/versions');



describe('Versions', function() {
    this.timeout(50000);

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

    describe('versions.current()', function() {
        it('should correctly return installed version', function() {
            return versions.current()
            .then(function(v) {
                v.should.have.properties('version', 'path');
                v.version.should.equal('2.0.0');
            });
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
        var localGitbook = path.resolve(__dirname, '../node_modules/gitbook');

        before(function() {
            return versions.link('latest', localGitbook);
        });

        it('should correctly list latest version', function() {
            var result = versions.list();
            result.should.have.lengthOf(2);
            result[0].should.have.properties('version', 'path');
            result[0].tag.should.equal('latest');
            result[0].link.should.equal(localGitbook);
        });

        it('should correctly return latest version as default one', function() {
            return versions.current()
            .then(function(version) {
                version.tag.should.equal('latest');
            });
        });
    });

    describe('versions.get()', function() {
        it('should correctly return gitbook instance', function() {
            return versions.get()
            .then(function(gitbook) {
                gitbook.should.be.an.Object();
                gitbook.should.have.properties('commands');
                gitbook.commands.should.be.an.Array();
            });
        });
    });

    describe('versions.uninstall()', function() {
        it('should correctly remove a specific version', function() {
            return versions.uninstall('2.0.0')
            .then(function() {
                var result = versions.list();
                result.should.have.lengthOf(1);
            });
        });

        it('should correctly remove a version by tag', function() {
            return versions.uninstall('latest')
            .then(function() {
                var result = versions.list();
                result.should.have.lengthOf(0);
            });
        });
    });
});
