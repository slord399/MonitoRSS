import { ConfigService } from '@nestjs/config';
import { FeedFetcherService } from './feed-fetcher.service';
import path from 'path';
import { readFileSync } from 'fs';
import { RequestStatus } from './constants';
import * as undici from 'undici';
import { ObjectFileStorageService } from '../object-file-storage/object-file-storage.service';
import { CacheStorageService } from '../cache-storage/cache-storage.service';
import PartitionedRequestsStoreService from '../partitioned-requests-store/partitioned-requests-store.service';

jest.mock('../shared/utils/log-context');
jest.mock('undici');

describe('FeedFetcherService', () => {
  let service: FeedFetcherService;
  let configService: ConfigService;
  const feedUrl = 'https://rss-feed.com/feed.xml';
  const defaultUserAgent = 'default-user-agent';
  const feedFilePath = path.join(__dirname, '..', 'test', 'data', 'feed.xml');
  const feedXml = readFileSync(feedFilePath, 'utf8');

  const objectFileStorageService: jest.Mocked<ObjectFileStorageService> = {
    uploadFeedHtmlContent: jest.fn(),
  } as never;
  const cacheStorageService: jest.Mocked<CacheStorageService> = {
    getFeedHtmlContent: jest.fn(),
  } as never;
  const partitionedRequestsStore: jest.Mocked<PartitionedRequestsStoreService> = {
    getRequests: jest.fn(),
    getLatestRequestWithResponseBody: jest.fn(),
  } as never;

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn().mockImplementation((key) => {
        if (key === 'FEED_REQUESTS_FEED_REQUEST_DEFAULT_USER_AGENT') {
          return defaultUserAgent;
        }
        if (key === 'FEED_REQUESTS_REQUEST_TIMEOUT_MS') {
          return 10000;
        }
      }),
    } as never;
    service = new FeedFetcherService(
      configService,
      objectFileStorageService,
      cacheStorageService,
      partitionedRequestsStore
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchFeedResponse', () => {
    it('does not throws when status code is non-200', async () => {
      (undici.request as jest.Mock).mockResolvedValue({
        statusCode: 401,
        headers: {},
        body: {
          arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('')),
        },
      });

      await expect(service.fetchFeedResponse(feedUrl)).resolves.toBeDefined();
    });

    it('returns the feed xml', async () => {
      (undici.request as jest.Mock).mockResolvedValue({
        statusCode: 200,
        headers: { 'content-type': 'application/xml' },
        body: {
          arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(feedXml)),
        },
      });

      const res = await service.fetchFeedResponse(feedUrl);
      expect(await res.text()).toEqual(feedXml);
    });
  });

  describe('fetchAndSaveResponse', () => {
    const userAgent = 'user-agent';

    beforeEach(() => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'feedUserAgent') {
          return userAgent;
        }
      });
    });

    it('passes the correct fetch option to fetch feed', async () => {
      const userAgent = 'my-user-agent';
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'feedUserAgent') {
          return userAgent;
        }
      });

      (undici.request as jest.Mock).mockResolvedValue({
        statusCode: 200,
        headers: { 'content-type': 'application/xml' },
        body: {
          arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(feedXml)),
        },
      });

      await service.fetchAndSaveResponse(feedUrl);

      expect(undici.request).toHaveBeenCalledWith(
        feedUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'user-agent': userAgent,
          }),
        })
      );
    });

    describe('if ok response', () => {
      it('returns request correctly', async () => {
        (undici.request as jest.Mock).mockResolvedValue({
          statusCode: 200,
          headers: { 'content-type': 'application/xml' },
          body: {
            arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(feedXml)),
          },
        });

        const { request } = await service.fetchAndSaveResponse(feedUrl);
        expect(request).toMatchObject({
          url: feedUrl,
          status: RequestStatus.OK,
          response: expect.objectContaining({
            statusCode: 200,
          }),
        });
      });

      it('returns response with cloudflare flag correctly', async () => {
        (undici.request as jest.Mock).mockResolvedValue({
          statusCode: 200,
          headers: {
            'content-type': 'application/xml',
            'server': 'cloudflare'
          },
          body: {
            arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(feedXml)),
          },
        });

        const { request } = await service.fetchAndSaveResponse(feedUrl);
        expect(request.response).toMatchObject({
          isCloudflare: true,
          statusCode: 200,
        });
      });
    });

    describe('if not ok response', () => {
      const feedResponseBody = {
        message: 'failed',
      };

      it('returns correctly', async () => {
        (undici.request as jest.Mock).mockResolvedValue({
          statusCode: 404,
          headers: { 'content-type': 'application/json' },
          body: {
            arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify(feedResponseBody))),
          },
        });

        const { request } = await service.fetchAndSaveResponse(feedUrl);
        expect(request).toMatchObject({
          url: feedUrl,
          status: RequestStatus.BAD_STATUS_CODE,
          response: expect.objectContaining({
            statusCode: 404,
          }),
        });
      });
    });

    describe('if fetch failed', () => {
      it('returns request correctly', async () => {
        (undici.request as jest.Mock).mockRejectedValue(new Error('failed'));

        const { request } = await service.fetchAndSaveResponse(feedUrl);
        expect(request).toMatchObject({
          url: feedUrl,
          status: RequestStatus.FETCH_ERROR,
          errorMessage: expect.any(String),
        });
      });
    });
  });
});
