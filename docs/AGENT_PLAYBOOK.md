# DREAMengin — Agent Session Playbook

**Read this at the start of every session.**  
Last updated: 2026-03-10

This is the single document an AI agent or developer reads before touching code in this repo. It covers orientation, all runnable commands, the key file map, how to verify changes don't break anything, how to see the UI, and a session state tracker.

---

## 1. What This Codebase Is

DREAMengin is a **spatial, privacy-first creative OS** — not a traditional website or social app.

- Built with **Next.js 16+ (App Router) + TypeScript + Supabase + Tailwind CSS**
- Users own a private **HomeDream** (operating surface), a private **EditProfileDream** (builder), and a public **ViewProfile** (shared output)
- All content lives inside modular **Dreams** (interactive widgets with real capability)
- Six **Daydream / Engin pairs** are mini-apps inside the OS — each has a Daydream side (the user's creative space) and an Engin side (the tooling/capability engine):
  1. **Music Daydream** / **StarMakerEngin** — music creation, organisation, projects
  2. **Games Daydream** / **GameEngin** — gaming experiences
  3. **Lab Daydream** / **LabEngin** — experimental tools and lab workspace
  4. **Code Daydream** / **CodeEngin** — code creation and management
  5. **Brand Daydream** / **BrandingEngin** — branding tools
  6. **Create Daydream** / **ContentEngin** — content creation and publishing
- Three AI agents: **Dr. Eams** (user assistant), **IDARi** (admin fixer), **TheBoogieMan** (policy enforcer)
- Navigation is **gesture/τ-based** — not browser routing; the **Golden Button** is the only travel system

**The single source of truth for what the product is:** `README.md` (always authoritative).

**The binding AI build constraint:** `docs/GENERATION_LAW.md` — compute χ and select a mode before every generation pass.

---

## 2. Non-Negotiable Rules

These five axioms and guardrails apply to every change:

| # | Rule | What it means in code |
|---|------|----------------------|
| 1 | Instant Understanding | No tutorial required; UI self-reveals |
| 2 | User-Shaped Space | Drag/place controls, not settings panels |
| 3 | Real Capability | Every Dream does real work |
| 4 | Security by Default | RLS everywhere; no secrets to browser |
| 5 | Privacy by Design | Private by default; user owns all data |

**Additional guardrails (from `docs/engineering/guardrails.md`):**
- `README.md` is the product authority — never override it with this file
- Favor spec names over legacy repo wording
- Repurpose existing systems before adding new ones
- Keep HomeDream source logic separate from ViewProfile output logic
- Keep Node 24, pnpm, Next.js 16+, and Supabase stable unless a real need exists

---

## 3. Canonical Names

Always use these names — not old/legacy variations:

| Canonical Name | Route | Legacy/support routes |
|----------------|-------|-----------------------|
| HomeDream | `/homedream` | `/home` |
| EditProfileDream | `/edit-profiledream` | `/edit-profile` |
| ViewProfile | `/view-profile` | `/profile/[handle]`, `/u/[handle]` |
| **Music Daydream / StarMakerEngin** | `/daydream/music` | — |
| **Games Daydream / GameEngin** | `/daydream/games` | — |
| **Lab Daydream / LabEngin** | `/daydream/lab` | — |
| **Code Daydream / CodeEngin** | `/daydream/code` | — |
| **Brand Daydream / BrandingEngin** | `/daydream/brand` | — |
| **Create Daydream / ContentEngin** | `/daydream/create` | — |
| DreamShop | `/shop` | — |
| DreamMarketplace | `/marketplace` | — |
| DreamDM | `/messages` | — |
| DreamAds | `/ads` | `/ads/create` |
| Dr. Eams | `/api/ai/eams` | `/api/dr-eams/*` |
| IDARi | `/api/ai/idari` | — |
| TheBoogieMan.Ai | `/api/ai/boogieman` | — |

> **Legacy Daydream routes** (repurpose, do not treat as canonical product surfaces):  
> `/daydream/analytics`, `/daydream/media-vault`, `/daydream/play`

---

## 4. Tech Stack Quick Reference

> Versions use `^` (caret) = minimum compatible version as declared in `package.json`. The `pnpm` and Node versions are exact/pinned requirements.

| Category | Tool | Min version |
|----------|------|-------------|
| Framework | Next.js (App Router) | ^16.1.0 |
| Language | TypeScript | ^5.9.3 |
| UI | React | ^19.0.0 |
| Styling | Tailwind CSS | ^3.4.19 |
| Animation | Framer Motion | ^12.35.0 |
| 3D | Three.js + React Three Fiber | ^0.167.0 / ^9.5.0 |
| Icons | Lucide React | ^0.577.0 |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime + Storage) | ^2.97.0 |
| Validation | Zod | ^4.3.6 |
| Package manager | pnpm | **10.30.0** (exact) |
| Node | Node.js | **24.x** (exact major) |
| Unit tests | Vitest | (devDep — see `package.json`) |
| E2E tests | Playwright | (devDep — see `package.json`) |
| Linter | ESLint 9 + next/lint | ^9.0.0 |
| Container | Docker + Docker Compose | — |
| Deployment | Vercel (primary) | — |

