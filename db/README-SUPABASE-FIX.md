# Supabase Client/Server Fix

**Why your build failed:** `lib/supabase/client.ts` contained `import { cookies } from "next/headers"`, which
is server-only. A Client Component (`app/.../page.tsx` with `'use client'`) imported that file, so Next.js aborted the build.

**What this patch does**
- Replaces `lib/supabase/client.ts` with a browser-safe client (no `next/headers`).
- Ensures both `supa` and `createClient` are exported for compatibility.
- Ensures `lib/supabase/server.ts` exports `supaServer` and `createServerSupabase`.

**One more step you must do**
- Delete the duplicate file `lib/supabase/client.js` from your repo (keep the new `client.ts`).

**Then commit & push** to trigger a clean Vercel build.
