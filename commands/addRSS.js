
const request = require('request')
const initializeRSS = require('../rss/initialize.js')

module.exports = function (bot, message) {
  var rssConfig = require('../config.json')
  if (rssConfig.sources[message.guild.id] == null) rssConfig.sources[message.guild.id] = []
  var rssList = rssConfig.sources[message.guild.id]

  function isCurrentChannel(channel) {
    if (isNaN(parseInt(channel,10))) {
      if (message.channel.name == channel) return true;
      else return false;
    }
    else {
      if (message.channel.id == channel) return true;
      else return false;
    }
  }

  let content = message.content.split(" ");
  if (content.length == 1) return;
  message.channel.startTyping()
  request(content[1], (error, response, body) => {

    if (!error && response.statusCode == 200){

      for (var x in rssList) {
        if ( rssList[x].link == content[1] && isCurrentChannel(rssList[x].channel) ) {
          message.channel.stopTyping();
          return message.channel.sendMessage("This feed already exists for this channel.");
        }
      }


      if (rssList.length < rssConfig.maxFeeds) initializeRSS(bot, content[1], message.channel);
      else {
        message.channel.stopTyping();
        return message.channel.sendMessage(`Unable to add feed. The server has reached the limit of: \`${rssConfig.maxFeeds}\` feeds.`)
      }
    }

    else {
      message.channel.stopTyping();
      return message.channel.sendMessage("That is an invalid feed link.");
    }

  });

}
