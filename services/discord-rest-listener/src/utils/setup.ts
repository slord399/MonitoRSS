import { MikroORM } from "@mikro-orm/core"
import DeliveryRecord from "../entities/DeliveryRecord"
import Feed from "../entities/Feed"
import GeneralStat from "../entities/GeneralStat"
import Profile from "../entities/Profile"
import config from "./config"
import log from "./log"
import amqp from 'amqp-connection-manager'
import { Channel } from 'amqplib'
import { AmqpChannel } from "../constants/amqpChannels"
import { URL } from "url"

const pollDb = (orm: MikroORM<any>, dbName: string) => {
  setInterval(() => {
    (orm.em.getConnection() as any).getClient().db(dbName).command({ping: 1}).catch((err: any) => {
      log.error('MongoDB ping failed, shutting down', {
        message: err.message,
      })
      process.exit(1)
    })
  }, 10000)
}

async function setup () {
  log.info('Connecting to Mongo')
  const orm = await MikroORM.init({
    entities: [DeliveryRecord, GeneralStat, Feed, Profile],
    clientUrl: config.databaseURI,
    ensureIndexes: true,
  })
  log.info('Connected to Mongo')
  const u = new URL(config.databaseURI)
  const databaseName = u.pathname.substring(1).split('?')[0]
  pollDb(orm, databaseName)
  

  const amqpConnection = amqp.connect([config.rabbitmqUri])

  const amqpChannelWrapper = amqpConnection.createChannel({
    setup: function(channel: Channel) {
      return Promise.all([
        channel.assertQueue(AmqpChannel.FeedArticleDeliveryResult, {
          durable: true,
        }),
      ])
    }
  })

  return {
    orm,
    amqpChannelWrapper
  }
}

export default setup
