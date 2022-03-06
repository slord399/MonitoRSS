import {
  array, InferType, number, object, string,
} from 'yup';

export const DiscordUserSchema = object({
  id: string().required(),
  username: string().required(),
  iconUrl: string().optional(),
  supporter: object({
    guilds: array(string()).required(),
    maxFeeds: number().required(),
    maxGuilds: number().required(),
    expireAt: string().optional(),
  }).optional(),
});

export type DiscordUser = InferType<typeof DiscordUserSchema>;
