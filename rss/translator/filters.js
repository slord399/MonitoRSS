
const striptags = require('striptags')

function foundFilterWords(channel, filterType, content) {

  var rssConfig = require('../../config.json')
  var rssList = rssConfig.sources[channel.guild.id]

  if (content == null) return false;
  var content = content.toLowerCase();
  if (filterType != null && filterType.length !== 0) {
    if (typeof filterType == "object") {
      for (var word in filterType)
        if (content.search(filterType[word].toLowerCase()) !== -1)
          return true;
    }
    else if (typeof filterType == "string") {
      if (content.search(filterType.toLowerCase()) !== -1)
        return true;
    }
  }
  else return false;
}


module.exports = function (rssIndex, data, dataDescrip) {

  var filterFound = false

  let titleFilters = rssList[rssIndex].filters.title;
  if (foundFilterWords(titleFilters, data.title))
    filterFound = true;

  let descrFilters = rssList[rssIndex].filters.description;
  if (foundFilterWords(descrFilters, dataDescrip))
    filterFound = true;

  let smryFilters = rssList[rssIndex].filters.summary;
  if (foundFilterWords(smryFilters, striptags(data.summary)))
    filterFound = true;

  if (data.guid.startsWith("yt:video")) {
    if (foundFilterWords(descrFilters, data['media:group']['media:description']['#']))
      filterFound = true;
  }

  return filterFound;

}
