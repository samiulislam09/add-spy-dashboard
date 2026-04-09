<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Snapshot

- Single-package Next.js app on `next@16.2.3` + `react@19.2.4` with App Router only (`app/`), no `pages/` tree.
- TypeScript is strict (`tsconfig.json`), no emit.
- Styling uses Tailwind CSS v4 (`@import "tailwindcss"` in `app/globals.css`) through PostCSS (`@tailwindcss/postcss`).
- Use Yarn commands for consistency (`yarn.lock` v1 is checked in).

## Commands (Source of Truth: `package.json`)

- `yarn dev` - start local dev server.
- `yarn lint` - run ESLint via flat config (`eslint.config.mjs`).
- `yarn build` - production build sanity check.
- `yarn start` - run the production server after build.
- `yarn tsc --noEmit` - manual typecheck (there is no `typecheck` script).
- No test runner is configured yet (no `test` script / test config files in repo).

## Working Rules For Agents

- Before changing Next.js behavior, read the matching docs under `node_modules/next/dist/docs/` (especially `01-app/` for App Router work).
- Trust executable config over template prose: `README.md` is default create-next-app text; follow `package.json`, `tsconfig.json`, and `eslint.config.mjs`.
- Main entrypoints are small and centralized: `app/layout.tsx` (root shell + fonts), `app/page.tsx` (home route), `app/globals.css` (global theme/css).
- Recommended quick verification for non-trivial changes: `yarn lint && yarn tsc --noEmit && yarn build`.
