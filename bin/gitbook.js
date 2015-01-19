#! /usr/bin/env node

var _ = require("lodash");
var program = require('commander');
var parsedArgv = require('optimist').argv;

var pkg = require("../package.json");
var config = require("../lib/config");
var versions = require("../lib/versions");

function getGitBook() {
	var gitbook = versions.require(program.gitbook);
	if (!gitbook) {
		console.log("Version", program.gitbook, "not found");
		process.exit(1);
	}
	if (!gitbook.commands) {
		console.log("Version", program.gitbook, "is invalid");
		process.exit(1);
	}
	return gitbook;
};


// Init gitbook-cli
config.init();

program
	.version(pkg.version)
 	.option('-v, --gitbook [version]', 'specify GitBook version to use')
 	.option('-d, --debug', 'enable verbose error');

program
	.command('help')
	.description('list commands for a specific version of gitbook')
	.action(function(){
		var gitbook = getGitBook();

		_.each(gitbook.commands, function(command) {
			console.log('    ', command.name, '    ', command.description);
		});
	});

program
	.command('*')
	.description('run a command with a specific gitbook version')
	.action(function(commandName){
		var args = parsedArgv._.slice(1);
		var kwargs = _.omit(parsedArgv, '$0', '_');

		var gitbook = getGitBook();
		var command = _.find(gitbook.commands, {'name': commandName});
		if (!command) {
			console.log("Command", commandName, "doesn't exist");
			process.exit(1);
		}

		command.exec(args, kwargs)
		.fail(function(err) {
			console.log(err.message || err);
			if (program.debug) console.log(err.stack || "");
			process.exit(1);
		});
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