---

## 5. All Runnable Commands

**Always run `pnpm install` first in a fresh environment before any other command.**

```bash
# Install dependencies (required in fresh clone or after dependency changes)
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production (full type-check + bundle)
pnpm build

# Start production server (requires build to have run first)
pnpm start

# TypeScript type-check only (no emit — fast way to catch type errors)
pnpm typecheck

# ESLint — lint the entire project
pnpm lint

# Run unit tests (Vitest — runs all *.test.ts files except e2e and playwright specs)
pnpm exec vitest run

# Run unit tests in watch mode (interactive, good during development)
pnpm exec vitest

# Run a single test file
pnpm exec vitest run tests/home-buttons.test.ts

# Run E2E tests (Playwright — requires dev server running or will start it)
pnpm exec playwright test

# Run E2E tests in headed mode (you can see the browser)
pnpm exec playwright test --headed

# Open Playwright HTML report after test run
pnpm exec playwright show-report

# Generate/update BUGS.md from current FEATURE_STATUS.md
node scripts/update-bugs.mjs

# GitHub report-driven coding agent (run from GitHub Actions)
# Workflow: .github/workflows/report-driven-coding-agent.yml

# Validate deployment readiness
node validate-deployment.js

# Check licenses
node scripts/check-licenses.mjs
```

### Expected healthy state

| Command | Expected result |
|---------|----------------|
| `pnpm typecheck` | Exit 0, no errors |
| `pnpm lint` | Exit 0, no errors (or only warnings) |
| `pnpm exec vitest run` | All tests pass |
| `pnpm build` | Builds successfully |

---

## 6. Key File Map

This section maps the most important files and what they do. Read this before searching for where to make a change.

### Entry points and routing

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout — wraps all pages, global providers |
| `app/page.tsx` | Landing/home page entry |
| `app/homedream/page.tsx` | HomeDream (canonical private OS surface) |
| `app/edit-profiledream/page.tsx` | EditProfileDream (canonical profile builder) |
| `app/view-profile/page.tsx` | ViewProfile (canonical public output) |
| `app/profile/[handle]/page.tsx` | Public profile by handle (current shared destination) |
| `app/daydream/music/page.tsx` | **Music Daydream / StarMakerEngin** — music creation & projects |
| `app/daydream/games/page.tsx` | **Games Daydream / GameEngin** — gaming experiences |
| `app/daydream/lab/page.tsx` | **Lab Daydream / LabEngin** — experimental tools & lab workspace |
| `app/daydream/code/page.tsx` | **Code Daydream / CodeEngin** — code creation & management |
| `app/daydream/brand/page.tsx` | **Brand Daydream / BrandingEngin** — branding tools |
| `app/daydream/create/page.tsx` | **Create Daydream / ContentEngin** — content creation & publishing |
| `app/daydream/analytics/page.tsx` | Legacy — repurpose, not a canonical product surface |
| `app/daydream/media-vault/page.tsx` | Legacy — repurpose, not a canonical product surface |
| `app/daydream/play/page.tsx` | Legacy — repurpose, not a canonical product surface |
| `app/messages/page.tsx` | DreamDM |
| `app/shop/page.tsx` | DreamShop |
| `app/marketplace/page.tsx` | DreamMarketplace |
| `app/ads/page.tsx` | DreamAds |

