import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import config from './config';

const configVals = config();

const postgresUri = configVals.FEED_REQUESTS_POSTGRES_URI;
const dbName = postgresUri.split('/').pop();

const MikroOrmConfig: any = {
  driver: PostgreSqlDriver,
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  clientUrl: configVals.FEED_REQUESTS_POSTGRES_URI,
  forceUtcTimezone: true,
  timezone: 'UTC',
  dbName,
  ensureDatabase: true,
};

export default MikroOrmConfig;
