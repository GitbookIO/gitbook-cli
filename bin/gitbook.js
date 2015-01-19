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
 	.option('-v, --gitbook [version]', 'specify GitBook version to use');

program
	.command('help')
	.description('list commands for a specific version of gitbook')
	.action(function(){
		var gitbook = versions.require(program.gitbook);
		if (!gitbook) {
			console.log("Version", program.gitbook, "not found");
			process.exit(1);
		}

		_.each(gitbook.commands, function(command) {
			console.log('    ', command.name, '    ', command.description);
		});
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
