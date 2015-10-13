var path = require('path');
var fs = require('fs-extra');
var config = require('../lib/config');

// Use tmp folder for testing
before(function() {
    var gitbookFolder = path.resolve(__dirname, '../.tmp');
    fs.removeSync(gitbookFolder);
    config.setRoot(gitbookFolder);
    config.init();
});
