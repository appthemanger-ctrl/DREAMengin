# AGENTS.md — Coding Agent Handoff

> **Read this first.** This document is the canonical handoff for any coding agent
> picking up work on DREAMengin. It records what was done, what is still needed,
> where to find things, and what NOT to break.

---

## ⚠️ INSTRUCTIONS FOR EVERY AGENT THAT OPENS THIS FILE

**You must follow these steps, no exceptions:**

1. **Read this entire file before touching any code.**
2. **When you finish your session, update this file** — add a new dated entry to
   the [Session Log](#session-log) section at the bottom describing:
   - What you were asked to do
   - Every file you changed and why
   - Anything that broke or behaved unexpectedly
   - What you did NOT finish and why
3. **Update the "What is STILL NEEDED" section** — cross off anything you completed,
   add anything new you discovered.
4. **Update the "Architecture quick-reference" table** if you added or moved files.
5. **Commit the updated `docs/AGENTS.md` in the same PR as your code changes.**

This file is the institutional memory of this project. If you skip updating it,
the next agent starts blind. Don't do that to them.

---

## What DREAMengin actually is

DREAMengin is a **premium, easy-to-use widget-powered creative platform**.

- **Design language:** light blue and gold gradients — "Dream Ice" palette.
  CSS tokens live in `styles/globals.css`. Use `var(--de-accent)` (blue),
  `var(--de-gold)` (gold), `var(--de-heading)`, `var(--de-text)`, `var(--de-text-dim)`.
  CSS classes: `dream-bg`, `de-glass`, `de-btn`, `de-btn-primary`, `de-btn-gold`,
  `de-btn-ghost`, `de-badge`, `de-tile`, `de-widget`, `de-sky-bg`.

- **Widget (Dream) Feed:** Every piece of content is a Dream widget — a live
  mini-app, not a static card. The Home feed is widget-powered.

- **6 Daydreams (12 sides):** Six specialized permanent spaces:
  Analytics, Brand, Games, Media Vault, Music, Play.
  Each Daydream has a **Side A** and **Side B** → 12 total surfaces.
  Routes: `/daydream/analytics`, `/daydream/brand`, `/daydream/games`,
  `/daydream/media-vault`, `/daydream/music`, `/daydream/play`.

- **Profile = widget canvas:** The Profile page is itself a widget that can hold
  other widgets. Any widget placed on the profile appears on the **public profile**
  at `/u/[handle]` (which redirects to `/profile/[handle]`).

- **Golden Button:** The single floating gold button (`components/overlay/UIOverlayHost.tsx`)
  is the primary navigation. Tap = go to `/home`. Hold (400 ms) = open menu.
  It is **hidden on** `/`, `/login`, `/join`, `/auth/callback`, `/about`, `/policy`.

---

## What was done in this PR (branch: `copilot/update-landing-page-design`)

### 1. Landing page — color scheme fixed (`components/LandingHero.tsx`)

**Before:** Dark navy (`bg-[#070b16]`) with a video background. Completely
mismatched the logged-in app's Dream Ice light-blue-and-gold theme.

**After:** Uses `dream-bg` (the app's standard light-blue gradient), `de-glass`
panels, `de-badge` pill, `de-btn-gold` CTA, `de-heading` text color. Matches
the rest of the app perfectly. The dark video background was removed.

Key changes:
- `<main>` class: `dream-bg` instead of `bg-[#070b16] text-white`
- Radial glow overlays for blue + gold depth
- Header uses `de-btn-ghost` / `de-btn-primary`
- H1 has a `linear-gradient(90deg, var(--de-accent), var(--de-gold))` text gradient
- Subtitle added: "Widget-powered feed. 6 Daydreams (12 sides). Premium spatial design."
- Feature pills row added (Widget Feed, 6 Daydreams, Premium Design, Music, Privacy, AI)
- "Connect everything" icon strip now uses `de-tag` instead of hard-coded white text

### 2. Golden Button — no longer shows on landing page (`components/overlay/UIOverlayHost.tsx`)

**Before:** `ROUTE_DENYLIST = ['/login', '/join', '/auth/callback']`
The home button was visible on the unauthenticated landing page `/`.

**After:** `ROUTE_DENYLIST = ['/', '/login', '/join', '/auth/callback', '/about', '/policy']`
Special-case exact match for `/` so `startsWith('/')` doesn't hide it on all routes.

```ts
const hidden = ROUTE_DENYLIST.some((p) =>
  p === '/' ? pathname === '/' : pathname?.startsWith(p)
);
```

### 3. About page updated (`app/about/page.tsx`)

- Badge changed from "Social Media Hub" → "Widget-Powered Creative Platform"
- H1 brand name corrected to "DREAMengin" (was "DreamEngin")
- Description updated to mention light blue and gold, widget-powered, premium
- Features section rewritten to cover: Widget Feed, 6 Daydreams (12 sides),
  AI Triad, Profile as widget canvas, Privacy, Creator Economy
- "How It Works" section rewritten to cover: Golden Button, Widget Canvas, 6 Daydreams
- Spaces list: `/profile/me` (broken) replaced with `/profile`
- Footer brand name corrected to "DREAMengin"

### 4. README updated (`README.md`)

- Opening paragraph rewritten to state the product clearly
- New "Core product concepts" section added covering widget feed, 6 daydreams,
  profile-as-canvas, and the Golden Button
- Product model section updated to mention Dreams as widgets, profile canvas,
  and the Dream Ice design requirement for the landing page

---

## What is STILL NEEDED (next agent picks up here)

### HIGH PRIORITY

#### A. Profile page — widget canvas editing (`app/profile/page.tsx`, `app/edit-profile/page.tsx`)

The profile is supposed to be a **widget canvas**. Currently `app/profile/page.tsx`
shows a static editor UI. It should:
1. Let users drag-and-drop Dream widgets onto their profile canvas
2. When a widget is placed → it is automatically published to their public profile
3. Show a clear "View My Public Profile" button that links to `/u/[handle]`

The `app/edit-profile/page.tsx` page also needs to be updated to support
widget-based editing rather than a simple form. See `docs/WIDGET_SYSTEM_V2.md`.

The public profile (`app/profile/[handle]/page.tsx`) already exists and renders
widgets well, but needs to be connected to the widget canvas system so that
widgets placed on the private canvas show up there.

#### B. Home feed — widget-powered feed (`components/home/HomeFeedTV.tsx`, `components/home/HomeSystem.tsx`)

The Home screen's `HomeFeedTV` component uses a content list, but the feed
should render each item as a **Dream widget** (a `DreamWidget` component from
`components/home/DreamWidget.tsx`). Items should be draggable, resizable, and
interactive — not just cards in a list.

The `DreamsGrid` component (`components/home/DreamsGrid.tsx`) exists but is
currently only used in `mode="profile"`. Extend it or `HomeFeedTV` so the
full widget canvas is the default Home feed view.

#### C. Daydreams — 6 routes need full Side A / Side B UI

Routes exist (via `/daydream/[slug]`) but most render placeholder content.
Each Daydream needs:
- Side A: the primary specialized surface
- Side B: a secondary/reverse surface (flippable or tabbed)
- Proper light-blue-and-gold styling matching the Dream Ice palette

The spec is in `docs/SPEC.md` and `docs/WIDGET_SYSTEM_V2.md`.

#### D. "View My Public Profile" — surface it more clearly

The public profile URL is `/u/[handle]` (redirects to `/profile/[handle]`).
Users need a clear path from the home/profile face to their public profile.
The `HomeSystem.tsx` ProfileCard already has a "View Public Page" link but it
routes to `/profile/[handle]` — verify it works end-to-end with real auth.

### MEDIUM PRIORITY

- **`app/profile/page.tsx`** currently redirects non-authed users fine, but the
  widget placement → public profile publish pipeline is not wired up.
- **Golden Button menu** (`UIOverlayHost.tsx`): "My Dreams" routes to `/home`
  — it should route to the profile canvas or a dreams library.
- The `NavBar.tsx` / `NavBar-enhanced.tsx` components are largely unused in the
  logged-in app (the Golden Button replaces them) but they still render on some
  pages. Audit which pages still show a traditional nav and remove it.

### LOW PRIORITY / POLISH

- Landing page: consider adding a short animated demo of the widget canvas
- About page: add a visual showing the 6 Daydreams grid (Side A + B)
- The `dream-colorfield` CSS class referenced in old code no longer exists
  (it was part of the dark landing page). Verify it is fully removed.

---

## Architecture quick-reference

| Concern | Files |
|---|---|
| Landing page (unauthenticated `/`) | `app/page.tsx` → `components/LandingHero.tsx` |
| Golden Button + overlay menu | `components/overlay/UIOverlayHost.tsx` |
| Home feed (authenticated) | `app/home/page.tsx` → `components/home/HomeSystem.tsx` → `components/home/HomeFeedTV.tsx` |
| Profile canvas (private editor) | `app/profile/page.tsx` |
| Public profile page | `app/profile/[handle]/page.tsx` (also `/u/[handle]` redirects here) |
| Edit profile form | `app/edit-profile/page.tsx` |
| Design tokens | `styles/globals.css` (`:root` block — `--de-*` variables) |
| Widget system spec | `docs/WIDGET_SYSTEM_V2.md` |
| Dream feed spec | `docs/HOME_FEED_TV_SPEC.md` |
| Navigation spec | `docs/NAVIGATION_SPEC.md` |
| AI Triad | `docs/AI_TRIAD_PROTOCOL.md`, `docs/DR_EAMS.md` |
| Law / non-negotiables | `docs/LAW.md`, `docs/AXIOMS.md` |

## Build notes

- Deps: `npm install --legacy-peer-deps` (no `pnpm` in the sandbox)
- Build: `npx next build`
- Known pre-existing build error: `AI_CONFIRM_TOKEN_SECRET must be set in production`
  — this is an env var required by `/api/ai/eams` and `/api/ai/execute`.
  It does **not** affect the UI. Set it in `.env.local` to silence it locally.
- TypeScript checks are skipped during build (`Skipping validation of types`).
  Run `npx tsc --noEmit` to check types separately.

## DO NOT break

- `ROUTE_DENYLIST` exact-match logic for `'/'` in `UIOverlayHost.tsx` — without it
  the Golden Button reappears on the landing page.
- `dream-bg` class — used by both the landing page and the logged-in layout body.
- `--de-accent` / `--de-gold` CSS variables — every page depends on them.
- `/u/[handle]` redirect to `/profile/[handle]` — this is the canonical public
  profile URL and must remain a permanent redirect.

---

## Session Log

> **Every agent appends a new entry here when they finish.** Newest entry at the top.
> Format: `### YYYY-MM-DD — <agent or PR name> — <one-line summary>`

---

### 2026-03-03 — GitHub Copilot — Landing page theme fix, home button fix, about/README update

**Asked to do:** Fix landing page color scheme (matched dark theme instead of Dream Ice),
fix home button appearing before login, update about page and README to accurately describe
the platform (widget feed, 6 daydreams, profile as widget canvas).

**Files changed:**

| File | Change |
|---|---|
| `components/LandingHero.tsx` | Full rewrite of JSX. Dark `bg-[#070b16]` → `dream-bg`. All hard-coded white text replaced with `--de-*` tokens. Added gradient H1, subtitle, feature pills, corrected CTA buttons to `de-btn-gold` / `de-btn-ghost`. |
| `components/overlay/UIOverlayHost.tsx` | Added `'/'`, `'/about'`, `'/policy'` to `ROUTE_DENYLIST`. Added exact-match guard for `'/'` so `startsWith('/')` doesn't hide the button on every route. |
| `app/about/page.tsx` | Updated badge, H1 brand name (was "DreamEngin"), hero description, features list (now covers widget feed, 6 daydreams, profile canvas, AI triad), navigation principles, spaces list (fixed broken `/profile/me`), footer brand name. |
| `README.md` | Rewrote opening paragraph and product model section to accurately describe the platform. |
| `docs/AGENTS.md` | Created this file. |

**Gotcha — Python script bug:** The first attempt to update `LandingHero.tsx` used
`content.find('  return (')` which matched inside `      return () => clearTimeout(swap)`
(the 2-space substring appears within the 6-space-indented arrow function return).
The JSX got injected inside the `setInterval` callback. Fixed by rewriting the whole
file with a heredoc instead.

**What was NOT finished:**

- Profile widget canvas editing (see "What is STILL NEEDED" → A)
- Home feed as a true widget canvas (see → B)
- Daydream Side A / Side B full UI (see → C)
- Wiring widget placement → auto-publish to public profile (see → D)

**Pre-existing build error (not introduced here):**
`AI_CONFIRM_TOKEN_SECRET must be set in production` — affects `/api/ai/eams` and
`/api/ai/execute` only. Compilation succeeds cleanly. Safe to ignore during UI work.
