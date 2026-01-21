# DREAMPAGE: IGNITION (MVP)


# dreampage (Next.js + Supabase MVP)

- Next.js App Router + Tailwind + TS
- Supabase Auth + basic tables (widgets, error_reports)
- API routes: /api/assistant, /api/widgets/counter, /api/errors/report

## Setup
1. `npm i`
2. Create Supabase project. Copy `.env.example` -> `.env.local`, fill URL + anon key.
3. In Supabase SQL editor run `supabase/migrations/0001_minimal.sql`.
4. `npm run dev`

## Deploy
- Vercel for frontend (connect GitHub repo). Add env vars.
- Supabase for DB/Auth/Storage. (Supabase is **not** a Vercel replacement; it complements Vercel as your backend)


## Feed schema
Run `supabase/migrations/0002_feed.sql` after the minimal migration to enable DreamFeed.


## Drop-in Modules (no core edits)
- Add a folder under `modules/<slug>/` with a `module.json`:
  - Widget example:
    ```json
    { "type": "widget", "name": "Promo", "entry": "Widget.tsx" }
    ```
    And a `Widget.tsx` that exports a React component.
  - Connector example:
    ```json
    { "type": "connector", "name": "My Connector", "entry": "server.ts" }
    ```
    And `server.ts` should export `async function ingest({ userId })` that writes to `feed_items`.

- On build, `scripts/gen-mod-registry.mjs` scans `modules/*/module.json` and generates
  `lib/modules/registry.gen.ts` with static imports. So **just add a file/folder and push**.

- Enable widgets in **/settings → Available Modules**, run connectors via `POST /api/modules/ingest`.


## Dr. Eam (site-updating AI)
- Admin-only commands via `/api/eam/command` (cookie set by `/admin/login`).
- Say **"next phase"** in the Dr. Eam chat (or click the button in **/admin**) to:
  - Phase 1: initialize feed rules, add default widgets, seed feed items.
  - Phase 2: connect a sample YouTube account + seed an item.


## Theme control (Dr. Eam)
- In **Settings → Dr. Eam: Theme Control**, enable the toggle to allow Eam to change your theme.
- Commands (admin, in Dr. Eam chat):
  - `font sora` — switch font
  - `color #7c3aed` — change brand color
  - `next theme phase` — cycle through curated palettes


## Dr. Eam (Natural-language admin commands)
Admin-only (via `/admin/login`). Examples:
- **"next phase"** — seed rules/widgets/items; then connect a sample source.
- **"dark mode" / "light mode"** — toggle site default & admin profile.
- **"use orange" / "accent to purple" / "make it pop"** — set brand color.
- **"font sora" / "go modern" / "grotesk"** — switch fonts.
- **"bigger text" / "smaller text"** — adjust base font size.
- **"reset theme"** — restore defaults.
- **"apply to everyone"** — apply current default theme to all **opted-in** users.

Users can **opt-out** of theme changes in **Settings → Dr. Eam: Theme Control**.


## New features
- **Search** (/discover): users, music, products.
- **Shop & My Shop**: list products and manage your storefront.
- **Ads Marketplace** (/ads): create ad slots with pricing; browse public slots.
- **Profile pics & links**: upload avatar to Storage bucket `avatars` and add Roblox/custom links in Settings.
- **Science Lab** (/lab): projectile range & Ohm's law machines.
- **Music Releases** (/music): add releases (free for now), promote later via ad slots.

### Storage setup
Create a Supabase Storage bucket named `avatars` with public read. (Optionally add policies to restrict writes to owner via service role, but client SDK upload is acceptable for MVP.)
