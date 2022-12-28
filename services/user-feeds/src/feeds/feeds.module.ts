import { Module } from "@nestjs/common";
import { FeedsService } from "./feeds.service";
import { FeedsController } from "./feeds.controller";
import { ArticleRateLimitModule } from "../article-rate-limit/article-rate-limit.module";
import { DiscordMediumService } from "../delivery/mediums/discord-medium.service";
import { FeedFetcherModule } from "../feed-fetcher/feed-fetcher.module";
import { ArticleFiltersModule } from "../article-filters/article-filters.module";

@Module({
  controllers: [FeedsController],
  providers: [FeedsService, DiscordMediumService],
  imports: [ArticleRateLimitModule, FeedFetcherModule, ArticleFiltersModule],
})
export class FeedsModule {}
