# DREAMengin — Production Fix Patch

This patch does four things to get your build green:
1) Adds **vercel.json** to force `npm install` (so lack of lockfile won't break builds).
2) Provides a **safe package.json** locked to Next 14.2.6 + React 18.2.0 (matches your logs).
3) Adds **lib/supabase/client.js** and **lib/supabase/server.js** to satisfy missing imports.
4) Adds **components/AccentPicker.js** + **lib/env.js** (env validator).

## How to apply (Working Copy or Git CLI)

- Drop these files at the **repo root**, preserving folder paths.
- If you already have a package.json you prefer to keep, *merge* the deps below instead:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react-hook-form": "^7.51.5",
    "next": "14.2.6",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
```

- Ensure environment variables exist in Vercel:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - (optional) SUPABASE_SERVICE_ROLE_KEY

## Commit & Deploy

```bash
git add vercel.json lib/ components/ package.json lib/env.js
git commit -m "fix: add supabase clients, accent picker, env check, force npm install"
git push origin main
```

If you prefer `npm ci`, generate and commit a lockfile instead:

```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: lockfile for CI"
git push
```

## Notes
- Keeping **React 18.2.0** + **react-dom 18.2.0** avoids version mismatch.
- You can later upgrade to Next 15/React 19 together; for now this matches your previous successful compiles.
