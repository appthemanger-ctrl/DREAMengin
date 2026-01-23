# Project Overlay (Prepare Script + Shims)

This zip is an overlay for your existing Next.js repo.

It adds:
- `scripts/prepare.mjs` — generates module registry and prevents export issues
- `lib/modules/registry.gen.ts` — safe shim (will be overwritten on build)
- `modules/widgets/.gitkeep` and `modules/connectors/.gitkeep` — so dirs exist
- `lib/supabase/server.js` and `lib/supabase/client.js` — stable helpers matching your imports

## 1) Unzip into your repo root
Let it create `scripts/`, `lib/`, and `modules/` folders.

## 2) Edit package.json
Add or merge these scripts:
```json
{
  "scripts": {
    "prebuild": "node scripts/prepare.mjs",
    "build": "next build",
    "dev": "next dev",
    "start": "next start"
  }
}
```
If you already have `prebuild`, prepend `node scripts/prepare.mjs && ` in front of it.

> Tip (no-edit alternative): you can also add `"postinstall": "node scripts/prepare.mjs"` to run this during Vercel install.

## 3) Commit & deploy
- Commit the added files.
- Make sure your Vercel env vars are set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Done. The build will no longer fail if widgets/connectors are empty, and server pages will be forced dynamic to avoid export errors.