### API routes

| File | Purpose |
|------|---------|
| `app/api/ai/eams/route.ts` | Dr. Eams AI endpoint |
| `app/api/ai/idari/route.ts` | IDARi admin endpoint |
| `app/api/ai/boogieman/route.ts` | TheBoogieMan enforcement |
| `app/api/messages/route.ts` | DreamDM messaging API |
| `app/api/shop/route.ts` | DreamShop API |

### Core UI components

| File | Purpose |
|------|---------|
| `components/HomeRadialNav.tsx` | Golden Button radial nav (primary travel system) |
| `components/menus/*` | DreamMenu system (left: Daydreams, right: settings) |
| `components/dreamnav/*` | Dream navigation components |
| `components/dreams/DreamShell.tsx` | Layer 1 — visual shell, naming, size, placement |
| `components/dreams/DreamConnectorLayer.tsx` | Layer 2 — auth state, provider identity |
| `components/dreams/DreamFeatureLayer.tsx` | Layer 3 — active modules per connector |
| `components/dreams/DreamOutputLayer.tsx` | Layer 4 — saved profile-safe output |
| `components/dreams/SuperDreamWidget.tsx` | Automated full-stack Dream composition |
| `components/home/*` | HomeDream-specific components |
| `components/profile/*` | Profile components (EditProfileDream / ViewProfile) |

### Libraries and utilities

| File | Purpose |
|------|---------|
| `lib/supabase/` | Supabase client setup (browser, server, env resolution) |
| `lib/supabase/env.ts` | Env var resolution — reads NEXT_PUBLIC_ vars safely |
| `lib/agents/` | AI agent helpers (Dr. Eams, IDARi, TheBoogieMan) |
| `lib/navigation/` | τ-navigation system (deterministic state machine) |
| `hooks/` | Custom React hooks |
| `types/widget-system-v2.ts` | Core Dream/widget type definitions |
| `utils/` | General utility functions |

### Configuration

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js config |
| `tailwind.config.ts` | Tailwind + design tokens |
| `tsconfig.json` | TypeScript config (`@/` alias → project root) |
| `eslint.config.mjs` | ESLint rules |
| `vitest.config.ts` | Vitest — runs `**/*.test.ts`, excludes e2e |
| `playwright.config.ts` | Playwright — E2E, `tests/e2e/`, baseURL `localhost:3000` |
| `.env.example` | All required environment variables (copy to `.env.local`) |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | **Master product spec — always authoritative** |
| `docs/AGENT_PLAYBOOK.md` | **This file — read at session start** |
| `docs/GENERATION_LAW.md` | **AI build constraint — compute χ before every pass** |
| `docs/PRODUCT_DEFINITION.md` | **Phase 7 — Locked product definition (what DREAMengin is and is not)** |
| `docs/NAMING_AUTHORITY.md` | **Phase 7 — Locked naming authority (canonical names, validation rules)** |
| `docs/CONSTITUTION.md` | **Phase 7 — Locked product constitution (binding rules for all systems)** |
| `docs/ARCHITECTURE.md` | How repo maps to spec; route and implementation zones |
| `docs/FEATURE_STATUS.md` | Live feature completion matrix (✅/🟡/⏳) |
| `docs/BUGS.md` | Auto-generated bugs tracker (run `node scripts/update-bugs.mjs`) |
| `docs/LAW.md` | Binding rules — code must conform |
| `docs/AXIOMS.md` | The 5 non-negotiable axioms |
| `docs/SECURITY.md` | RLS, auth, privacy model |
| `docs/THEME.md` | Gold + light blue + white design language |
| `docs/COPILOT_TOOLKIT.md` | Agent working rules summary |
| `docs/engineering/guardrails.md` | Engineering constraints |
| `docs/IDARI_CONTRACT.md` | IDARi operational contract |
| `docs/HANDOFF.md` | Session-by-session change log |

### Tests

