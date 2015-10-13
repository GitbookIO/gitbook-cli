var path = require('path');
var config = require('../lib/config');

// Use tmp folder for testing
config.setRoot(path.resolve(__dirname, 'gitbook'));
config.init();
