/* eslint-disable max-len */
import { INestApplication } from '@nestjs/common';
import { RequestStatus } from './constants';
import { FeedFetcherService } from './feed-fetcher.service';
import {
  clearDatabase,
  setupPostgresTests,
  teardownPostgresTests,
} from '../shared/utils/setup-postgres-tests';
import { Request, Response } from './entities';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ObjectFileStorageService } from '../object-file-storage/object-file-storage.service';
import { CacheStorageService } from '../cache-storage/cache-storage.service';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import PartitionedRequestsStoreService from '../partitioned-requests-store/partitioned-requests-store.service';

jest.mock('../utils/logger');

describe('FeedFetcherService (Integration)', () => {
  let app: INestApplication;
  let service: FeedFetcherService;
  const url = 'https://rss-feed.com/feed.xml';
  let requestRepo: EntityRepository<Request>;
  let em: EntityManager;
  let partitionedRequestsStore: PartitionedRequestsStoreService;

  beforeAll(async () => {
    const setupData = await setupPostgresTests(
      {
        providers: [
          FeedFetcherService,
          {
            provide: ObjectFileStorageService,
            useValue: {
              getFeedHtmlContent: jest.fn(),
              uploadFeedHtmlContent: jest.fn(),
            },
          },
          {
            provide: CacheStorageService,
            useValue: {
              getFeedHtmlContent: jest.fn(),
              setFeedHtmlContent: jest.fn(),
            },
          },
          {
            provide: PartitionedRequestsStoreService,
            useValue: {
              getRequests: jest.fn(),
              getLatestRequestWithResponseBody: jest.fn(),
            },
          },
        ],
      },
      {
        models: [Request, Response],
      },
    );

    const { module } = await setupData.init();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    service = app.get(FeedFetcherService);
    requestRepo = app.get<EntityRepository<Request>>(
      getRepositoryToken(Request),
    );
    em = app.get<EntityManager>(EntityManager);
    partitionedRequestsStore = app.get<PartitionedRequestsStoreService>(
      PartitionedRequestsStoreService,
    );
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownPostgresTests();
  });

  describe('getRequests', () => {
    it('returns correctly according to input params', async () => {
      const re2 = {
        id: 2,
        status: RequestStatus.BAD_STATUS_CODE,
      };

      jest.spyOn(partitionedRequestsStore, 'getRequests').mockResolvedValue([
        re2
      ] as any);

      const result = await service.getRequests({
        skip: 1,
        limit: 1,
        url,
      } as any);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: re2.id,
        status: re2.status,
      });
    });

    it('returns an empty array if nothing matches', async () => {
      jest.spyOn(partitionedRequestsStore, 'getRequests').mockResolvedValue([] as any);

      const result = await service.getRequests({
        skip: 0,
        limit: 10,
        url,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getLatestRequest', () => {
    it('returns the request with the response', async () => {
      const req1 = new Request();
      req1.id = 1;
      req1.status = RequestStatus.BAD_STATUS_CODE;
      req1.url = url;
      req1.createdAt = new Date(2020, 1, 6);

      const response = new Response();
      response.statusCode = 200;
      response.isCloudflare = false;

      req1.response = response;

      jest.spyOn(partitionedRequestsStore, 'getLatestRequestWithResponseBody').mockResolvedValue(req1);

      const latestRequest = await service.getLatestRequest({
        url,
        lookupKey: url,
      });

      expect(latestRequest?.request.id).toEqual(req1.id);
      expect(latestRequest?.request.response).toMatchObject({
        statusCode: 200,
        isCloudflare: false,
      });
    });
  });
});
