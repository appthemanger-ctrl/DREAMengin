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

## ⚠️ Hard Rules for Every AI Session (read before anything else)

These are not suggestions. Violating them invalidates the session's work.

1. **Read ALL docs first.** Before touching any file, read every document in `docs/`.
   Priority order: `LAW.md` → `AXIOMS.md` → `SECURITY.md` → `WIDGET_SYSTEM_V2.md` →
   `ARCHITECTURE.md` → `SPEC.md` → `HANDOFF.md` → `FEATURE_STATUS.md` → `BUGS.md` → `DR_EAMS.md`.
   The trigger phrase **"read the docs"** means read *every* file in `docs/`.

2. **Always work on the `completedream` branch directly.**
   Do NOT create new feature branches or open new PRs — commit and push all changes
   straight to `completedream`. This keeps Vercel preview deployments to a minimum and
   ensures every session's work lands immediately in the main working branch.
   To switch: `git fetch origin completedream && git checkout -b completedream FETCH_HEAD`

3. **Do not delete documentation for features you did not complete.**
   If a feature is documented but unfinished, that documentation stays.
   Removing it wastes the next session's time. See `docs/LAW.md §9.1`.

4. **Remove fixed bugs from `docs/BUGS.md` when you fix them.**
   `BUGS.md` is a live open-issue log, not a historical archive.
   Fixed = entry deleted. Not fixed = entry untouched. See `docs/LAW.md §9.2`.

5. **Never use dark-gamer backgrounds on landing/auth pages.**
   The design system is sky-blue + gold. `bg-[#070b16]` on the landing page is an
   explicit anti-pattern (SPEC.md §9). Use transparent `<main>` + the body gradient.

6. **Finish what you start.** If a session runs out of context, document exactly what
   was completed and what remains open in the "What Was Done" section below and in
   `docs/BUGS.md`. Do not leave silent half-states.

---

## Change Timeline (last 5 entries, newest first)

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-03-05 14:23 UTC | `668da29` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #97 from appthemanger-ctrl/copilot/update-idari-restrictions — feat: implement Idari System Contract — unlock admin intents, add daily workflow and Copilot toolkit<br> |
| **auto** | 2026-03-05 14:22 UTC | `48e313b` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #98 from appthemanger-ctrl/copilot/update-landing-page-logo-hero — [WIP] Update landing page logo hero with humorous messages<br> |
| **auto** | 2026-03-05 14:00 UTC | `f0201aa` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #96 from appthemanger-ctrl/copilot/fix-253588904-1134112346-beb1ece3-e1a0-45a5-806a-ef63e60eece0 — Read all docs + apply de-sky-bg to 9 remaining pages + add Forgot Password + document completedream branch rule<br> |
| **auto** | 2026-03-05 12:19 UTC | `1b5704a` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #94 from appthemanger-ctrl/copilot/fix-daydreams-app-routing — fix: remove duplicate default export from daydream music page<br> |
| **auto** | 2026-03-05 12:11 UTC | `a043fd4` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #93 from appthemanger-ctrl/copilot/improve-code-efficiency — perf: parallelize DB queries, fix Vercel runtime compatibility, memoize feed components<br> |

---

## Current Branch

- **Branch:** `copilot/update-idari-restrictions`
- **Base:** `completedream`
- **PR purpose:** Implement Idari System Contract — fix intent restriction, create contract doc, daily workflow, Copilot toolkit, and self-reminder

---

## What Was Done This Session (2026-03-05, branch: copilot/update-idari-restrictions)

### 1. Fixed Idari intent restriction (`lib/ai/triad.ts`)
- `validateWithIdari` previously used a single `ALLOWED_INTENT_TYPES` list containing only user-level intents (`NAV_DELTA`, `HOME_MENU_OPEN`, `SEARCH`, `POST_CREATE`).
- This blocked all admin diagnostic intents even when called from the admin Idari route.
- **Fix:** split into `USER_ALLOWED_INTENT_TYPES` and `ADMIN_ALLOWED_INTENT_TYPES`, added optional `context: 'user' | 'admin'` parameter (default `'user'`).
- Admin list extends the user list and adds `DIAG_SCHEMA_SNAPSHOT` + `DIAG_RLS_SNAPSHOT`.

### 2. Updated Idari API route (`app/api/ai/idari/route.ts`)
- Changed `validateWithIdari(intents)` → `validateWithIdari(intents, 'admin')` so admin diagnostic intents now pass through to BoogieMan evaluation instead of being silently dropped.

