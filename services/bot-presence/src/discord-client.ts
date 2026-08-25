import {
  Client,
  GatewayDispatchEvents,
  GatewayIntentBits,
  GatewayOpcodes,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import {
  WebSocketManager,
  CompressionMethod,
  WebSocketShardEvents,
} from "@discordjs/ws";
import { AppConfig } from "./config";
import { MessageBroker } from "./message-broker";
import { DISCORD_PRESENCE_ACTIVITY_TYPE_IDS } from "./constants/discord-presence-activity-type.constants";
import {
  DISCORD_PRESENCE_STATUS_TO_API_VALUE,
  DiscordPresenceStatus,
} from "./constants/discord-presence-status.constants";
import logger from "./logger";

interface GatewayBotInfo {
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
  };
}

async function waitForSufficientSessions(
  rest: REST,
  requiredShards?: number,
): Promise<void> {
  const gatewayInfo = (await rest.get(Routes.gatewayBot())) as GatewayBotInfo;
  const { shards: recommendedShards, session_start_limit } = gatewayInfo;
  const shardsNeeded = requiredShards ?? recommendedShards;

  if (session_start_limit.remaining >= shardsNeeded) {
    logger.info(
      `Session limit check passed: ${session_start_limit.remaining} sessions available, ${shardsNeeded} needed`,
    );
    return;
  }

  const resetAt = new Date(Date.now() + session_start_limit.reset_after);
  logger.warn(
    `Not enough sessions to spawn ${shardsNeeded} shards. ` +
      `Only ${session_start_limit.remaining} remaining. ` +
      `Waiting until reset at ${resetAt.toISOString()}...`,
  );

  await new Promise((resolve) =>
    setTimeout(resolve, session_start_limit.reset_after),
  );

  return waitForSufficientSessions(rest, requiredShards);
}

export interface DiscordClient {
  destroy(): void;
}

export async function createDiscordClient(
  config: AppConfig,
  broker: MessageBroker,
): Promise<DiscordClient> {
  const rest = new REST({ version: "10" }).setToken(config.botToken);

  let intents: GatewayIntentBits = undefined;

  if (config.supporterGuildId) {
    intents = GatewayIntentBits.GuildMembers;
  }

  if (!intents) {
    intents = GatewayIntentBits.Guilds;
  }

  const gateway = new WebSocketManager({
    token: config.botToken,
    intents,
    rest,
    compression: CompressionMethod.ZlibNative,
  });

  gateway.on(WebSocketShardEvents.SocketError, (error, shardId) => {
    logger.error(`WebSocket error on shard ${shardId}`, {
      error: error.message,
    });
  });

  gateway.on(WebSocketShardEvents.Error, (error, shardId) => {
    logger.error(`Gateway error on shard ${shardId}`, {
      error: error.message,
    });
  });

  const client = new Client({ rest, gateway });

  await waitForSufficientSessions(rest);
  await gateway.connect();

  if (config.presenceStatus) {
    const shards = await gateway.getShardIds();

    await Promise.all(
      shards.map(async (id) => {
        try {
          await gateway.send(id, {
            op: GatewayOpcodes.PresenceUpdate,
            d: {
              status:
                DISCORD_PRESENCE_STATUS_TO_API_VALUE[
                  config.presenceStatus.status
                ],
              activities:
                config.presenceStatus.activity &&
                config.presenceStatus.status !==
                  DiscordPresenceStatus.Invisible &&
                config.presenceStatus.status !== DiscordPresenceStatus.Offline
                  ? [
                      {
                        name: config.presenceStatus.activity.name,
                        type: DISCORD_PRESENCE_ACTIVITY_TYPE_IDS[
                          config.presenceStatus.activity.type
                        ],
                        url: config.presenceStatus.activity.url,
                      },
                    ]
                  : [],
              afk: false,
              since:
                config.presenceStatus.status === DiscordPresenceStatus.Idle
                  ? new Date().getTime()
                  : null,
            },
          });
        } catch (err) {
          logger.error(`Failed to update presence for shard ${id}`, {
            error: (err as Error).message,
          });
        }
      }),
    );
  }

  logger.info("Listening to events...");
  listenToEvents(client, config, broker);

  return {
    destroy() {
      gateway.destroy();
    },
  };
}

function listenToEvents(
  client: Client,
  config: AppConfig,
  broker: MessageBroker,
) {
  if (!config.supporterGuildId) {
    return;
  }

  client.on(GatewayDispatchEvents.GuildMemberAdd, ({ data }) => {
    if (!data.user) {
      return;
    }

    if (data.guild_id !== config.supporterGuildId) {
      return;
    }

    broker.publishSupporterServerMemberJoined({
      userId: data.user.id,
    });
  });
}
