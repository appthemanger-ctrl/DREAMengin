# DREAMengin (Authoritative Spec + Implementation)

DREAMengin is a spatial, gesture-driven creative platform built on **Next.js (App Router)** + **Supabase**.

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
- **Day Dreams** are protected: they are full-powered mini-apps.
- The **Golden Button** (two floating buttons, Blue + Gold) is the **primary travel system**. Traditional nav bar links are disabled.

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

Brand assets live in `/public/branding/` — do not modify without updating this file.

| Asset | Description |
|-------|-------------|
| `logo1.png` | Logo variant 1 (RGBA, transparent background) |
| `logo2.png` | Logo variant 2 (RGBA, transparent background) |
| `logo3.png` | Logo variant 3 (RGBA, transparent background) |
| `MainSprite.png` | 4 cols × 6 rows sprite sheet, 24 frames @ 208×208 px |
| `AboutHero.png` | About page hero image |

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