### 3. Created Idari System Contract (`docs/IDARI_CONTRACT.md`)
- Full operational contract for Idari: core principle, daily document sync, self-modification prohibition, daily improvement cycle schedule, direct push permission, architecture verification rules, all four agents (Battery, Scene Architect, UI Polish, Supabase), command interface, intent type table, push conditions, AI triad relationship.

### 4. Created Copilot Toolkit + self-reminder (`docs/COPILOT_TOOLKIT.md`)
- Comprehensive GitHub Actions reference covering: checkout, Node/Python/Go/Java/Rust, Docker (build/push/login/metadata/QEMU), security scanning (Trivy, CodeQL, Gitleaks, Snyk, OSSF), Vercel, Supabase, AWS, GCP, Kubernetes/Helm, git auto-commit, PR creation, releases, notifications, environment variables, matrix builds, reusable workflows, GitHub Pages, every trigger type, permissions reference, best practices.
- Self-reminder section with key file map, things never to do, things always to do.
- All environment variables for this repo in one table.

### 5. Created Idari daily workflow (`.github/workflows/idari-daily.yml`)
- Runs at midnight UTC daily, also triggerable manually with `dry_run` option.
- Sequence: checkout `completedream` → read /docs constitution → typecheck → governance guard (ensures /docs and .github/agents are never modified) → run improvement agents (battery, UI, Supabase) → generate cycle report → commit + push [skip ci] → upload artifact.
- Concurrency group `idari-daily` prevents overlapping runs.

### 6. Created Idari agent definition (`.github/agents/idari.agent.md`)
- GitHub Copilot agent spec: read-first workflow, role definition, modification prohibitions, commit rules, all five command handlers (`/audit-battery`, `/make-scene`, `/refactor`, `/diag-schema`, `/diag-rls`, `/patch-plan`), daily cycle sequence, push conditions, relationship to triad, key code locations.

### 7. Updated `docs/LAW.md`
- Added `IDARI_CONTRACT.md` (position 8) and `COPILOT_TOOLKIT.md` (position 12) to priority order.
- Expanded §9.3 "read the docs" trigger to list every file by name so there is no ambiguity.

### 8. Updated `docs/FEATURE_STATUS.md`
- Added five new rows to AI Triad section reflecting IDARi restriction fix, system contract, daily workflow, and agent definition.

### 1. Landing page — sky-blue + gold + transparent video background (`components/LandingHero.tsx`)
- Removed `bg-[#070b16]` (dark anti-pattern — SPEC.md §9 violation). `<main>` is now transparent; the design-system `html/body` sky-blue→gold-cream gradient is the base layer.
- Removed undefined `dream-colorfield` no-op div.
- Raised video opacity from `0.15` → `0.38` — video is now actually visible.
- Removed the near-opaque dark gradient overlay (`from-[#0a1020]/70`).
- Added thin frosted-glass wash: `rgba(220,232,248,0.52)` → `rgba(245,232,196,0.38)` — sky-blue top, warm gold-cream bottom, keeps text legible while video shows through.
- **Gold gradient headline:** h1 uses `bg-clip-text` with `--de-heading → --de-accent → --de-gold` gradient.
- All text updated from `text-white` to `--de-heading` / `--de-text` / `--de-text-dim` CSS var tokens.
- Buttons: `de-btn de-btn-gold` (Get Started), `de-btn de-btn-primary` (Sign In), `de-btn de-btn-ghost` (About).
- Speech bubble: white-glass with blue-gold inset border, dark text — matches frosted-glass recipe in SPEC.md §1.3.
- Added **"tap to interact ✦"** affordance label below Dr. Eams sprite — satisfies AXIOM 1 (instant discoverability).

### 2. Playwright full-coverage suite (`tests/e2e/full-coverage.spec.ts`)
- Permissions granted: `camera`, `microphone`, `geolocation`, `notifications`.
- **12 test groups:** landing page, about, policy, login, join, auth redirects (17 protected routes), shop, marketplace, games, discover, design-system tokens, mobile (iPhone 13), media permissions.
- Covers: video opacity check, sprite canvas + touch interaction, `de-btn-primary` gradient verification, `<main>` transparency check, footer policy link on every public page, all 18 icon-strip badges, OAuth buttons, form fields with correct selectors.
- Mobile group uses `viewport: { width: 390, height: 844 }` (iPhone 14 base per ARCHITECTURE.md §17.1).

