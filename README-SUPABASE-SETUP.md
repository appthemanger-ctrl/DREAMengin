# Supabase Wiring (Drop-In)

1) Put these files into your repo at the exact same paths.
   - lib/supabase/client.ts
   - lib/supabase/server.ts
   - app/login/page.tsx
   - .env.local.example (for reference)

2) In Vercel → Project → Settings → Environment Variables (Production + Preview):
   - NEXT_PUBLIC_SUPABASE_URL = https://<your-ref>.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = <publishable anon key>
   - SUPABASE_SERVICE_ROLE = <service role key>  (Server exposure only)

3) Redeploy and check “Clear build cache.”

Notes:
- The clients return `null` when env vars are missing, so pages don't crash during prerender.
- `app/login/page.tsx` is marked `dynamic = 'force-dynamic'` so it won’t prerender at build time.
