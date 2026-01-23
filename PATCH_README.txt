This patch does two things during your build:
1) Ensures the pages that call Supabase are marked as dynamic so Vercel stops
   trying to prerender them.
2) Keeps generating modules/registry.generated.ts exactly as before.

What you do:
- Drop the /scripts and /lib folders from this zip into the root of your repo,
  replacing files if prompted.
- Commit and push. Your existing package.json already runs
    "prebuild": "node scripts/gen-mod-registry.mjs || true"
  so the injection runs automatically.

The pages that will be auto-patched if present are:
  app/ads/page.tsx
  app/connectors/page.tsx
  app/home/page.tsx
  app/music/page.tsx
  app/shop/page.tsx
  app/shop/me/page.tsx
  app/page.tsx

The patch only inserts this one-liner (if it isn't already there):
  export const dynamic = 'force-dynamic';
and it preserves a top-level 'use client' directive when needed.
