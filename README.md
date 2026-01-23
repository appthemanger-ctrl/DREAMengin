# DREAMengin TS Fun Patch

What this adds:
- Next.js 15 + React 19 setup
- Tailwind v4 CSS-only gradient + glass UI
- Magic-link login with animated mascot
- Home with draggable widgets
- Add-anything page (auto-detect YouTube/Spotify/link)
- Supabase SSR helpers (client + server)

Deploy fix:
- `vercel.json` forces `npm install` so no lockfile is required.

Env required (Vercel Project Settings → Environment Variables):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
