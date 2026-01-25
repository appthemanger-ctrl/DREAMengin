MOVE-ON PATCH
--------------
This patch adds safe placeholder modules and pages so your Next.js build on Vercel will not fail due to missing files.

Added:
- lib/supabase/{client.ts,server.ts}
- components/{DrEamChat.tsx,FeedCard.tsx,AudioPlayer.tsx,AccentPicker.tsx}
- lib/feed/query.ts
- lib/modules/registry.gen.ts (placeholder registry with one sample widget)
- app/home/page.tsx (safe version using optional chaining)
- app/login/page.tsx (basic email/password login)
- styles/globals.css (minimal)
- scripts/gen-mod-registry.mjs (optional generator)

How to apply:
1) Drop these files into your repo without deleting your existing ones. Overwrite only if you want the safe defaults.
2) Ensure tsconfig.json has:  "baseUrl": ".",  "paths": { "@/*": ["./*"] }
3) Ensure environment vars on Vercel:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4) Commit & redeploy.
