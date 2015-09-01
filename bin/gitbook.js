#! /usr/bin/env node

var Q = require("q");
var _ = require("lodash");
var path = require("path");
var program = require('commander');
var parsedArgv = require('optimist').argv;
var color = require('bash-color');

var pkg = require("../package.json");
var config = require("../lib/config");
var versions = require("../lib/versions");
var commands = require("../lib/commands");

function runPromise(p) {
    return p
    .then(function() {
        process.exit(0);
    }, function(err) {
        console.log("");
        console.log(color.red(err.toString()));
        if (program.debug || process.env.DEBUG) console.log(err.stack || "");
        process.exit(1);
    });
}


// Init gitbook-cli
config.init();

program
    .version(pkg.version)
    .option('-v, --gitbook [version]', 'specify GitBook version to use')
    .option('-d, --debug', 'enable verbose error');


program
    .command('versions')
    .description('list installed versions')
    .action(function(){
        var _versions = versions.list();

        if (_versions.length > 0) {
            console.log('GitBook Versions Installed:');
            console.log('');
            console.log('    ', _.pluck(_versions, "version").join(", "));
            console.log('');
        } else {
            console.log('There is no versions installed');
            console.log('You can instal the latest version using: "gitbook versions:install latest"');
        }
    });

program
    .command('versions:print')
    .description('print current version to use in the current directory')
    .action(function(){
        runPromise(
            versions.current(program.gitbook)
            .then(function(v) {
                console.log("GitBook version is", v);
            })
        );
    });

program
    .command('versions:available')
    .description('list available versions on NPM')
    .action(function(){
        runPromise(
            versions.available()
            .then(function(available) {
                console.log('Available GitBook Versions:');
                console.log('');
                console.log('    ', available.versions.join(", "));
                console.log('');
                console.log('Tags:');
                console.log('');
                _.each(available.tags, function(version, tagName) {
                    console.log('    ', tagName, ":", version);
                });
                console.log('');
            })
        );
    });

program
    .command('versions:install [version]')
    .description('force install a specific version of gitbook')
    .action(function(version){
        version = version || "*";

        runPromise(
            versions.install(version)
            .then(function(installedVersion) {
                console.log("");
                console.log(color.green("GitBook "+installedVersion+" has been installed"));
            })
        );
    });

program
    .command('versions:link [version] [folder]')
    .description('link a version to a local folder')
    .action(function(version, folder) {
        folder = path.resolve(folder || process.cwd());

        runPromise(
            versions.link(version, folder)
            .then(function() {
                console.log("");
                console.log(color.green("GitBook "+version+" point to "+folder));
            })
        );
    });

program
    .command('versions:uninstall [version]')
    .description('uninstall a specific version of gitbook')
    .action(function(version){
        runPromise(
            versions.uninstall(version)
            .then(function() {
                console.log("");
                console.log(color.green("GitBook "+version+" has been uninstalled"));
            })
        );
    });

program
    .command('help')
    .description('list commands for a specific version of gitbook')
    .action(function(){
        runPromise(
            versions.get(program.gitbook)
            .get("commands")
            .then(commands.help)
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
                return commands.exec(gitbook.commands, commandName, args, kwargs);
            })
        );
    });

// Parse and fallback to help if no args
if(_.isEmpty(program.parse(process.argv).args) && process.argv.length === 2) {
    program.help();
}