| File | Purpose |
|------|---------|
| `tests/home-buttons.test.ts` | HomeDream button/navigation behavior |
| `tests/dreamnav.tau.test.ts` | τ-navigation deterministic state tests |
| `tests/boogieman.test.ts` | TheBoogieMan policy enforcement |
| `tests/boogie-policy-module.test.ts` | Policy module tests |
| `tests/dream-state.test.ts` | Dream state management |
| `tests/widget-install-flow.test.ts` | Widget/Dream install flow |
| `tests/hero-sprite.test.ts` | Hero sprite rendering |
| `tests/idari-patch-plan.test.ts` | IDARi patch planning |
| `tests/admin-lockout.test.ts` | Admin lockout logic |
| `tests/branding-logos.test.ts` | Brand logo system |
| `tests/icons.test.ts` | Icon system |
| `tests/dev-bypass.test.ts` | Dev auth bypass (never in production) |
| `tests/dreamengin-game.test.ts` | Game system |
| `tests/phase7-naming.test.ts` | **Phase 7 — Canonical naming authority validation** |
| `tests/e2e/demo.spec.ts` | Playwright E2E demo |
| `tests/e2e/full-coverage.spec.ts` | Playwright full coverage E2E |

---

## 7. File Interaction Map

How key files relate to each other — consult this when a change in one file may affect another.

```
README.md
  └─ is the spec for everything below

app/layout.tsx
  └─ wraps all routes; global Supabase provider, theme, fonts

lib/supabase/env.ts  ←  reads process.env NEXT_PUBLIC_* vars
  └─ used by lib/supabase/browser.ts and lib/supabase/server.ts
       └─ used by all app/api/* routes and auth-gated pages

components/HomeRadialNav.tsx
  └─ golden button navigation — all pages link back through this
  └─ imports from lib/navigation/ (τ-state machine)

components/dreams/* (DreamShell → ConnectorLayer → FeatureLayer → OutputLayer)
  └─ all Dreams (widgets) must pass through these 4 layers
  └─ OutputLayer feeds into components/profile/* (ViewProfile)
  └─ ConnectorLayer uses lib/supabase/browser.ts (auth state)

app/homedream/page.tsx
  └─ renders components/home/* + components/HomeRadialNav
  └─ uses hooks/ for Dream state, feed wiring

app/edit-profiledream/page.tsx
  └─ renders components/profile/ProfileEditor
  └─ saves to Supabase via app/api/* routes
  └─ projection output → ViewProfile (app/view-profile, app/profile/[handle])

app/api/ai/eams/route.ts
  └─ server-side; requires OPENAI_API_KEY or GROQ_API_KEY (never NEXT_PUBLIC_)
  └─ called by components/AIAssistant.tsx and components/DrEamsVoiceAssistant.tsx

types/widget-system-v2.ts
  └─ core type definitions used throughout components/dreams/* and components/widgets/*

tailwind.config.ts
  └─ design tokens used by all components (de-sky-bg, de-surface, de-widget, de-gold-*)
  └─ changing tokens here affects the entire visual system
```

---

## 8. Design System Rules

Any UI change must respect these:

- **Colors:** Sky-blue + gold gradient, frosted glass surfaces — no dark/gamer colors, no plain indigo
- **CSS classes:** `.de-sky-bg`, `.de-surface`, `.de-widget` for glass cards
- **Font:** Space Grotesk
- **Radii:** 6 / 10 / 14 / 18 / 24 / 32 / 9999 px — use the token, not arbitrary values
- **Motion:** Framer Motion, restrained — not every element should animate
- **Layout:** Mobile-first, responsive; all interactive elements must work on mobile

---

## 9. How to See the UI Render

### Local development (recommended)

```bash
# 1. Copy env vars (first time only)
cp .env.example .env.local
# Edit .env.local with real Supabase keys

# 2. Install dependencies
pnpm install

# 3. Start dev server
pnpm dev

# 4. Open in browser
# http://localhost:3000
```

Dev server supports hot-reload — changes appear immediately without restart.

### Key pages to visually verify after changes

