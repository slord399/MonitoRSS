# Pull Request Description

## 📋 Summary of Changes
This PR squashes and integrates all massive updates from the `dev2-dev` branch into MonitoRSS. It migrates the legacy architecture into a modular, service-based framework featuring a next-generation feed delivery engine powered by Fastify, MikroORM, Redis, and RabbitMQ. Furthermore, it completely revamps the Web UI with improved feed list views, advanced connection options, Reddit auth, custom placeholders, and granular billing controls.

---

## 🗂️ Architectural & Structural Breakdown

### 🖥️ Next-Gen Feed Delivery Engine (`services/user-feeds-next`)
Built on Fastify for ultra-low overhead and peak performance, this service replaces the legacy NestJS `user-feeds` service to orchestrate robust, modern feed parsing and delivery.
- `services/user-feeds-next/package.json` -> Manages workspace dependencies and runs the fast Fastify app using custom build tools.
- `services/user-feeds-next/src/main.ts` -> Serves as the microservice entry point, configuring Fastify HTTP APIs and starting the app.
- `services/user-feeds-next/src/articles/parser/article-parser.ts` -> Parses XML/RSS feeds into consistent, structured article payloads.
- `services/user-feeds-next/src/delivery/discord/delivery-routing.ts` -> Evaluates medium-level filters and routes formatted articles directly to Discord channels or webhooks.
- `services/user-feeds-next/src/formatting/placeholder-engine.ts` -> Parses and resolves standard and custom placeholder patterns dynamically during formatting.
- `services/user-feeds-next/src/stores/postgres/migrations.ts` -> Contains SQL schema definitions and self-healing mechanisms for user feed delivery logs.

### 🌐 Core Request Broker (`services/feed-requests`)
Dedicated to managing outgoing network requests for feed URLs, utilizing advanced caching, status tracking, and request partitions.
- `services/feed-requests/src/partitioned-requests-store/partitioned-requests-store.service.ts` -> Tracks feed fetch logs inside partition-based PostgreSQL tables.
- `services/feed-requests/src/host-rate-limiter/host-rate-limiter.service.ts` -> Implements strict host-level rate limiting to comply with remote web servers.
- `services/feed-requests/src/utils/prune-and-create-partitions.ts` -> Automates the partition rotation and database table pruning.

### 🎨 Revamped React Client Web UI (`services/backend-api/client`)
A fully modernized user interface based on Chakra UI V2, React Query, and TypeScript to manage feeds, connections, and comanager invitations.
- `services/backend-api/client/package.json` -> Governs development scripts and client-side dependencies.
- `services/backend-api/client/src/features/feedConnections/discordChannel/messageBuilder/MessageBuilderPage.tsx` -> A highly interactive UI to build and preview Discord messages with custom templates, embeds, and components.
- `services/backend-api/client/src/features/workspaces/components/WorkspaceBilling/index.tsx` -> Adds premium pricing Detents sliders and Paddle transaction checkout integrations.
- `services/backend-api/client/src/features/feed/components/SetupChecklist/index.tsx` -> Shows helpful interactive checklists for new users setting up feeds.

### 📦 Unified Monorepo & Shared Packages (`packages/`)
- `packages/contracts/src/queues.ts` -> Centralizes the RabbitMQ queue names, ensuring type-safe broker routing between microservices.
- `packages/contracts/src/events/feed-deliver-articles.ts` -> Schema contract representing the payload for scheduled article delivery.
- `packages/logger/src/index.ts` -> Exposes standard JSON and Datadog logging utilities.

---

## ✨ New Features & Logic Improvements
- **Service-Based Architecture**: Complete decoupling of the web backend, feed fetcher, and feed delivery engines.
- **Custom Placeholders**: Define dynamic regex-based placeholders on articles to customize Discord text.
- **Interactive Message Builder**: Live rendering of Discord channel embeds and component buttons inside the client panel.
- **Granular Workspace Billing**: Flexible seat-based comanager access and dynamic pricing detents with active Paddle checkout.
- **Reddit OAuth Connections**: Natively configure Reddit feeds utilizing user-verified OAuth logins.

---

## 🐛 Bug Fixes & Refactoring
- **Automatic Partitions**: Migrated feed logs to partitioned PostgreSQL tables, preventing performance degradation on large datasets.
- **Self-Healing Schemas**: Added automatic schema generation and self-healing migrations to prevent integration test races.
- **Transitive Security Updates**: Hardened npm dependency trees by standardizing `lodash`, `qs`, `undici`, `minimatch`, and `fast-uri` globally.
- **Legacy Feed Cleanups**: Completely decommissioned and deleted the legacy `user-feeds` and `bot` services.

---

## ⚠️ Configuration & Breaking Changes
Host administrators must configure the following before deploying:
- **NPM Monorepo Workspaces**: Standardized to use NPM Workspaces (Node 22+, NPM 12+). Run `npm install` from the root directory to bootstrap links.
- **RabbitMQ**: Requires a RabbitMQ message broker with channels for microservice events.
- **PostgreSQL Partitioning**: Ensure PostgreSQL host permissions support partition table creation.
- **Paddle Billing Integration**: Set `PADDLE_CLIENT_TOKEN` and `PADDLE_API_KEY` for billing operations.
- **Reddit OAuth Client**: Provide Reddit application client credentials to enable Reddit feeds.
