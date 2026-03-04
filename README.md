# DREAMengin (Authoritative Spec + Implementation)

DREAMengin is a **premium, easy-to-use widget-powered creative platform** built on **Next.js (App Router)** + **Supabase**.

The design language is **light blue and gold gradients** — Dream Ice palette. Every space is a canvas, every piece of content is a Dream widget.

### Core product concepts

- **Widget (Dream) Feed** — Your Home and Profile are widget canvases. Every Dream is a live mini-app that powers the feed.
- **6 Daydreams (12 sides)** — Six specialized permanent spaces: Analytics, Brand, Games, Media Vault, Music, and Play. Each has a Side A and Side B.
- **Profile as widget canvas** — Your Profile page is a widget canvas. Widgets pinned there appear on your public profile page (`/u/[handle]`).
- **Golden Button** — The single floating gold button is the primary navigation. Tap = Home, hold = full menu.

This repo is **spec-governed**. The documents in `/docs` are **not suggestions** — they are binding constraints on implementation.

## Start here (LAW)

- **docs/LAW.md** — front door + enforcement summary (LOCKED)
- **docs/AXIOMS.md** — non-negotiables (LOCKED)
- **docs/SPEC.md** — design system, UI behavior, interaction model (v2.0, single source of truth)
- **docs/WIDGET_SYSTEM_V2.md** — widgets, instances, and window presentation
- **docs/ARCHITECTURE.md** — τ navigation, Home model, controls
- **docs/SECURITY.md** — Supabase/RLS, privacy, least-privilege
- **docs/ADD_WORKFLOW.md** — how additions must be integrated

If code conflicts with these docs, **code must change**.

## Product model (high level)

- The user is always conceptually inside **Home (node 0)**.
- Navigation is **τ-only** (state transitions), not a traditional site nav model.
- **Dreams** are widgets — live mini-apps that power the feed. The feed is widget-powered.
- **Daydreams** are protected specialized spaces: 6 permanent Daydreams × 2 sides = 12 total. Full-powered mini-apps.
- **Profile** is a widget canvas — widgets placed on your profile are visible on your public profile at `/u/[handle]`.
- The **Golden Button** (floating gold button) is the **primary travel system**. Traditional nav bar links are disabled for signed-in users.
- The landing page (`/`) uses the **Dream Ice** theme: light blue and gold gradients. No dark theme on the public-facing landing.

## Golden Button (Home Controls)

The two floating buttons are system objects, not a navbar. Per **SPEC.md §3.1**:

| State | Single tap | Double tap |
|-------|-----------|------------|
| **Locked** (buttons at center) | Open **both** menus side-by-side | Unlock → snap to saved rail corners |
| **Unlocked** (buttons on rails) | Go Home (reset anchor) | Open **that button's** menu only |

- Buttons drift back together via gentle gravity and auto-lock (magnetic snap < 88 px).
- Blue button = Daydreams menu (right rail when unlocked).
- Gold button = System menu (left rail when unlocked).
- Cross-color rings indicate locked state (blue shows gold ring, gold shows blue ring).
- Positions persist in `localStorage` key `dreamengin:controls:v4`.

Implementation:
- `components/dreamnav/DreamNavControls.tsx` — UI + drag/snap/tap logic
- `lib/home-buttons/home-buttons-state.ts` — pure state machine (tested)
- `components/menus/DreamRadialMenu.tsx` + `SystemRadialMenu.tsx` — menu panels
- `components/menus/MenuPanel.tsx` — shared panel (supports `side` prop for side-by-side)

## Branding system

Brand assets live in `/public/` and `/public/images/` — do not modify without updating this file.

| Asset | Description |
|-------|-------------|
| `/public/images/logo1.PNG` | Logo variant 1 (RGBA, transparent background) |
| `/public/images/logo2.PNG` | Logo variant 2 (RGBA, transparent background) |
| `/public/images/logo3.PNG` | Logo variant 3 (RGBA, transparent background) |
| `/public/images/HEROSPRITE.png` | 4 cols × 6 rows sprite sheet, 24 frames @ 208×208 px |
| `/public/images/HeroAbout.PNG` | About page hero image |