| Change area | URL to check |
|-------------|-------------|
| Navigation | `http://localhost:3000/homedream` |
| Profile builder | `http://localhost:3000/edit-profiledream` |
| Public profile | `http://localhost:3000/view-profile` |
| Music Daydream / StarMakerEngin | `http://localhost:3000/daydream/music` |
| Games Daydream / GameEngin | `http://localhost:3000/daydream/games` |
| Lab Daydream / LabEngin | `http://localhost:3000/daydream/lab` |
| Code Daydream / CodeEngin | `http://localhost:3000/daydream/code` |
| Brand Daydream / BrandingEngin | `http://localhost:3000/daydream/brand` |
| Create Daydream / ContentEngin | `http://localhost:3000/daydream/create` |
| Shop | `http://localhost:3000/shop` |
| Messages | `http://localhost:3000/messages` |

### E2E browser testing (automated UI verification)

```bash
# Run Playwright E2E tests (starts dev server automatically)
pnpm exec playwright test

# Run with visible browser window (watch the UI render live)
pnpm exec playwright test --headed

# Debug a specific test interactively
pnpm exec playwright test --debug tests/e2e/demo.spec.ts

# Open Playwright UI explorer
pnpm exec playwright test --ui

# View HTML test report
pnpm exec playwright show-report
```

---

## 10. Pre-Commit Checklist — Guarantee Nothing Breaks

Run this before every commit or PR:

```bash
# Step 1 — Type safety
pnpm typecheck
# Expected: exit 0, no type errors

# Step 2 — Lint
pnpm lint
# Expected: exit 0 (warnings OK, errors not OK)

# Step 3 — Unit tests
pnpm exec vitest run
# Expected: all tests pass

# Step 4 — Build check (catches SSR/bundler errors typecheck misses)
pnpm build
# Expected: builds successfully

# Step 5 — Visual verification (at least these two pages)
# Start: pnpm dev
# Check: http://localhost:3000/homedream
# Check: http://localhost:3000/view-profile
```

**If any step fails:**
1. Fix the failure before proceeding
2. Re-run only the failing step after the fix to confirm
3. If a pre-existing failure exists (unrelated to your change), document it in `docs/BUGS.md`

---

## 11. Privacy & Security Rules (Apply to Every Code Change)

