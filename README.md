# DREAMengin (Authoritative Spec + Implementation)

DREAMengin is a spatial, gesture-driven creative platform built on **Next.js (App Router)** + **Supabase**.

This repo is **spec-governed**. The documents in `/docs` are **not suggestions** — they are binding constraints on implementation.

## Start here (LAW)

- **docs/LAW.md** — front door + enforcement summary (LOCKED)
- **docs/AXIOMS.md** — non-negotiables (LOCKED)
- **docs/WIDGET_SYSTEM_V2.md** — widgets, instances, and window presentation
- **docs/ARCHITECTURE.md** — τ navigation, Home model, controls
- **docs/SECURITY.md** — Supabase/RLS, privacy, least-privilege
- **docs/ADD_WORKFLOW.md** — how additions must be integrated

If code conflicts with these docs, **code must change**.

## Product model (high level)

- The user is always conceptually inside **Home (node 0)**.
- “Pages” may exist, but they must open like **windows/widgets** inside the Home system.
- Navigation is **τ-only** (state transitions), not a traditional site nav model.
- **Day Dreams** are protected: they are full-powered mini-apps.


## Environment variables

All secrets are server-side only. See `.env.example` for the full list with descriptions.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only. Never `NEXT_PUBLIC_`. |
| `GROQ_API_KEY` | ✅ | Server-only AI provider key. Never `NEXT_PUBLIC_`. |
| `OWNER_EMAIL` | ✅ | Owner email for admin gating |
| `ADMIN_CODE_PASSWORD` | ✅ | Password for `/api/admin/ai-chat`. One wrong attempt = permanent lockout. |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | dev only | Set to `true` to skip auth redirects in dev (UI inspection mode) |
| `DEV_ADMIN` | dev only | Set to `true` (+ bypass above) to access admin panel without login in dev. IDARi APIs remain password-protected. |

## AI Triad

| Agent | Role | Endpoint | Auth |
|---|---|---|---|
| Dr. Eams | User-facing assistant | `POST /api/ai/eams` | Authenticated user |
| IDARi | Admin optimizer / debugger | `POST /api/ai/idari` | Admin only |
| BoogieMan | Policy + system overwatch | `POST /api/ai/boogieman` | Admin only |

- All AI keys are configured as **Vercel environment variables**, never committed.
- IDARi and BoogieMan endpoints are admin-guarded even when `DEV_BYPASS_AUTH` is on.
- Major system updates require unanimous triad approval (consensus gating) via `/admin`.

## Dev auth bypass (interface inspection mode)

Set in `.env.local` for UI review without a live Supabase account:

```bash
NEXT_PUBLIC_DEV_BYPASS_AUTH=true   # skips auth redirects on user-facing pages
DEV_ADMIN=true                      # also opens /admin without login (IDARi APIs still need password)
```

**Never** set these in Vercel production environment variables.
## Development

### Local
1. Install deps: `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in all values
3. Run dev server: `pnpm dev`

(See `docs/SECURITY.md` for required env + RLS expectations.)

### Repo guardrails
- Protected Day Dream paths require `[DAYDREAM_OK]` in PR title.
- See `docs/LAW.md` and `.github/workflows/law.yml`.

