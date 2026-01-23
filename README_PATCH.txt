PATCH: Make app dynamic + fix Supabase server helper

This patch does two things:
1) Ensures the app is NOT static-exported (no `output: 'export'`).
2) Provides a correct `supaServer()` function return from `@supabase/ssr` so imports like
   `import { supaServer } from '@/lib/supabase/server'` work across pages.

Files:
- next.config.mjs
- app/page.tsx
- lib/supabase/server.ts

How to apply (GitHub web, iOS-friendly):
1) Download this zip.
2) In your repo, click "Add file" → "Upload files".
3) Drag these files into the repo root (they will land in the right paths).
4) Commit to main → Vercel redeploys.

If you still see errors referencing `supaServer` not a function, it means some page
imports a default export or a different path. Fix by ensuring the import is exactly:
  import { supaServer } from '@/lib/supabase/server';
