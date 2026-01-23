# DREAMengin – TypeScript Fun Patch

What’s inside:
- TypeScript baseline (no strict mode panic)
- Supabase SSR helpers via `@supabase/ssr`
- Animated gradient, glass UI, Inter + Sora
- `/login` (magic-link stub), `/home`, `/home/add` + URL detector
- Vercel installs via `npm install` (lockfile optional)

## Env
Create `.env.local` in the repo root:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Dev
```
npm install
npm run dev
```

Deploy to Vercel as usual.
