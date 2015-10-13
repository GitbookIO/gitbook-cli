var should = require('should');
var tags = require('../lib/tags');

describe('Tags', function() {

    describe('tags.isValid()', function() {
        it('should return true for version >= 2.0.0', function() {
            tags.isValid('2.0.0').should.be.ok()
        });

        it('should return true for pre-releases', function() {
            tags.isValid('2.0.0-beta.0').should.be.ok()
        });
    });

});