### 3. IDARi bug report (`docs/BUGS.md`)
- New live open-issue log — 11 documented bugs (BUG-002 through BUG-012).
- Includes: selector mismatch in `example.spec.ts`, HeroSprite responsive sizing bug, 9+ pages on wrong design system, mock profiles in Discover, localStorage-only persistence, missing password reset UI, and more.
- Rule embedded: delete entry when bug is fixed, never mark-and-leave.

### 4. Hard rules added to docs
- **`docs/LAW.md §9`** (new section): 3 binding rules — no deleting unfinished docs, remove fixed bugs from BUGS.md, read all docs before every session.
- **`docs/SPEC.md §9`**: Added two new anti-patterns — do not delete incomplete-feature docs, do not leave fixed bugs in BUGS.md.
- **`docs/HANDOFF.md`**: Added "⚠️ Hard Rules for Every AI Session" block at the top — 5 non-negotiable rules that run before any code work.

---

## Platform Declaration

**DREAMengin is a mobile-first platform.** Every feature must be designed,
tested, and refined for touch on a smartphone screen first. Desktop and PS5
controller are progressive enhancements on top of the mobile base.

See `docs/ARCHITECTURE.md §17` and `docs/SPEC.md §10` for the full spec.

---

## What Was Done This Session (2026-03-05, branch: copilot/check-sprite-animation-replacement)

### 1. Sky-blue + gold gradient design system (`styles/globals.css`)
- Added `--de-theme-from`, `--de-theme-mid`, `--de-theme-to`, `--de-theme-angle` CSS vars to `html,body`.
- `de-btn-primary` and `de-btn-gold` now both render as sky-blue→gold gradient pills.
- Added `.de-marble` bubble class — radial gradient white core to color edges, deep blur, inset shimmer highlight.
- Added `de-flip-out` / `de-flip-in` keyframes for the page-turn flip animation.

### 2. ThemeApplicator (`components/ThemeApplicator.tsx`)
- Client component that reads `localStorage('de-theme')` on mount and applies CSS vars.
- Listens for `de-theme-changed` event so settings changes take effect live without a reload.
- Wired into root `app/layout.tsx`.

### 3. Appearance settings (`app/settings/appearance/page.tsx`)
- Added "Gradient Theme Picker" section with 5 presets: Sky+Gold (default), Ocean+Coral, Aurora, Sunrise, Mint+Sky.
- Each preset writes `de-theme` to localStorage and fires `de-theme-changed`.

### 4. Login + Join redesigned (`app/login/page.tsx`, `app/join/page.tsx`)
- Both pages now use `de-sky-bg`, `de-widget` frosted glass cards, `de-btn-primary`/`de-btn-gold`.
- Removed all dark purple / indigo theming.

### 5. About page (`app/about/page.tsx`)
- Replaced `bg-universe`/`glass-dark` with `de-sky-bg`/`de-widget`.

### 6. Games Daydream — 3 live mini-games (`app/daydream/games/page.tsx`)
- Dr. Eams Platformer is the hero card (real canvas game, always-on).
- Word Sprint (`components/games/WordSprint.tsx`) — 60-second typing speed game, client-only.
- Memory Grid (`components/games/MemoryGrid.tsx`) — 8-pair flip matching game, client-only.
- Speed Tap (`components/games/SpeedTap.tsx`) — 10-second tap counter with keyboard support.
- All 3 run immediately — zero coming-soon states.

### 7. Music Studio — real SoundRecorder (`components/music/SoundRecorder.tsx`)
- MediaRecorder API — record, pause/resume, stop.
- Live waveform canvas (Web Audio AnalyserNode, 60fps animation loop).
- Playback via `<audio>` element.
- One-click download as .webm audio file.
- Wired into `app/daydream/music/page.tsx`, replaces "waveform will appear here" placeholder.

### 8. Analytics Daydream (`app/daydream/analytics/page.tsx`)
- Removed all fake chart `<div>` placeholders.
- Now shows real post count from Supabase + actionable links (Add Connector, Open Shop, Edit Profile).

### 9. Marketplace (`app/marketplace/page.tsx`)
- Removed "Featured coming soon" dead card and "No trending yet" card.
- Replaced with real "Publish your first item" CTA.

### 10. Settings / Data (`app/settings/data/page.tsx`)
- Removed "(Coming Soon)" from the Export Data button.

### 11. Shop (`app/shop/page.tsx`)
- Now fetches real `merch` rows from Supabase.
- Shows live grid when listings exist; shows "Create your first listing" CTA when empty.

### 12. ProfileCanvas — all-in-one profile page (`components/profile/ProfileCanvas.tsx`, `app/profile/page.tsx`)
- Edit + widget visibility toggles + share panel + visitor view link, all in one place.
- 8 draggable widget slots with visibility toggles (marble bubble style).
- No separate /edit-profile redirect needed for basic profile management.

