# DREAMengin (Dreampage Ignition)

Your private, customizable homepage + public profile. Core features: curated feed, modular widgets (“bubbles”), creator promos, and admin-only “Dr. Eam”.

## Quick Start

**Requirements**
- Node **24.x**
- Vercel for frontend
- Supabase project (Auth, Postgres, Storage)

**Environment (Vercel → Project → Settings → Environment Variables)**
- `NEXT_PUBLIC_SUPABASE_URL` = https://<your>.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = <supabase anon key>
- `SUPABASE_SERVICE_ROLE` = <service role> (Server/Edge only, never expose client-side)
- `NEXT_PUBLIC_SITE_URL` = https://your-vercel-domain.vercel.app
- `ADMIN_PASSWORD` = your-strong-admin-password

> Do **not** commit the service role key.

## Scripts

```bash
npm run dev     # local dev
npm run build   # production build (Vercel runs this)
npm start       # start production server locally
npm run lint    # optional
