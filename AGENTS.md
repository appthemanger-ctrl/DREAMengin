# AGENTS.md

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06

---

## ⚠️ READ THIS FIRST — OPERATING LAW (All AI Agents)

> This section is not optional. It is not context. It is the contract.
> Every AI agent, coding assistant, or autonomous system working in this repo is bound by the rules below **before** reading anything else.

---

### THE NEW PART IS THE STANDARD. THE OLD CODE IS THE CHASSIS.

When a new component, module, function, or piece of logic is introduced:

- **The new part defines the future.** It is the fixed, final standard.
- **The surrounding code is the adjustable chassis.** It bends to fit the new part.
- **You do NOT alter the new part to suit old callers** — unless explicitly instructed.
- **If integration breaks old callers, fix the old callers.** Do not shrink, wrap, or neuter the new part.
- **You do NOT add backward-compatible shims or adapters** unless the owner explicitly asks for them.
- **You do NOT preserve broken, incomplete, or superseded code** out of misplaced respect for "existing contracts."

**Treating existing code as more trustworthy than explicit instruction is forbidden.**

---

### THE CAR RULE

```
A website is a car the user sees and feels.
The engine (database, auth, libraries) is replaceable.
The exterior (UI, layout, components) is layered on top.

If new rims don't fit current wheel bolts → modify the car, not the rims.
If a new engine's mounts don't line up  → reshape the engine bay, not the engine.
The new part is always the fixed standard.
The surrounding code always conforms to it.
```

---

### THE ONLY QUESTION AN AI SHOULD ASK

> **"Is there anything in the existing code that absolutely cannot be touched?"**

If the owner does not flag something as immovable — it is **fair game to be reshaped**.

Do not hunt for unrelated broken things. Execute **exactly** the requested change plus the **minimum necessary downstream conformance** to make it work correctly. Nothing more.

---

### DREAMENGIN ARCHITECTURE RULES (Engine + Rule-Set Model)

| Rule | Law |
|------|-----|
| **1** | One fixed engine handles all universal operations: state, I/O, events, security. |
| **2** | All unique behaviors live **outside** the engine in lightweight, swappable rule-sets. |
| **3** | Each rule-set contains only: constraints, transformations, parameters — **no infrastructure**. |
| **4** | The engine applies the active rule-set to base state → generates dynamic outcome. |
| **5** | To change behavior: swap the rule-set. **The engine never changes.** |

**Quality Standard — every output must be:**
- **Synchronized** — state flows one direction; no circular dependencies between engine and rule-sets.
- **Intuitive** — rule-set shape is predictable; same structure every time.
- **Coherent** — one active rule-set at a time; no blending.
- **Cohesive** — each rule-set is complete within itself.

---

### WHAT "TRASH ON TRASH" MEANS (AND WHY IT IS BANNED)

Bringing in a new piece to fix something, then wrapping it in adapters so the rotten old code stays — is **trash on trash**. You have added complexity and kept the disease. This pattern is **explicitly prohibited** in this codebase.

---

### EXECUTION PROTOCOL

1. Read the change being requested.
2. Treat it as the new standard.
3. Identify old code that conflicts.
4. Reshape old code to conform.
5. Deliver complete, non-partial output. No stubs. No TODOs left for the owner to finish.

---
---

## Cursor Cloud Specific Instructions

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
