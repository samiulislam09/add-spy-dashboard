# Competitor Ad Intelligence

Production-structured ad intelligence SaaS app for competitor ad discovery, messaging analysis, trend tracking, ingestion pipelines, and alerting.

## What this includes

- Modern Next.js App Router frontend (`app`, `components`, `lib`) with polished analytics UX
- Typed API/BFF route handlers with Zod validation
- Prisma + MySQL domain model covering advertisers, ads, snapshots, messaging analysis, collections, saved searches, alerts, and ingestion operations
- Connector-based ingestion architecture (`ingestion/src`) with mock, CSV, and JSON connectors
- BullMQ worker (`worker/src`) for sync, snapshots, dedupe, analysis, and alert generation
- Deterministic messaging analysis engine with optional OpenAI enhancement (`ai/src`)
- Embedded **no-auth** mode by default with workspace scoping via `x-store-id` / `storeId`

## Project structure

```text
app/                        # Next.js frontend + route handlers
components/                 # App UI components
lib/                        # App services and helpers
worker/                     # BullMQ processors
ai/                         # Messaging analysis heuristics + optional LLM
analytics/                  # KPI and chart data shaping
db/                         # Prisma schema, client, seed scripts
ingestion/                  # Connector interface + pipeline
types/                      # Shared Zod DTOs
ui/                         # Reusable UI components + chart wrappers
utils/                      # Env parsing, hashing, object storage abstraction
docs/
  compliance-boundary.md
```

## Stack

- Frontend: Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn-style UI primitives, TanStack Query, Zustand, Framer Motion
- Backend: Next.js route handlers, Zod validation, Prisma, MySQL
- Jobs: BullMQ + Redis
- Storage: S3-compatible object storage abstraction (`@cia/utils`)

## Compliance boundary

This codebase supports only public or authorized sources. See `docs/compliance-boundary.md`.

- Allowed: public ad transparency sources + explicit customer import files (CSV/JSON)
- Not allowed: hidden-login scraping, anti-bot evasion, private data collection

## Local setup

### 1) Prerequisites

- Node.js 20+
- Yarn 1.x
- MySQL 8+
- Redis 7+

### 2) Environment

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

### 3) Install and prepare DB

```bash
yarn install
yarn db:generate
yarn db:push
yarn db:seed
```

### 4) Run app + worker

Terminal A:

```bash
yarn dev
```

Terminal B:

```bash
yarn dev:worker
```

Open `http://localhost:3000`.

## Useful commands

- `yarn dev` - run web app
- `yarn dev:worker` - run worker
- `yarn db:generate` - Prisma client generation
- `yarn db:push` - push schema to local DB
- `yarn db:seed` - reset baseline workspace (no dummy ads)
- `yarn lint` - lint app + worker
- `yarn typecheck` - TS checks
- `yarn build` - Prisma generate + web build
- `yarn build:worker` - worker build

## Embedded no-auth mode

Authentication is optional and disabled by default (`ENABLE_AUTH=false`).

Workspace resolution order:

1. `x-store-id` request header
2. `storeId` / `store_id` query param
3. `DEFAULT_WORKSPACE_SLUG`

Admin ingestion endpoints require `x-admin-key` (default local key: `local-admin-key`).

## Real Meta Ad Library data

`META_PUBLIC` now supports runtime ingestion from Meta Ad Library API.

1. Set `META_AD_LIBRARY_ACCESS_TOKEN` in `.env`.
2. In **Ingestion Admin**, create a source of type `META_PUBLIC`.
3. Provide `metaSearchTerms` (comma-separated) and optional `metaCountries`.
4. Trigger **Backfill** with worker running (`yarn dev:worker`).

If token/terms are missing, ingestion run will fail with explicit error details in Run History.

## API highlights

- `GET /api/auth/status`
- `GET /api/health`
- `GET /api/advertisers`, `GET /api/advertisers/:id`
- `GET /api/ads`, `GET /api/ads/:id`, `GET /api/ads?format=csv`
- `GET /api/compare`
- `GET/POST /api/collections`
- `GET/POST /api/saved-searches`
- `GET/POST /api/alerts`
- `GET /api/admin/ingestion/runs`
- `POST /api/admin/ingestion/sources`
- `POST /api/admin/ingestion/retry`
- `POST /api/admin/ingestion/backfill`

## Architecture decisions

1. **No-auth first**: optimized for embedding inside a parent dashboard while preserving workspace data scoping.
2. **Connector boundary**: ingestion is pluggable through an explicit interface and compliance guardrails.
3. **API + worker split**: request/response paths stay fast while heavy tasks run in BullMQ workers.
4. **Typed shared contracts**: Zod DTOs and shared module boundaries keep frontend/backend in sync.
5. **No dummy seed policy**: baseline seed creates workspace only; ad data must come from real sources.

## Notes / current limitations

- Connector implementations are production-structured; `META_PUBLIC` is wired for runtime by default.
- Object storage abstraction is implemented; local dev may use noop mode if S3 env vars are omitted.
- Rule/action authorization is admin-key based in no-auth mode; add full auth middleware before public internet exposure.
