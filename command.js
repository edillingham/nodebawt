var util = require('util');
var commands = 'channels chat endchat join leave part say quit'.split(' ');
var chatTarget = null;

module.exports.commands = commands;

module.exports.process = function (client, commandLine) {
    var keyword = getFirstWord(commandLine);
    var target = getSecondWord(commandLine);

    if (chatTarget) {
        if (keyword == 'endchat') {
            var oldTarget = chatTarget;
            chatTarget = null;
            return util.format('ending conversation with %s.', oldTarget);
        }
        client.say(chatTarget, commandLine);
        return '';
    } else if (commandLine.length === 0) {
        return '';
    } else if (commands.indexOf(keyword) < 0) {
        return util.format('Unknown command: %s', keyword);
    }

    switch (keyword) {
        case "channels":
            return util.format('Currently on: %s', client.channels);
        // cases with a channel parameter
        case "join":
            if (!target)
                return 'no channel specified';
            else if (client.channels.indexOf(target) >= 0)
                return util.format('already in %s', target);

            client.join(target);
            client.channels.push(target);

            return util.format('joined %s', target);

        case "leave":
        case "part":
            var chanIdx = client.channels.indexOf(target);
            if (!target)
                return 'no channel specified';
            else if (chanIdx < 0)
                return util.format('not in %s', target);

            client.part(target);
            client.channels.splice(chanIdx, 1);

            return util.format('left %s', target);

        case "say":
            if (!target)
                return "missing target";

            var whatToSay = getRemainingArgs(keyword, target, commandLine);
            if (!whatToSay)
                return "nothing to say";

            client.say(target, whatToSay);
            return util.format("spoke to %s", target);

        case "chat":
            if (!chatTarget) {
                chatTarget = target;
            }
            return util.format('beginning conversation with %s. "endchat" to end.', chatTarget);
    }
}

var getFirstWord = function (str) {
    var idx = str.indexOf(' ');
    return (idx < 0) ? str : str.slice(0, idx);
}

var getSecondWord = function (str) {
    var first = getFirstWord(str);
    if (first.length == str.length)
        return null;    // there is no second word
    
    return getFirstWord(str.replace(first + ' ', ''));
}

var getRemainingArgs = function (one, two, str) {
    var prefix = util.format('%s %s', one, two);
    var out = str.replace(prefix, '').trim();

    return out === '' ? null : out;
}