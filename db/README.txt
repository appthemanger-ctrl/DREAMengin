NEXT 16.1.4 COOKIES FIX (Supabase server + NavBar one-liner)
------------------------------------------------------------
1) Copy ONE of these over your repo file (whichever path you use):
   - lib/supabase/server.ts
   - db/lib/supabase/server.ts

2) In components/NavBar.tsx, change:
     const isAdmin = cookies().get('admin')?.value === '1';
   to:
     const isAdmin = (await cookies()).get('admin')?.value === '1';

   A unified diff is provided at: patches/components/NavBar.tsx.patch

3) Commit & push.
   git add lib/supabase/server.ts db/lib/supabase/server.ts components/NavBar.tsx
   git commit -m "fix(next16): await cookies() in server + NavBar"
   git push

Notes:
- Keeps alias export: `export const createServerSupabase = supaServer;`
- No deletions; only drop-in replacements.
