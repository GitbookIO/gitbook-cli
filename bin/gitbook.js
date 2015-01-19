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
 	.option('-v, --gitbook', 'specify GitBook version to use');

program
	.command('help')
	.description('list commands for a specific version of gitbook')
	.action(function(){

	});

program
	.command('*')
	.description('run a command with a specific gitbook version')
	.action(function(env){

	});

program.on('--help', function(){
	var _versions = versions.list();

	console.log('  Versions Installed (default is '+_.last(_versions).version+'):');
	console.log('');
	console.log('    ', _.pluck(_versions, "version").join(", "));
	console.log('');
});

// Parse and fallback to help if no args
if(_.isEmpty(program.parse(process.argv).args) && process.argv.length === 2) {
    program.help();
}
