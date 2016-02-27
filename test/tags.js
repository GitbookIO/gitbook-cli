var should = require('should');
var tags = require('../lib/tags');

describe('Tags', function() {
    describe('.isValid()', function() {
        it('should return true for version >= 2.0.0', function() {
            tags.isValid('2.0.0').should.be.ok()
        });

        it('should return true for pre-releases', function() {
            tags.isValid('2.0.0-beta.0').should.be.ok()
        });
    });

    describe('.satisfies()', function() {
        it('should return true for tag and *', function() {
            tags.satisfies('pre', '*').should.be.ok()
        });
    });
});
