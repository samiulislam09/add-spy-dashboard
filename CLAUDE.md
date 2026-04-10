# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The import above pulls in `AGENTS.md`, which carries the **Next.js 16 is not what your training data remembers** warning and the practical gotchas. Read it. The notes below are the architectural big picture that complements it.

## What this repo is

"Competitor Ad Intelligence" (package name `competitor-ad-intelligence`, internal codename `@cia/*`) — a Next.js 16 + Prisma + BullMQ app that ingests public / authorized ad library data, normalizes it, runs heuristic + optional LLM messaging analysis, and surfaces advertiser/ad/alert views in an embeddable dashboard.

Compliance boundary is load-bearing, not cosmetic: see `docs/compliance-boundary.md`. Never add a connector that scrapes hidden-login or anti-bot-gated content.

## Commands

```bash
yarn install
yarn dev               # Next.js dev (port 3000)
yarn dev:worker        # BullMQ worker (tsx watch)
yarn db:generate       # Prisma client (run after schema edits)
yarn db:push           # Push schema to local MySQL (fast, no migration history)
yarn db:migrate        # Prisma migrate dev
yarn db:seed           # Baseline workspace only — no dummy ads
yarn lint              # eslint . (covers app + worker)
yarn typecheck         # tsc --noEmit
yarn build             # prisma generate + next build
yarn build:worker      # tsc -p worker/tsconfig.json
```

Full preflight: `yarn lint && yarn typecheck && yarn build && yarn build:worker`.

There is **no test runner configured**. Don't invent `yarn test` — it doesn't exist.

## The `@cia/*` module layout (important)

Next.js lives at the repo root (`app/`, `components/`, `lib/`), but the domain layers are split into sibling packages that are linked as local `file:` dependencies in `package.json`:

| Import specifier  | Source on disk      | Responsibility                                          |
| ----------------- | ------------------- | ------------------------------------------------------- |
| `@cia/db`         | `db/src/` + `db/prisma/` | Prisma client singleton, repository helpers, schema    |
| `@cia/ingestion` | `ingestion/src/`    | Connector interface, pipeline, Meta/CSV/JSON connectors |
| `@cia/ai`         | `ai/src/`           | Deterministic messaging analysis + optional OpenAI     |
| `@cia/analytics`  | `analytics/src/`    | KPI + chart data shaping                                |
| `@cia/types`      | `types/src/`        | Shared Zod DTOs used by both API and client            |
| `@cia/ui`         | `ui/src/`           | Reusable UI primitives / chart wrappers                 |
| `@cia/utils`      | `utils/src/`        | `env` (Zod-parsed), `hash`, object storage, time       |

`tsconfig.json` maps these via `paths`. Both `@cia/x` (the package `main`) and `@cia/x/*` (subpaths) resolve into the corresponding `src/` folder — there is no build step for these packages in dev. Prisma schema lives **only** in `db/prisma/schema.prisma`; do not redefine models anywhere else.

After editing `schema.prisma` you must run `yarn db:generate` before `yarn typecheck` / `yarn build`, otherwise the generated client types go stale and TS blows up.

## Request flow (web side)

1. Request hits an `app/api/**/route.ts` handler.
2. Handler calls `resolveWorkspaceContext(request)` from `lib/workspace.ts`. This resolves the workspace slug in this order:
   - `?storeId=` / `?store_id=` query param
   - `x-store-id` / `x-workspace-id` header
   - `env.DEFAULT_WORKSPACE_SLUG` (default `demo-store`)
   It then loads the `Workspace` row and a fallback user (the oldest `User`). If either is missing it throws — which is why a fresh DB needs `yarn db:seed` before routes will respond.
3. Search params are parsed through a Zod DTO from `@cia/types` via `parseSearchParams(url, schema)` in `lib/http.ts`.
4. Data access goes through repository helpers in `@cia/db` (e.g. `listAds(workspaceId, filters)`), **scoped by workspace id** — never query across workspaces.
5. Handlers are wrapped in `withApiErrors(...)` for consistent error shape; success responses use `ok(...)`.

Admin ingestion endpoints (`app/api/admin/**`) additionally require the `x-admin-key` header matching `env.ADMIN_API_KEY` (local default `local-admin-key`).

**Next 16 dynamic params are promise-based** — `await params` in route/page handlers with `[id]` style segments. Don't destructure `params` synchronously.

## Embedded no-auth mode

`ENABLE_AUTH=false` by default. The app is designed to be embedded inside a parent dashboard that has already authenticated the user; workspace scoping is the security boundary. If you're adding anything that would be exposed to the open internet, you must add real auth middleware first — the `fallbackUser` pattern in `lib/workspace.ts` is not a security model.

## Worker + queues (BullMQ)

Two files define queues, and **they must stay in sync by name**:

- `lib/queues.ts` — the web process's producer side. Re-exports BullMQ `Queue` instances used from API routes (e.g. `enqueueSyncJobs`, `enqueueRetryRun`).
- `worker/src/queues/index.ts` — the worker process's consumer side. Declares the same queue names in `QUEUE_NAMES`.

Queue names currently in use:

```
sync-advertiser-ads
refresh-ad-snapshots
dedupe-creatives
compute-messaging-analysis
generate-alert-events
```

If you add a queue, update **both** files or jobs will vanish into a queue nobody reads.

`worker/src/index.ts` is the worker entry point. On startup it registers all workers (`registerWorkers()` from `worker/src/workers/`) and schedules repeating jobs (sync every 30m, snapshots hourly, analysis hourly, alerts every 20m). Per-job logic lives in `worker/src/jobs/{sync,snapshots,dedupe,analysis,alerts}.ts`.

## Ingestion connectors

Contract is `IngestionConnector` in `ingestion/src/types.ts`. Every connector must implement `fetchAdvertisers`, `fetchAds`, `fetchAdDetails`, and `normalizeRecord` — returning `NormalizedAdRecord` or null. Existing connectors:

- `meta-public.ts` — Meta Ad Library API. Requires `META_AD_LIBRARY_ACCESS_TOKEN` + `metaSearchTerms` in source config; otherwise runs fail loudly.
- `csv.ts`, `json.ts` — customer-supplied exports.
- `base.ts` — shared helpers.

The pipeline in `ingestion/src/pipeline/service.ts` is how the worker consumes a connector; don't instantiate connectors directly from routes.

## Env / config

`env` comes from `utils/src/env.ts`, parsed with Zod at import time. It searches for `.env` walking up from `process.cwd()` (current dir, up to four parents), which means both the web process and the worker can find a shared `.env` at the repo root. Never read `process.env.*` directly in app code — import `env` from `@cia/utils` so missing vars fail fast at startup with a schema error, not silently at runtime.

## Working with an empty database

If API routes return `"Workspace 'demo-store' not found"` or `"No user found"`:

```bash
yarn db:push    # apply schema
yarn db:seed    # create baseline workspace + user
```

Then make requests with `x-store-id: demo-store` (or rely on the default).

## What NOT to do

- Don't add a test script to `package.json` pretending there's a test suite — there isn't.
- Don't duplicate Prisma models outside `db/prisma/schema.prisma`.
- Don't query from route handlers across workspace boundaries; every query must be scoped by `workspace.id`.
- Don't add a connector that relies on login scraping, anti-bot evasion, or private data — the compliance boundary is a project invariant, not a preference.
- Don't bypass `withApiErrors` / `ok` — error shape consistency matters for the embedding dashboard.
- Don't read `process.env` directly — go through `@cia/utils` `env`.
