#! /usr/bin/env node

var Q = require("q");
var _ = require("lodash");
var program = require('commander');
var parsedArgv = require('optimist').argv;

var pkg = require("../package.json");
var config = require("../lib/config");
var versions = require("../lib/versions");

function runPromise(p) {
	return p
	.then(function() {
		process.exit(0);
	}, function(err) {
		console.log("Error:", err.message || err);
		if (program.debug) console.log(err.stack || "");
		process.exit(1);
	});
}


// Init gitbook-cli
config.init();

program
	.version(pkg.version)
	.option('-v, --gitbook [version]', 'specify GitBook version to use', 'latest')
 	.option('-d, --debug', 'enable verbose error');

program
	.command('versions')
	.description('list installed versions')
	.action(function(){
		var _versions = versions.list();

		if (_versions.length > 0) {
			console.log('Versions Installed:');
			console.log('');
			console.log('    ', _.pluck(_versions, "version").join(", "));
			console.log('');
		} else {
			console.log('There is no versions installed');
			console.log('You can instal the latest version using: "gitbook install latest"');
		}
	});

program
	.command('install [version]')
	.description('force install a specific version of gitbook')
	.action(function(version){
		version = version || "latest";

		runPromise(
			versions.install(version)
			.then(function(installedVersion) {
				console.log("Version", installedVersion, "has been installed");
			})
		);
	});

program
	.command('uninstall [version]')
	.description('uninstall a specific version of gitbook')
	.action(function(version){
		runPromise(
			versions.uninstall(version)
			.then(function() {
				console.log("Version", version, "has been uninstalled");
			})
		);
	});

program
	.command('help')
	.description('list commands for a specific version of gitbook')
	.action(function(){
		runPromise(
			versions.get(program.gitbook)
			.then(function(gitbook) {
				_.each(gitbook.commands, function(command) {
					console.log('    ', command.name, '\t', command.description);
				});
			})
		);
	});

program
	.command('*')
	.description('run a command with a specific gitbook version')
	.action(function(commandName){
		var args = parsedArgv._.slice(1);
		var kwargs = _.omit(parsedArgv, '$0', '_');

		runPromise(
			versions.get(program.gitbook)
			.then(function(gitbook) {
				var command = _.find(gitbook.commands, {'name': commandName});
				if (!command) {
					throw "Command "+commandName+" doesn't exist";
				}

				return command.exec(args, kwargs);
			})
		);
	});

// Parse and fallback to help if no args
if(_.isEmpty(program.parse(process.argv).args) && process.argv.length === 2) {
    program.help();
}