- `lib/branding/logos.ts` — `getRandomLogo()` picks one logo per page load (Fisher-Yates shuffle, per-load in-memory cache, SSR-safe fallback).
- `components/BrandLogo.tsx` — SSR-safe logo component (stable placeholder on server, random on mount).
- `components/HeroSprite.tsx` — Canvas sprite animator for the landing hero (replaces static image).

## AI Triad

| Agent | Role | Endpoint | Auth |
|---|---|---|---|
| Dr. Eams | User-facing assistant | `POST /api/ai/eams` | Authenticated user |
| IDARi | Admin optimizer / debugger | `POST /api/ai/idari` | Admin only |
| BoogieMan | Policy + system overwatch | `POST /api/ai/boogieman` | Admin only |

- All AI keys are configured as **Vercel environment variables**, never committed.
- IDARi and BoogieMan endpoints are admin-guarded even when `DEV_BYPASS_AUTH` is on.
- Major system updates require unanimous triad approval (consensus gating) via `/admin`.
- **[/policy/ai](/policy/ai)** — Public page: what each AI does, capability comparison, glossary.
- **docs/AI_TRIAD_PROTOCOL.md** — Full triad protocol: roles, restraints, governance, event bus (source of truth).
- **docs/POLICY_TRIAD_OVERVIEW.md** — Short public overview (mirrored at `/policy/ai`).
- **docs/TERMS.md** — Shared vocabulary all agents must use.
- **lib/ai/events.ts** — Canonical typed event schema for all inter-agent communication.
- **docs/DR_EAMS.md** — Dr. Eams behavioral spec (100 requirements).
- **BoogieMan full spec:** `docs/policy/theboogie.md` — versioned 100-rule policy (v1).

Dr. Eams chat panel (`components/dreamengin/DrEamsPanel.tsx`):
- Opens from the System menu (tap Gold button → Dr. Eams).
- Animated mascot, quick-action chips, auto-scroll to latest message.

## Policy and enforcement (TheBoogieMan.Ai)

| Item | Location |
|------|---------|
| Policy document (versioned) | `docs/policy/theboogie.md` |
| Policy test plan | `docs/POLICY_TESTS.md` |
| Public policy page | `/policy` (accessible from Settings → Policy) |
| Policy constants + rule codes | `lib/ai/boogie-policy.ts` |
| Core engine | `lib/ai/boogieman.ts` |
| Appeal endpoint | `POST /api/appeal` |
| Policy health status | `GET /api/ai/boogieman/status` |

## Environment variables

All secrets are server-side only. See `.env.example` for the full list.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only. Never `NEXT_PUBLIC_`. |
| `GROQ_API_KEY` | ✅ | Server-only AI provider key. Never `NEXT_PUBLIC_`. |
| `OWNER_EMAIL` | ✅ | Owner email for admin gating |
| `ADMIN_CODE_PASSWORD` | ✅ | Password for `/api/admin/ai-chat`. One wrong attempt = permanent lockout. |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | dev only | Set to `true` to skip auth redirects in dev |
| `DEV_ADMIN` | dev only | Set to `true` (+ bypass above) to access admin panel without login in dev |
| `BOOGIE_SIMULATION_MODE` | dev only | Audit events without restricting accounts. Never enable in production. |
| `BOOGIE_DEGRADED` | ops only | Mark TheBoogieMan.Ai as degraded in the status endpoint. |
| `BOOGIE_OFFLINE` | ops only | Mark TheBoogieMan.Ai as offline in the status endpoint. |

## Dev auth bypass

Set in `.env.local` for UI review without a live Supabase account:

```bash
NEXT_PUBLIC_DEV_BYPASS_AUTH=true   # skips auth redirects on user-facing pages
DEV_ADMIN=true                      # also opens /admin without login
```

**Never** set these in Vercel production environment variables.

## Development

### Local
1. Install deps: `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in all values
3. Run dev server: `pnpm dev`

### Testing
```bash
pnpm test:unit tests/home-buttons.test.ts    # Golden Button state machine
pnpm test:unit tests/branding-logos.test.ts  # Logo rotation utility
pnpm test:unit tests/boogieman.test.ts        # Policy engine
```

### Repo guardrails
- Protected Day Dream paths require `[DAYDREAM_OK]` in PR title.
- See `docs/LAW.md` and `.github/workflows/law.yml`.
