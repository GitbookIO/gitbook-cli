var _ = require("lodash");

var help = function(commands) {
    _.each(commands, function(command) {
        console.log('  '+command.name, '\t', command.description);
        _.each(command.options || [], function(option) {
            var after = [];

            if (option.defaults !== undefined) after.push("Default is "+option.defaults);
            if (option.values) after.push("Values are "+option.values.join(", "));

            if (after.length > 0) after = "("+after.join("; ")+")";
            else after = "";

            console.log('    --'+option.name, '\t', option.description, after);
        });
        console.log('');
    });
};

var exec = function(commands, command, args, kwargs) {
    var cmd = _.find(commands, function(_cmd) {
        return _.first(_cmd.name.split(" ")) == command;
    });

    // Command not found
    if (!cmd) throw "Command "+command+" doesn't exist, run 'gitbook help' to list commands.";

    // Apply defaults
    _.each(cmd.options || [], function(option) {
        kwargs[option.name] = (kwargs[option.name] === undefined)? option.defaults : kwargs[option.name];
        if (option.values && !_.contains(option.values, kwargs[option.name])) throw "Invalid value for option '"+option.name+"'";
    });

    return cmd.exec(args, kwargs);
};

module.exports = {
    help: help,
    exec: exec
};
