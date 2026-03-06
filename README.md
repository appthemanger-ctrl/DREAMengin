# DREAMengin

**Customizable UI OS · Widget Space · Social Feed · AI Triad**

A Next.js 16.1.6 App Router application with a Babylon.js animated logo, τ-navigation via the Golden Button, widget space, social feed, and an AI triad (Dr. Eams · IDARi · TheBoogieMan).

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — animated DREAMengin logo |
| `/home` | Home Dream (widget space + feed) |
| `/profile` | Profile Dream (private editing surface) |
| `/u/[handle]` | Public profile mirror |
| `/marketplace` | Browse widgets / themes |
| `/shop` | Purchase premium content |
| `/settings` | Settings hub |
| `/settings/controls` | Customize home-button gesture controls |
| `/settings/feed` | Feed source slices |
| `/settings/connectors` | Connect external services (IG, etc.) |
| `/settings/appearance` | Theme + layout editor |
| `/settings/data` | Delete My Data (keeps login) |
| `/settings/account` | Delete My Dream (full account delete) |

### API routes

| Route | Description | Auth |
|---|---|---|
| `POST /api/ai/eams` | Chat with Dr. Eams | Public |
| `POST /api/ai/idari` | IDARi system optimizer | Admin only |
| `POST /api/ai/boogieman` | TheBoogieMan policy AI | Internal |

---

## Animated logo

The DREAMengin logo is rendered in a Babylon.js WebGL canvas. Use the component anywhere:

```tsx
import { DreamEnginLogo } from "@/components/DreamEnginLogo";

<DreamEnginLogo width={480} height={240} />
```

### What it does

- **DREAM plane** — slow y-float, ±1.5° rotation, gold emissive shine pulse (loop).
- **ENGIN plane** — micro-bob synced at half the DREAM amplitude; stays steady.
- **Texture sampling** — `NEAREST` so crisp pixel-art / vector PNGs stay sharp.
- **Battery-aware** — pauses when the canvas scrolls offscreen (`IntersectionObserver`) or the tab is hidden (`visibilitychange`). Runs at 60 fps when visible; drops to 30 fps when idle.

### Using the sprite sheet (if needed)

Load `sprite_2x_transparent.png` and set sampling to `NEAREST` (no linear blur). Match the sprite cell size exactly so Babylon never scales individual frames.

---

## AI Triad

Three server-side AI agents with distinct roles:

| Agent | Role | Exposed to |
|---|---|---|
| **Dr. Eams** | User-facing assistant / chat | All users |
| **IDARi** | Admin bug-fixer + optimiser | Admins only |
| **TheBoogieMan** | Policy enforcer + system overwatch | Internal / server |

### Consensus gating

Major system-update recommendations require unanimous approval from all three agents before they are applied.

### Env vars

Copy `.env.example` → `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
dreamengin_SUPABASE_SECRET_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key        # server-only AI provider key
OPENAI_API_KEY=your-openai-key    # server-only
INNERDREAMS_PASSWORD=...           # guards /api/admin/*
```

Keys are **server-side only** — never shipped to the client.

---

## Home Buttons

Two independent draggable buttons manage lock/unlock and menus:

- **Drag together** → snap + lock (light blue + gold visual).
- **Single tap while locked** → both menus open side-by-side (System left, Daydream right).
- **Double tap while locked** → unlock.
- After menus open, buttons snap back to saved corner positions.
- Buttons **never drive navigation**.
- Positions persisted to `localStorage` (Supabase later).

Gesture behaviour is configurable at `/settings/controls`.

---

## Profile / Public profile

- `/profile` → private editing surface. Save publishes to the public mirror.
- `/u/[handle]` → public profile; mirrors exactly what was last saved.

---

## Dev auth bypass

```bash
# .env.local
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
DEV_ADMIN=true
```

**Never enable in production.**

---

## Zip asset uploads

Pushing a `.zip` triggers `.github/workflows/deploy-artifact.yml`, which extracts and merges files into the repo root. Source code (`src/`, `package.json`, etc.) is **never overwritten** — only new/updated asset files are added.
# DREAMengin (Authoritative Spec + Implementation)

DREAMengin is a spatial creative platform built on **Next.js (App Router)** + **Supabase**, navigated via the Golden Button τ-state machine.

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

### Supabase — automatic via Vercel-Supabase integration

If you linked your Supabase project in **Vercel → Integrations → Supabase**, these are injected automatically and the app reads them with no extra setup:

| Variable injected by Vercel | Used as |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (client + server) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon key (client + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key legacy alias (client + server) |
| `dreamengin_SUPABASE_URL` | Project URL (server alias) |
| `dreamengin_SUPABASE_ANON_KEY` | Anon key (server alias) |
| `dreamengin_SUPABASE_JWT_SECRET` | JWT secret |
| `dreamengin_SUPABASE_SERVICE_ROLE_KEY` | Service-role key |
| `dreamengin_SUPABASE_SECRET_KEY` | Service-role key (manual alias) |
| `dreamengin_POSTGRES_*` | Direct Postgres connection strings |

> **The app accepts every name in the table above — you do not need to add any extra vars if you used the Vercel-Supabase integration.**  
> It also accepts the legacy custom names (`NEXT_PUBLIC_dreamengin_SUPABASE_URL`, `NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY`) for backward compatibility.

### Other required secrets

These are **not** injected by the Vercel-Supabase integration — add them manually in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required | Notes |
|---|---|---|
| `SESSION_SECRET` | ✅ | Secret used to sign session tokens |
| `INNERDREAMS_PASSWORD` | ✅ | Password for `/api/admin/*`. One wrong attempt = permanent lockout. |
| `ADMIN_UNLOCK_KEY` | ✅ | Emergency key to bypass permanent admin lockout |
| `OWNER_EMAIL` | ✅ | Owner email for admin gating |
| `OPENAI_API_KEY` | ✅ (prod) | Server-only OpenAI key. Never `NEXT_PUBLIC_`. |
| `GROQ_API_KEY` | prod | Server-only Groq key. Never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | dev only | Set to `true` to skip auth redirects in dev |
| `DEV_ADMIN` | dev only | Set to `true` (+ bypass above) to access admin panel without login in dev |
| `BOOGIE_SIMULATION_MODE` | dev only | Audit events without restricting accounts. Never enable in production. |
| `BOOGIE_DEGRADED` | ops only | Mark TheBoogieMan.Ai as degraded in the status endpoint. |
| `BOOGIE_OFFLINE` | ops only | Mark TheBoogieMan.Ai as offline in the status endpoint. |

### Diagnosing a "Supabase not configured" error

Visit **`/api/setup/check`** in your deployed app — it returns a JSON report of every resolved env var and which names it checked, without exposing values.

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
