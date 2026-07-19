# Pull Request Description

## 📋 Summary of Changes
This Pull Request migrates MonitoRSS from a legacy NestJS monolithic codebase into a highly optimized, service-oriented architecture. It completely decommissions the legacy Discord bot and user-feeds delivery services, replacing them with a high-performance Fastify delivery runner (`services/user-feeds-next`), a dedicated host-rate-limited fetch service (`services/feed-requests`), and a centralized shared events system (`packages/contracts`).

Furthermore, it incorporates comprehensive dependency upgrades, overrides standardization, and critical framework bug fixes to guarantee maximum stability, type safety, and resistance to security vulnerabilities.

---

## 🗂️ Architectural & Structural Breakdown

### 🤖 Decoupled Microservices
- **`services/user-feeds-next`**: Replaces the legacy `user-feeds` service. Built on Fastify with TypeScript, it implements a lean, schema-validated event router that processes article deliveries, handles custom placeholders, and formats HTML-to-Discord content with extreme speed.
- **`services/feed-requests`**: A robust, standalone network service designed to execute, partition, and rate-limit HTTP feed requests. It stores request histories in partitioned PostgreSQL tables and manages host-level request locks via Redis.
- **`services/bot-presence` & `services/discord-rest-listener`**: Retained and standardized to align with Node.js 22 and updated RabbitMQ event pipelines.

### 📦 Centralized Shared Contracts (`packages/`)
- **`packages/contracts`**: A brand new monorepo workspace package that defines unified AMQP queue configurations and type-safe schema contracts (e.g., `feed-deliver-articles.ts`, `feed-article-delivery-result.ts`), standardizing communication across all decoupled microservices.
- **`packages/logger`**: Standardized shared Datadog and JSON logger utilities.

### 🎨 Modernized React Web Portal (`services/backend-api`)
- **`services/backend-api/client`**: Complete redesign using React and Chakra UI V2. Introduces the interactive **Message Builder** panel with full drag-and-drop live preview of embeds, fields, and custom buttons, a Detents capacity slider for workspace billing, Reddit OAuth connection settings, and setup checklists.
- **`services/backend-api/src`**: Fastify HTTP server replacing the legacy backend APIs to securely serve feed management endpoints, comanager workspace invites, and Paddle checkout integrations.

---

## ✨ New Features & Logic Improvements
- **Interactive Message Builder**: Fully drag-and-drop Discord message layout designer with dynamic component buttons and live layout previews inside the browser.
- **Regex-Based Custom Placeholders**: Allows host administrators and users to extract and parse specific patterns from feed fields using custom regular expressions.
- **Granular Workspace Billing**: Adds support for seat-based workspace management, comanager feed limits, and active detents pricing sliders connected with Paddle.
- **Reddit Feed Integration**: Natively fetch Reddit threads utilizing authenticated OAuth API profiles.

---

## 🐛 Bug Fixes & Refactoring
- **Automatic Log Partitioning**: Feed requests and delivery logs are now kept in partition tables rotated automatically, avoiding index bloat and DB slow-down.
- **Self-Healing Schema Migrations**: Employs an internal schema generation and migrations runner on microservice startup, eliminating database concurrency deadlocks during integration tests.
- **Legacy Feed Cleanups**: Completely decommissioned and deleted the legacy `services/bot` and monolithic NestJS `services/user-feeds` codebases.

---

## 🛠️ Dependency Standardizations & Bug Fix Patches
This release packages vital patches and upgrades for the security, compatibility, and execution correctness of MonitoRSS:
- **MikroORM 6 Integration Fixes**: Patched NestJS and integration tests to retrieve `EntityManager` for persistence operations (`em.persist()`, `em.flush()`) instead of calling deleted methods on the legacy `EntityRepository`.
- **Timestamp and Date Resolution**: Resolved date parsing mismatch bugs inside raw MikroORM `em.execute()` PostgreSQL queries by explicitly wrapping returned raw timestamps (e.g., `request_initiated_at` and `created_at`) inside `new Date()` wrappers.
- **Test Concurrency Protections**: Enforced Sequential Jest execution (`--runInBand`) for tests performing PostgreSQL schema migrations to eliminate parallel race conditions and prevent "could not open relation with OID" failures.
- **TypeScript & Babel Hoisting**: Aligned monorepo DevDependencies TypeScript version to prevent type conflicts on hoisted Babel traversal packages, and added `class-validator` and `class-transformer` directly to the root `devDependencies` so NestJS testing utilities resolve them correctly during unit tests.
- **Security Dependency Hardening**: Standardized transitive packages to clean and secure tracks via package overrides:
  - Upgraded **`fastify`** to `^5.10.0` globally.
  - Standardized **`nodemailer`** to `^9.0.3` and `@types/nodemailer` to `^8.0.1`.
  - Standardized **`lodash`** to `^4.18.1` and **`qs`** to `^6.15.3`.
  - Upgraded **`undici`** globally to safe versions (`v6.27.0`/`v7.28.0`).
  - Hardened ReDoS risks by pinning **`minimatch`** tracks (`3.1.4`, `5.1.8`, `8.0.6`, `10.2.5`) and **`brace-expansion`** (`^5.0.7`).
  - Standardized **`fast-xml-parser`** to `^5.10.0`, **`ws`** to `8.21.0`, and **`flatted`** to `^3.4.2`.
  - Corrected overrides for `@fastify/middie` (`^9.3.3`) and `form-data` (`^4.0.1`) to resolve 404 integrity errors during global installation.
  - Cleaned up deprecated `@types/twemoji` from the client package dependencies.

---

## ⚠️ Configuration & Breaking Changes
- **NPM Workspaces Required**: This repository is now an NPM monorepo workspace. Run `npm install` from the root directory to bootstrap links.
- **RabbitMQ Infrastructure**: A RabbitMQ message broker instance is mandatory to coordinate feed routing events between services.
- **Environment Variables**: Administrators must populate `PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, and Reddit App OAuth client settings to fully enable billing and Reddit feeds.
