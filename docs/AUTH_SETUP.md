# DREAMengin — Auth & Environment Setup Guide

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


This document explains exactly where every authentication-related value belongs
and why. Follow these steps to configure Google OAuth + Supabase auth for local
development and production.

---

## Where each value lives

| Value | `.env.local` | Vercel env vars | Supabase Dashboard | Google Cloud Console |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ (auto-injected by integration) | — | — |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ (auto-injected by integration) | — | — |
| `dreamengin_SUPABASE_*` | ✅ | ✅ (auto-injected by integration) | — | — |
| `OPENAI_API_KEY` / `GROQ_API_KEY` | ✅ | ✅ | — | — |
| `YOUTUBE_API_KEY` / `API_KEY` | ✅ | ✅ | — | — |
| `SESSION_SECRET` | ✅ | ✅ | — | — |
| `IDARI_PASSWORD` | ✅ | ✅ | — | — |
| `ADMIN_UNLOCK_KEY` | ✅ | ✅ | — | — |
| `OWNER_EMAIL` | ✅ | ✅ | — | — |
| `GOOGLE_CLIENT_ID` (YouTube connector) | ✅ | ✅ | — | — |
| `GOOGLE_CLIENT_SECRET` (YouTube connector) | ✅ | ✅ | — | — |
| Google OAuth Client ID (Supabase auth) | ❌ not in env | ❌ | ✅ Auth → Providers → Google | ✅ credentials page |
| Google OAuth Client Secret (Supabase auth) | ❌ **never** | ❌ **never** | ✅ Auth → Providers → Google | — |
| `DEV_BYPASS_AUTH` | ✅ (dev only) | ❌ **never** | — | — |
| `DEV_ADMIN` | ✅ (dev only) | ❌ **never** | — | — |

---

## Step-by-step: Google OAuth setup

### Step 1 — Google Cloud Console

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Select (or create) your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://jnpkzaneznwnomhmvxxs.supabase.co/auth/v1/callback
   ```
   This is the URI Supabase uses to receive the OAuth code from Google.
   Missing this is the most common cause of Google's `redirect_uri_mismatch` (400) error.

### Step 2 — Supabase Dashboard (Google provider)

1. Open **Supabase Dashboard → Authentication → Providers** for your project
   (direct link: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/providers`)
2. Enable **Google**
3. Paste your **Google Client ID** and **Google Client Secret** there
4. ⚠️ The Client Secret belongs **only** in the Supabase Dashboard — never in `.env.local`,
   never in Vercel env vars, never committed to source control

### YouTube API key note

- Prefer `YOUTUBE_API_KEY` for server-side YouTube integrations.
- If your deployment already uses a shared `API_KEY`, DREAMengin now falls back to that value for YouTube discovery and other server-side YouTube API access when `YOUTUBE_API_KEY` is unset.
- The same Google API key can be reused for YouTube Analytics requests after you enable that API in the same Google Cloud project.

### Step 3 — Supabase Dashboard (redirect URL allow-list)

1. Open **Supabase Dashboard → Authentication → URL Configuration** for your project
   (direct link: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/url-configuration`)
2. Add all of the following to **Redirect URLs**:

   | URL | Purpose |
   |---|---|
   | `https://dreamengin.com/auth/callback` | Production apex domain |
   | `https://www.dreamengin.com/auth/callback` | Production www domain |
   | `https://dreamengin.vercel.app/auth/callback` | Vercel deployment |
   | `https://*-dreamengin.vercel.app/auth/callback` | Preview deployments (wildcard) |
   | `http://localhost:3000/auth/callback` | Local development |

   The app's callback handler lives at `app/auth/callback/route.ts`.

---

## Dev auth bypass (local only)

Two server-only env vars exist for local UI inspection without a real Supabase account:

```
DEV_BYPASS_AUTH=true   # skips auth redirects on user-facing pages
DEV_ADMIN=true         # also unlocks admin panel (requires DEV_BYPASS_AUTH=true)
```

**Security guarantees:**
- Both vars have **no** `NEXT_PUBLIC_` prefix — they are never bundled into the browser
- Both are **hard-blocked** when `NODE_ENV === 'production'` in `lib/dev-bypass.ts`,
  so even if accidentally set in a Vercel env var they cannot weaken a production deployment
- IDARi API endpoints (`/api/ai/idari`, `/api/admin/*`) always require a real
  Supabase session + admin role, regardless of bypass flags
- **Never** set `DEV_BYPASS_AUTH` or `DEV_ADMIN` in Vercel environment variables

---

## What NOT to do

| ❌ Don't | ✅ Do instead |
|---|---|
| Set `NEXT_PUBLIC_DEV_BYPASS_AUTH` anywhere | Use `DEV_BYPASS_AUTH` (server-only) |
| Put Google OAuth Client Secret in `.env.local` or Vercel | Put it in Supabase Dashboard only |
| Use `NEXT_PUBLIC_` prefix on any secret or bypass flag | Use server-only names (no prefix) |
| Commit `.env.local` | Add it to `.gitignore` |
| Set `DEV_BYPASS_AUTH` in Vercel production env | Leave it out of Vercel entirely |

---

## Diagnostic endpoint

`GET /api/setup/google-oauth` returns a JSON summary of your current config state,
the computed Supabase callback URL, and direct links to the Supabase Dashboard pages
you need to configure. No secrets are returned.