- **Never** send `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, or any secret to the browser
- **Only** `NEXT_PUBLIC_` prefixed vars are available in the browser bundle
- In Next.js, `process.env[dynamicVar]` does NOT work in the browser — use literal `process.env.NEXT_PUBLIC_FOO`
- **RLS must be enabled** on every Supabase table that stores user data
- **Nothing becomes public** without explicit user intent — always default to private
- **Auth bypass** (`NEXT_PUBLIC_DEV_BYPASS_AUTH`) is dev-only, never deploy to production

---

## 12. Session State Tracker

**Update this section when handed a multi-session task.** This is the only place to track work-in-progress across sessions.

### Current focus

Phase 6 — Platform Completion: AI Triad Integration, Privacy System Enforcement, and Module Consolidation.  
Full spec: `docs/dreamengin_phase6.md`

### Files modified in this sprint

- `docs/dreamengin_phase6.md` — created Phase 6 specification (50-point spec)
- `docs/FEATURE_STATUS.md` — updated to reflect Phase 6 status and priorities
- `docs/AGENT_PLAYBOOK.md` — updated Session State Tracker for Phase 6
- `docs/BUGS.md` — added Phase 4 carry-over gaps and marked resolved items
- `docs/alignment/DOCS_CHANGE_TRACKER.md` — recorded Phase 6 documentation pass
- `components/daydream/GameEngin.tsx` — created GameEngin (Games Daydream Side B Engin)
- `components/daydream/DaydreamShell.tsx` — added `sideBComponent` prop
- `lib/daydream/useDaydreamState.ts` — created shared Daydream/Engin state hook
- `app/daydream/games/page.tsx` — wired GameEngin as sideBComponent

### Completed this sprint

- [x] Created `docs/dreamengin_phase6.md` — full 50-point Phase 6 spec
- [x] Updated `docs/FEATURE_STATUS.md` — Phase 6 current state and 12-point priority list
- [x] Updated `docs/AGENT_PLAYBOOK.md` Section 12 — Phase 6 session context
- [x] Updated `docs/BUGS.md` — documented and resolved missing Phase 4 carry-over items
- [x] Updated `docs/alignment/DOCS_CHANGE_TRACKER.md` — Phase 6 documentation pass
- [x] Created `components/daydream/GameEngin.tsx` — Games Daydream Side B (Phase 6 point 33)
- [x] Created `lib/daydream/useDaydreamState.ts` — shared Daydream/Engin state hook (Phase 6 point 34)
- [x] Added `sideBComponent` prop to `DaydreamShell` (Phase 6 point 35)
- [x] Wired `GameEngin` into `app/daydream/games/page.tsx`

### Remaining this sprint

Phase 6 code implementation (remaining items for a subsequent session):
- [ ] Integrate Dr. Eams as HomeDream search bar with send-to-DreamDM routing
- [ ] Enforce IDARi admin-guard under dev bypass
- [ ] Wire TheBoogieMan privacy-event logging for visibility changes
- [ ] Consult `visibility_mappings` before rendering content on ViewProfile
- [ ] Separate private-save and explicit-share flows in EditProfileDream
- [ ] Unify DreamMenu under a single canonical implementation
- [ ] Separate user DreamAds from platform promotions in code and UI language
- [ ] Repurpose legacy Daydream routes (analytics, media-vault, play)
- [ ] Real-capability audit: replace all fake actions with real ones

### Known issues / blockers

- Pre-existing TypeScript type errors exist in the `completedream` base branch (Supabase table type mismatches in `app/api/comments/route.ts`, `app/api/game-scores/route.ts`, `app/api/ai/execute/route.ts`, and others). These are pre-existing and unrelated to Phase 6 changes.

### Handoff note for next session

Phase 6 documentation is complete and three Phase 4 carry-over code items are resolved (GameEngin.tsx, useDaydreamState hook, DaydreamShell sideBComponent prop). The next session should continue Phase 6 code work starting with Dr. Eams HomeDream integration, then IDARi admin-guard enforcement, then ViewProfile visibility_mappings consultation. Use `docs/dreamengin_phase6.md` as the acceptance checklist — all 50 points must pass before Phase 7 begins.

---

## 13. How to Update This Document

This playbook should be updated whenever:
- New top-level routes, features, or systems are added
- Dependencies are added, removed, or version-pinned
- Test commands change
- A new canonical name is established
- Key files are renamed or moved
- A new permanent rule or guardrail is established

**Do not update this file to track session-specific progress** — use Section 12 for that.

After updating, change the `Last updated:` date at the top.

---

## 14. Quick Reference Card

```
Master spec:       README.md
Feature status:    docs/FEATURE_STATUS.md
Bugs tracker:      docs/BUGS.md   (auto-generated — run node scripts/update-bugs.mjs)
Architecture:      docs/ARCHITECTURE.md
Rules:             docs/LAW.md
Build constraint:  docs/GENERATION_LAW.md  (χ + residual audit)
Design:            docs/THEME.md
Security:          docs/SECURITY.md
AI agents:         docs/DR_EAMS.md, docs/IDARI_CONTRACT.md, docs/BOOGIEMAN_POLICY.md
GitHub coding agent: .github/workflows/report-driven-coding-agent.yml
Advanced game targets: config/advanced-game-targets.json

Phase 7 authority:
  Product identity:  docs/PRODUCT_DEFINITION.md  (what DREAMengin is and is not)
  Naming authority:  docs/NAMING_AUTHORITY.md     (canonical names, validation rules)
  Constitution:      docs/CONSTITUTION.md         (binding rules for every system)
  Naming library:    lib/identity/canonical-names.ts

Dev server:        pnpm dev        → http://localhost:3000
Type check:        pnpm typecheck
Lint:              pnpm lint
Unit tests:        pnpm exec vitest run
E2E tests:         pnpm exec playwright test
Build:             pnpm build

Path alias:        @/ → project root (configured in tsconfig.json)
DB/Auth:           Supabase — config in lib/supabase/
Env template:      .env.example → copy to .env.local

Canonical Daydream / Engin pairs:
  /daydream/music   → Music Daydream  / StarMakerEngin
  /daydream/games   → Games Daydream  / GameEngin
  /daydream/lab     → Lab Daydream    / LabEngin
  /daydream/code    → Code Daydream   / CodeEngin
  /daydream/brand   → Brand Daydream  / BrandingEngin
  /daydream/create  → Create Daydream / ContentEngin
  (analytics, media-vault, play are legacy — repurpose, not canonical)
```
