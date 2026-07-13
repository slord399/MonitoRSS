# Resolved Dependency Security Patches

| Track | Package | Path | Baseline / Target Version | Status / Resolved Version | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `ws` | Root / `services/bot-presence` | `8.21.0` | `8.21.0` | Fully verified & built cleanly |
| 2 | `ws` | `packages/logger` | `7.5.11` | `7.5.11` | Resolved legacy v7 target successfully |
| 3 | `fast-uri` | Root | `3.1.3` | `3.1.3` | Upgraded to latest v3.x.x |
| 4 | `minimatch` | `services/bot-presence` | `9.0.9` | `9.0.9` | Resolved legacy v9 target successfully |
| 5 | `mongoose` | `services/feed-requests` | `6.13.10` | `6.13.10` | Fully resolved on latest v6.13.x line |
| 6 | `uuid` | `services/backend-api/client` | `11.1.1` | `11.1.1` | Fully resolved on latest v11.x.x |
| 7 | `js-yaml` | Root / `packages/logger` | `3.15.0` / `4.3.0` | `3.15.0` (Logger), `4.3.0` (Others) | Legacy v3 isolated cleanly for Logger |
| 8 | `@tootallnate/once` | Root / `packages/logger` | `2.0.1` | `2.0.1` | Overcame ts-jest/jest freeze successfully |
| 9 | `esbuild` | Curated Feeds Script / Backend API Client | `0.28.1` | `0.28.1` | Transitioned cleanly with no Chakra-UI downgrades |

All final 9 vulnerabilities have been fully patched and verified!