### 13. DaydreamShell — flip system (`components/daydream/DaydreamShell.tsx`)
- Reusable Side A (daydream content) / Side B (widget tray) flip with page-turn animation.
- Page-corner fold tab in bottom-right triggers flip; Alt+F keyboard shortcut also works.
- All 7 daydreams wired: Music, Games, Analytics, Create, Brand, Media Vault, Play.
- Each daydream has 6–8 daydream-specific marble bubble widgets on Side B.

### 14. FollowOnboarding (`components/feed/FollowOnboarding.tsx`, `components/feed/FollowButton.tsx`)
- Bottom-sheet modal triggered when following a user.
- 8 frequency options: Everything, Highlights, Once a Day, Weekdays, Weekends, New Releases, Groups Only, Silent.
- Settings persisted to `localStorage('de-follow-settings')`.
- `FollowButton` client component replaces static Follow button on public profile page.

### 15. AlgorithmEngine + Settings (`components/feed/AlgorithmEngine.tsx`, `app/settings/algorithm/page.tsx`)
- My Algorithm vs Dream Algorithm toggle.
- Preset creator — name a preset, pick 3 sources from follow list.
- Mix Mode — activate up to 3 presets simultaneously.
- Share a Setup — copies a shareable setup string.
- `/settings/algorithm` page with sky-blue header and Settings nav entry added.

---

## What Was Done In Previous Session (2026-03-05, branch: copilot/build-mario-style-game)

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
| Open bug log (IDARi) | `docs/BUGS.md` |
| Theme tokens | `app/globals.css`, `tailwind.config.ts` |
| Home Buttons state machine | `lib/home-buttons/home-buttons-state.ts` |
| Golden Button UI | `components/dreamnav/DreamNavControls.tsx` |
| DaydreamShell flip | `components/daydream/DaydreamShell.tsx` |
| ProfileCanvas all-in-one | `components/profile/ProfileCanvas.tsx` |
| FollowOnboarding modal | `components/feed/FollowOnboarding.tsx` |
| FollowButton | `components/feed/FollowButton.tsx` |
| AlgorithmEngine | `components/feed/AlgorithmEngine.tsx` |
| Algorithm settings page | `app/settings/algorithm/page.tsx` |
| ThemeApplicator | `components/ThemeApplicator.tsx` |
| SoundRecorder | `components/music/SoundRecorder.tsx` |
| Mini-games | `components/games/WordSprint.tsx`, `MemoryGrid.tsx`, `SpeedTap.tsx` |
| Landing page | `components/LandingHero.tsx` |
| E2E full-coverage tests | `tests/e2e/full-coverage.spec.ts` |

---

## Open Issues / Next Priorities

> See `docs/BUGS.md` for the full live bug log. Items below are architectural / feature gaps.

1. **11 pages still use `bg-background`** — `app/create`, `app/shop/sell`, `app/music`, `app/music/upload`, `app/settings/account`, `app/settings/security`, `app/settings/notifications`, `app/ads/create`, `app/lab/new` — apply `de-sky-bg` + `de-widget` to each. (BUG-004)
2. **Feed system** — widget feed resolver is wired but feed items are demo-only; connect to real DB rows.
3. **FollowOnboarding → DB** — currently persists to localStorage only; wire to a `follow_settings` Supabase table. (BUG-007)
4. **Algorithm presets → DB** — AlgorithmEngine stores to localStorage; persist to `user_feed_presets` table. (BUG-007)
5. **ProfileCanvas drag** — widget grid shows toggle visibility; actual drag-to-reorder not yet wired (needs `@dnd-kit/core`). (BUG-008)
6. **Music Studio publish pipeline** — SoundRecorder records + downloads; not yet connected to feed publish. (BUG-009)
7. **Payments (Shop / Marketplace)** — UI exists; Stripe integration not started.
8. **PS5 DualSense haptics** — Gamepad vibration API on stomp/coin; wiring pending.
9. **Game leaderboard** — score exists in-game; no Supabase persistence yet. (BUG-010)
10. **Connectors** — YouTube + demo exist; Instagram, Spotify not yet built.
11. **Password reset UI** — route exists but no UI. Add "Forgot password?" link on `/login`. (BUG-012)
12. **Discover mock profiles** — replace `MOCK_PROFILES` array with real Supabase query. (BUG-006)
13. **HeroSprite responsive sizing** — Tailwind class overridden by inline style; canvas always 288px. (BUG-003)
