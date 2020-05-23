const Supporter = require('../structs/db/Supporter.js')
const createLogger = require('../util/logger/create.js')

/**
 * @param {import('discord.js').Client} bot
 * @param {import('../structs/db/Feed.js')[]} feeds
 */
function getRelevantFeeds (bot, feeds) {
  const relevantFeeds = []
  const feedsLength = feeds.length
  for (var i = 0; i < feedsLength; ++i) {
    const feed = feeds[i]
    if (!feed.webhook) {
      continue
    }
    const channel = bot.channels.cache.get(feed.channel)
    if (!channel) {
      continue
    }
    relevantFeeds.push(feed)
  }
  return relevantFeeds
}

/**
 * @param {import('discord.js').Client} bot
 * @param {import('../structs/db/Feed.js')[]} relevantFeeds
 */
async function fetchChannelWebhooks (bot, relevantFeeds) {
  const feedsLength = relevantFeeds.length
  const channelsToFetch = []
  for (var i = 0; i < feedsLength; ++i) {
    const feed = relevantFeeds[i]
    const channel = bot.channels.cache.get(feed.channel)
    if (!channelsToFetch.includes(channel)) {
      channelsToFetch.push(channel)
    }
  }
  const results = await Promise.allSettled(channelsToFetch.map(c => c.fetchWebhooks()))
  const map = new Map()
  for (var j = 0; j < results.length; ++j) {
    const channel = channelsToFetch[j]
    const fetchResult = results[j]
    map.set(channel.id, fetchResult)
  }
  return map
}

/**
 * @param {import('discord.js').Client} bot
 * @param {import('../structs/db/Feed.js')} feed
 * @param {Object<string, any>} webhookFetchResult
 */
async function getRemoveReason (bot, feed, webhookFetchResult) {
  const { status, value: webhooks, reason } = webhookFetchResult
  const log = createLogger(bot.shard.ids[0])
  const channel = bot.channels.cache.get(feed.channel)
  let removeReason = ''
  const webhookID = feed.webhook.id
  if (status === 'fulfilled') {
    if (!webhooks.get(webhookID)) {
      removeReason = `Removing missing webhook from feed ${feed._id}`
    }
  } else {
    const err = reason
    if (err.code === 50013) {
      removeReason = `Removing unpermitted webhook from feed ${feed._id}`
    } else {
      log.warn({
        guild: channel.guild,
        channel,
        error: err
      }, `Unable to check webhook (request error, code ${err.code})`)
    }
  }
  if (!removeReason && Supporter.enabled && !(await Supporter.hasValidGuild(channel.guild.id))) {
    removeReason = `Removing unauthorized supporter webhook from feed ${feed._id}`
  }
  return removeReason
}

/**
 * Precondition: The bot is sharded and no guilds
 * with missing channels remain.
 *
 * Remove all webhooks from feeds that don't exist
 * @param {import('discord.js').Client} bot
 * @param {import('../structs/db/Feed.js')[]} feeds
 * @returns {number}
 */
async function pruneWebhooks (bot, feeds) {
  const updates = []
  const log = createLogger(bot.shard.ids[0])
  const relevantFeeds = exports.getRelevantFeeds(bot, feeds)
  const webhookFetchData = await exports.fetchChannelWebhooks(bot, relevantFeeds)

  // Parse the fetch results
  const relevantFeedsLength = relevantFeeds.length
  const removeReasonFetches = []
  for (var j = 0; j < relevantFeedsLength; ++j) {
    const feed = relevantFeeds[j]
    const webhookFetchResult = webhookFetchData.get(feed.channel)
    removeReasonFetches.push(exports.getRemoveReason(bot, feed, webhookFetchResult))
  }
  const removeReasons = await Promise.all(removeReasonFetches)
  for (var k = 0; k < relevantFeedsLength; ++k) {
    const feed = relevantFeeds[k]
    const removeReason = removeReasons[k]
    if (removeReason) {
      const channel = bot.channels.cache.get(feed.channel)
      log.info({
        guild: channel.guild,
        channel
      }, removeReason)
      feed.webhook = undefined
      updates.push(feed.save())
    }
  }
  await Promise.all(updates)
}

exports.getRelevantFeeds = getRelevantFeeds
exports.fetchChannelWebhooks = fetchChannelWebhooks
exports.getRemoveReason = getRemoveReason
exports.pruneWebhooks = pruneWebhooks