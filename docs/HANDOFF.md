# DREAMengin — AI Handoff Document

> **For the next AI session:** Read this file first. It is the living record of
> what has been built, what is in flight, and what still needs work.

> **⚙️ Auto-updated:** This file is updated automatically after **every push**
> by `.github/workflows/update-handoff.yml` → `scripts/update-handoff.mjs`.
> The workflow prepends a new row with the commit hash, datetime, branch,
> author, every file added/modified/deleted, and the commit message.
> The table keeps exactly the **5 most-recent** entries at all times.
> Do **not** manually renumber rows — the script manages that.

---

## Change Timeline (last 5 entries, newest first)

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-03-05 04:34 UTC | `de5e2a3` | copilot/build-mario-style-game | copilot-swe-agent[bot] | +2 added  ~2 modified<br>chore: plan auto-HANDOFF workflow — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `docs/FEATURE_STATUS.md`, `docs/HANDOFF.md`<br>✏️: `docs/ARCHITECTURE.md`, `docs/SPEC.md` |
| 5 | 2026-03-05 04:30 | `de5e2a3` | `copilot/build-mario-style-game` | copilot | **Supabase env-var fix** — new `lib/supabase/env.ts` centralised resolver; accepts all Vercel-Supabase integration names. Login no longer errors.<br>➕ added: `lib/supabase/env.ts`<br>✏️ modified: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`, `app/auth/callback/route.ts`, `lib/connectors/demo.ts`, `lib/connectors/youtube.ts`, `app/api/innerdreams/config.ts`, `app/api/setup/check/route.ts`, `.env.example`, `README.md` |
| 4 | 2026-03-05 04:06 | `7c9975e` | `copilot/build-mario-style-game` | copilot | **Lint-staged fix** — replaced broken ESLint FlatCompat pre-commit hook with `vitest --related`.<br>✏️ modified: `.husky/pre-commit`, `package.json` |
| 3 | 2026-03-05 *(this session)* | `51f9b0e` | `copilot/build-mario-style-game` | copilot | **Docs: mobile-first + feature status** — ARCHITECTURE §17–18, SPEC §10, HANDOFF.md, FEATURE_STATUS.md created.<br>➕ added: `docs/HANDOFF.md`, `docs/FEATURE_STATUS.md`<br>✏️ modified: `docs/ARCHITECTURE.md`, `docs/SPEC.md` |
| 2 | 2026-02-13 16:52 | `2e2f867` | `completedream` | copilot | **Dr. Eams Platformer** — full Canvas 2D game engine with 3 levels, enemies, coins, moving platforms, particles, lives.<br>➕ added: `lib/game/dreamengin-game.ts`, `components/dreamengin/DrEamsGameCanvas.tsx`, `src/app/game/page.tsx`, `tests/dreamengin-game.test.ts` |

---

## Current Branch

- **Branch:** `copilot/build-mario-style-game`
- **Base:** `completedream`
- **PR purpose:** Mobile-first platform docs + dual-joystick game controls + PS5 gamepad + Supabase env fix + theme reinforcement + feature status tracking

---

## Platform Declaration

**DREAMengin is a mobile-first platform.** Every feature must be designed,
tested, and refined for touch on a smartphone screen first. Desktop and PS5
controller are progressive enhancements on top of the mobile base.

See `docs/ARCHITECTURE.md §17` and `docs/SPEC.md §10` for the full spec.

---

## What Was Done This Session (2026-03-05)

### 1. Supabase env-var resolver (`lib/supabase/env.ts`)
- Created a single `pick()` resolver that tries every naming convention in
  priority order (NEXT_PUBLIC custom → NEXT_PUBLIC standard → server-only
  aliases).
- Wired into `client.ts`, `server.ts`, `proxy.ts`, `app/auth/callback`,
  `lib/connectors/demo.ts`, `lib/connectors/youtube.ts`,
  `app/api/innerdreams/config.ts`, `app/api/setup/check/route.ts`.
- `/api/setup/check` now reports the resolved value (not a single hardcoded
  name) and lists all accepted names in its hints.

### 2. Docs — ARCHITECTURE.md
- Added §17 Mobile-First Platform declaration.
- Added §18 Universal Mobile Remote spec (dual-joystick design + PS5 Gamepad API).

### 3. Docs — SPEC.md
- Updated §1.1 Core Principle to include mobile-first.
- Added §10 Universal Mobile Remote (full dual-joystick spec, all 7 actions, PS5 Gamepad API mapping).

### 4. Game engine — InputState expansion
- Added `duck`, `spin`, `shoot`, `actionTap` to `InputState`.
- Added `ducking` flag to `Player`.
- Duck lowers hitbox height; spin/shoot wired for power-up use.

### 5. Game canvas — dual-joystick + PS5
- Replaced 3-button VPad with two circular thumbstick pads (left = move, right = directional actions).
- Right stick: up → jump, left → spin, right → shoot, down → duck, tap → action.
- Added PS5 Gamepad API polling loop.
- Disabled browser pinch-zoom on the canvas.
- Updated title screen hint text to reflect touch controls.

### 6. Game page — viewport + controls card
- Added `viewport` export to disable user-scalable zoom.
- Updated controls card to list all 7 actions + PS5 button mapping.

### 7. Docs — FEATURE_STATUS.md (new)
- Full feature inventory: done / partly done / needs work / needs upgrade.

### 8. Docs — HANDOFF.md (this file)
- Created with timeline, platform declaration, session summary.

---

## Key File Map (for the next session)

| Area | Files |
|------|-------|
| Game engine (pure logic) | `lib/game/dreamengin-game.ts` |
| Game canvas renderer | `components/dreamengin/DrEamsGameCanvas.tsx` |
| Game page | `src/app/game/page.tsx` |
| Game tests | `tests/dreamengin-game.test.ts` |
| Supabase env resolver | `lib/supabase/env.ts` |
| Supabase client (browser) | `lib/supabase/client.ts` |
| Supabase client (server) | `lib/supabase/server.ts` |
| Session proxy / middleware | `proxy.ts` |
| Feature status | `docs/FEATURE_STATUS.md` |
| Design spec | `docs/SPEC.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Theme tokens | `app/globals.css`, `tailwind.config.ts` |
| Home Buttons state machine | `lib/home-buttons/home-buttons-state.ts` |
| Golden Button UI | `components/dreamnav/DreamNavControls.tsx` |

---

## Open Issues / Next Priorities

1. **Theme consistency** — blue + gold gradient must be applied to every Daydream
   page, Shop, Profile, and all settings screens. Currently only the game page
   and landing are fully themed.
2. **Dual-joystick haptics** — PS5 DualSense haptic feedback via the Gamepad API
   vibration extension when stomping enemies or collecting coins.
3. **Daydream entry loops** — each of the 7 Daydreams needs at least 1-2 working
   core interactions (most are scaffold pages only).
4. **Feed system** — widget feed resolver is wired but feed items are demo-only.
5. **Monetisation** — Shop and Marketplace are UI-only; payment integration pending.
6. **Music Studio** — audio recorder and upload exist but are not connected to
   the feed/publish pipeline.
7. **Connectors** — YouTube and demo connectors exist; IG, Spotify not yet built.
