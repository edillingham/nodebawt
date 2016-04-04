var config = require('./nb-config.js');
var util = require('util');
var irc = require('irc');

var client = new irc.Client(config.connection.server, config.connection.nick, {
    debug: config.debug,
    autoConnect: false,     // otherwise the connection happens too fast to register with nickserv
});

// extend the client object so we can keep track of what channels we're on
client.channels = [];

// extend to handle unsupported events
// add support for the "authenticated" event
client.addListener('raw', function (message) {
    if (message.rawCommand == '396') { this.emit('authenticated'); }

}).addListener('error', function (message) {
    console.log('error: ', message);

}).addListener('registered', function () {
    if(config.connection.password)
        this.say('NickServ', util.format('IDENTIFY %s', config.connection.password));

}).addListener('authenticated', function () {
    // autojoin channels
    config.autojoin.forEach((channel) => { 
        this.join(channel, () => { this.channels.push(channel); }); 
    });

});

client.connect(function() {
    initCommandLine();
});

function initCommandLine() {
    var ircCommands = require('./command');

    ////////// CLI //////////
    var process = require('process');
    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: function (line) {
            var completions = ircCommands.commands;
            var hits = completions.filter(function (c) { return c.indexOf(line) == 0 })
            // show all completions if none found
            return [hits.length ? hits : completions, line];
        }
    });

    rl.setPrompt(util.format('%s> ', config.connection.nick));
    rl.prompt();

    rl.on('line', function (line) {
        if(line == 'quit') {
            rl.close();
        } else {
            console.log(ircCommands.process(client, line));
        }
        rl.prompt();

    }).on('close', function () {
        process.exit(0);
    });
}