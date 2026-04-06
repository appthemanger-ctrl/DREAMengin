# AGENTS.md

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


## Cursor Cloud specific instructions

### Overview

DREAMengin is a Next.js 16+ / React 19 / Supabase spatial operating environment. The primary application is in the workspace root (`app/`, `components/`, `lib/`). There is also a secondary Express backend in `backend/` (social aggregator) and a legacy Vite frontend in `frontend/` — both are optional.

### Node / Package Manager

- **Node 24** (as specified in `Dockerfile.dev`). Use `nvm use 24`.
- **pnpm 10.30.0** is the package manager (`pnpm-lock.yaml`). Enable via `corepack enable pnpm`.
- esbuild requires its build script to run. This is configured via `onlyBuiltDependencies: [esbuild]` in `pnpm-workspace.yaml`.

### Key Commands

See `package.json` scripts. Quick reference:

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` (port 3000) |
| Lint | `pnpm lint` |
| Type check | `pnpm typecheck` |
| Tests | `pnpm test` |
| Full preflight | `pnpm preflight` |

### Dev Auth Bypass

Set `DEV_BYPASS_AUTH=true` and `DEV_ADMIN=true` in `.env.local` to skip Supabase authentication for local UI inspection. These flags are server-only and hard-blocked in production.

### Supabase

The app gracefully degrades when Supabase is unavailable — the auth proxy skips session refresh. For full functionality, either run `supabase start` (local stack) or point `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to a hosted project. Docker Compose (`docker-compose.yml`) provides a PostgreSQL 15 alternative.

### Pre-existing Test Failures

4 tests in `tests/dreamdm-bar-interactions.test.ts` (`snapSplitRatioOnRelease` suite) fail due to logic mismatches between tests and implementation. These are pre-existing and unrelated to environment setup.

### Lint Warnings

ESLint runs with 0 errors; ~29 warnings (mostly `prefer-const`, `@next/next/no-img-element`, `jsx-a11y/alt-text`). The ESLint config intentionally downgrades these to warnings per `eslint.config.mjs`.

### Git Hooks

- **pre-commit**: runs `pnpm lint-staged` (exits 0 on failure — non-blocking).
- **pre-push**: runs `pnpm preflight` (typecheck + lint + tests — blocking).
