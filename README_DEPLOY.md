# DREAMengin deployment (Vercel full-stack)

This repo contains:
- **Main app** at repo root (deploy this on Vercel)
- **MVP snapshot** in `./mvp` (optional reference; not deployed unless you set Vercel Root Directory to `mvp`)

## Vercel settings (Main app)
- **Framework Preset:** Vite (or "Other")
- **Build Command:** `npm run build`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`
- **Node.js Version:** 20.x

## API on Vercel
All API routes are handled by `api/index.ts` and are reachable at:
- `/api/*`

No server `listen()` is used in Vercel runtime.

## Environment variables
Set these in Vercel Project → Settings → Environment Variables (Production + Preview as needed):

- `DATABASE_URL` (Postgres connection string) if you use DB features
- `SESSION_SECRET` (recommended)
- Any variables required by `server/innerdreams.ts` (see the `requireEnv(...)` calls in that file)

## Innerdreams
The admin endpoint exists at:
- `POST/GET /api/innerdreams` (admin-only)

The UI admin page is:
- `/innerdreams-admin.html`

## Local dev
```bash
npm install
npm run dev
```

## Deploying the MVP instead
In Vercel, set **Root Directory** to `mvp` and use the same build/output settings.
