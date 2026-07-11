/* eslint-disable max-len */
import { INestApplication } from '@nestjs/common';
import { RequestStatus } from './constants';
import { FeedFetcherListenerService } from './feed-fetcher-listener.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  clearDatabase,
  setupPostgresTests,
  teardownPostgresTests,
} from '../shared/utils/setup-postgres-tests';
import { Request, Response } from './entities';
import { EntityRepository } from '@mikro-orm/postgresql';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import dayjs from 'dayjs';
import { FeedFetcherService } from './feed-fetcher.service';
import nock from 'nock';
import path from 'path';
import PartitionedRequestsStoreService from '../partitioned-requests-store/partitioned-requests-store.service';
import { HostRateLimiterService } from '../host-rate-limiter/host-rate-limiter.service';
import { CacheStorageService } from '../cache-storage/cache-storage.service';
import { EntityManager } from '@mikro-orm/core';
import { ObjectFileStorageService } from '../object-file-storage/object-file-storage.service';
import { ConfigService } from '@nestjs/config';

jest.mock('../utils/logger');

const feedFilePath = path.join(__dirname, '..', '..', 'test', 'data', 'feed.xml');

describe('FeedFetcherListenerService (Integration)', () => {
  let app: INestApplication;
  let service: FeedFetcherListenerService;
  let feedFetcherService: FeedFetcherService;
  const url = 'https://rss-feed.com/feed.xml';
  let requestRepo: EntityRepository<Request>;
  let responseRepo: EntityRepository<Response>;
  const amqpConnection = {
    publish: jest.fn(),
  };

  beforeAll(async () => {
    const setupData = await setupPostgresTests(
      {
        providers: [
          FeedFetcherListenerService,
          FeedFetcherService,
          PartitionedRequestsStoreService,
          HostRateLimiterService,
          {
            provide: ObjectFileStorageService,
            useValue: {
              uploadFeedHtmlContent: jest.fn(),
            },
          },
          {
            provide: CacheStorageService,
            useValue: {
              setNX: jest.fn().mockResolvedValue(true),
              del: jest.fn().mockResolvedValue(1),
              getFeedHtmlContent: jest.fn(),
            },
          },
          {
            provide: AmqpConnection,
            useValue: amqpConnection,
          },
        ],
      },
      {
        models: [Request, Response],
      },
    );

    const { module } = await setupData.init();

    app = module.createNestApplication();
    await app.init();

    service = app.get(FeedFetcherListenerService);
    feedFetcherService = app.get(FeedFetcherService);
    requestRepo = app.get<EntityRepository<Request>>(
      getRepositoryToken(Request),
    );
    responseRepo = app.get<EntityRepository<Response>>(
      getRepositoryToken(Response),
    );
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownPostgresTests();
  });

  describe('onBrokerFetchRequestBatch', () => {
    it('saves a failed attempt with a next retry date if failed', async () => {
      nock(url).get('/').replyWithFile(404, feedFilePath, {
        'Content-Type': 'application/xml',
      });

      await service.onBrokerFetchRequestBatch({
        timestamp: Date.now(),
        rateSeconds: 10,
        data: [{ url }],
      });

      const found = await requestRepo.find({
        url,
      });

      expect(found).toHaveLength(1);
      expect(found[0].nextRetryDate).toBeDefined();
    });

    it('does not process the event if at failure retry count', async () => {
      const requests = Array.from({
        length: service.maxFailAttempts,
      }).map(() => {
        const request = new Request();
        request.status = RequestStatus.BAD_STATUS_CODE;
        request.createdAt = dayjs().subtract(1, 'day').toDate();
        request.url = url;

        return request;
      });

      await (requestRepo as any).persistAndFlush(requests);

      const fetchAndSaveResponse = jest.spyOn(
        feedFetcherService,
        'fetchAndSaveResponse',
      );

      await service.onBrokerFetchRequestBatch({
        timestamp: Date.now(),
        rateSeconds: 10,
        data: [{ url }],
      });

      expect(fetchAndSaveResponse).not.toHaveBeenCalled();
    });
  });
});
