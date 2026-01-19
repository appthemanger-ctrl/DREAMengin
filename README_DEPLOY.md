# DreamEngin — Vercel Deploy (Full-stack MVP)

## What works in this build
- `/` public homepage (DreamEngin landing)
- `/login` username+password auth (cookie session)
- `/app` private Dream Home (auth-required)
- `/@username` public Dream Pages (basic profile)
- API under `/api/*` (Vercel serverless)

## Vercel settings (do this)
- **Node.js Version:** `20.x`
- **Framework Preset:** Vite (fine)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** *(leave blank)*

### Clear cache
When you hit **Redeploy**, uncheck “Use existing Build Cache” (that’s the cache toggle).

## Required env vars
Set these in Vercel → Project → Settings → Environment Variables:
- `SESSION_SECRET` = a long random string
- `ADMIN_KEY` = your owner/admin master key (used by “Open Admin Panel”)

> Without `ADMIN_KEY`, admin login is disabled.

## Notes on users & persistence
This MVP uses **in-memory storage** for user accounts (fast + deploys free).
For real persistence, wire `DATABASE_URL` to Postgres (Neon/Supabase/etc.) and swap `MemStorage` for a DB storage.

## Local dev
```bash
npm i
npm run dev
# open http://localhost:5000
```
