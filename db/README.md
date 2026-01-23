# DREAMengin

One-file README. Everything else lives in the code.

## Quick start
1) Install deps and lockfile (for Vercel):
```bash
npm install
```
2) Set **environment variables** (Vercel → Project → Settings → Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- *(optional)* `SUPABASE_SERVICE_ROLE_KEY`

3) Dev:
```bash
npm run dev
```

## Build & Deploy (Vercel)
- Commit the lockfile (`package-lock.json`).
- Vercel will run `npm install` and `next build`.

## Project layout
```
app/         # Next.js App Router routes (login, home, music, shop, settings...)
components/  # Reusable UI (WidgetGrid, AudioPlayer, AccentPicker, etc.)
lib/         # supabase client(s), theme helpers
public/      # static assets
```
