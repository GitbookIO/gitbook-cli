var _ = require('lodash');
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
});
