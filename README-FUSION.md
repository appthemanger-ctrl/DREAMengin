# Dynamic Dream Fusion

This bundle uses **UI/UX from Dynamic-Dream-Engine** with the **backend (API + Supabase helpers) from DREAMengin**.
Target framework: **Next.js 16.1.4**.

## What we merged
- From backend: lib/supabase, db, scripts
- Supabase helpers updated for Next 16 async cookies.
- Package.json merged & pinned to next@16.1.4, plus Supabase + Tailwind deps.
- .env.example added (fill your Supabase URL + anon key).

## Setup
1) Copy `.env.example` to `.env.local` and fill:
   - NEXT_PUBLIC_SUPABASE_URL=...
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=...
2) Install & run:
   npm install
   npm run dev

## Deploy (Vercel)
- Add the two env vars in your Vercel project Settings → Environment Variables.
- Redeploy.
