DREAMengin — Supabase SSR Fix (drop-in patch)
=============================================

What this patch does
--------------------
1) Adds the two helper files expected by your codebase:
   - lib/supabase/client.js  -> createBrowserClient wrapper
   - lib/supabase/server.js  -> createServerClient wrapper (with cookie bridge)
2) Provides aliases `supaClient` and `supaServer` so older imports keep working.

One REQUIRED step in package.json
---------------------------------
Install the missing dependency **@supabase/ssr** by adding it to your dependencies.

If you use Working Copy on iOS:
  • Tap `package.json` → Edit.
  • Under "dependencies", add this line (keep JSON commas correct):
      "@supabase/ssr": "^0.5.1"
  • Commit (Push ON) with message: fix: add @supabase/ssr and SSR helpers

If you prefer CLI:
  npm i @supabase/ssr

Imports to use in code
----------------------
Client (browser):
  import { createClient } from '@/lib/supabase/client'
  const supabase = createClient()

Server (RSC / route / server action):
  import { createServerClientFixed } from '@/lib/supabase/server'
  const supabase = createServerClientFixed()

That’s it. Re-deploy on Vercel and the build should pass.
