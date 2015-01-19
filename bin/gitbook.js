#! /usr/bin/env node

var _ = require("lodash");
var program = require('commander');

var pkg = require("../package.json");
var config = require("../lib/config");
var versions = require("../lib/versions");

// Init gitbook-cli
config.init();

program
	.version(pkg.version)
 	.option('-v, --gitbook', 'Specify GitBook version to use');

program.on('--help', function(){
	console.log('  Versions Installed:');
	console.log('');
	console.log('    ', _.pluck(versions.list(), "version").join(", "));
	console.log('');
});

// Parse and fallback to help if no args
if(_.isEmpty(program.parse(process.argv).args) && process.argv.length === 2) {
    program.help();
}
