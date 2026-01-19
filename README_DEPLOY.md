# DreamEngin deploy (Vercel)

## What you get
- Public landing at `/`
- Authenticated dashboard at `/app`
- API under `/api/*` (serverless on Vercel)

## Required env vars (Vercel → Project → Settings → Environment Variables)
- `DREAMENGIN_MASTER_KEY` (or `INNERDREAMS_PASSWORD`) — unlocks the dashboard.
- `INNERDREAMS_PASSWORD` — required for `/api/innerdreams` calls (can be same as master key).
- Optional: `AUTH_SECRET` — if set, used to sign auth cookies (recommended).

## Vercel settings
- Build Command: `npm run build`
- Output Directory: `dist/public`

## Test
- Public: visit `/`
- Login: click the key icon on the landing page, enter the master key, then go to `/app`
- Health: `/api/health`
