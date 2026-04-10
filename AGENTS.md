<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Snapshot

- Single-app layout: Next.js 16 App Router runs from repo root (`app/**`, `components/**`, `lib/**`).
- Worker runs from `worker/src/**` (BullMQ processors).
- Shared code is organized in root modules (`ai/`, `analytics/`, `db/`, `ingestion/`, `types/`, `ui/`, `utils/`) and linked via local `file:` dependencies.
- Project intentionally supports **embedded no-auth mode** by default; workspace scoping is done by `x-store-id` or `storeId` and fallback `DEFAULT_WORKSPACE_SLUG`.

## Commands That Matter

- Install: `yarn install`
- Web dev: `yarn dev`
- Worker dev: `yarn dev:worker`
- Prisma generate: `yarn db:generate`
- Apply schema quickly (local): `yarn db:push`
- Seed baseline workspace (no ads): `yarn db:seed`
- Full checks: `yarn lint && yarn typecheck && yarn build && yarn build:worker`

## Architecture / Boundaries

- Compliance boundary is explicit: ingestion connectors must only use public or authorized inputs (see `docs/compliance-boundary.md`).
- API/BFF layer lives in `app/api/**` and uses Zod validation + shared DTOs.
- Background processing lives in `worker/src/**`; queue names must stay aligned with `lib/queues.ts`.
- Prisma schema source of truth is `db/prisma/schema.prisma`; do not duplicate model definitions elsewhere.

## Practical Gotchas

- Run `yarn db:generate` after schema edits, before typecheck/build.
- Admin ingestion routes require `x-admin-key`; local default is `local-admin-key` unless overridden.
- If API routes complain about missing workspace/user, run `yarn db:seed` and pass `x-store-id: demo-store`.
- Next App Router dynamic params are promise-based; await `params` in route/page handlers.
