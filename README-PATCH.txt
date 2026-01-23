PATCH: Fix module resolution for client + components

This fixes build errors like:
- Module not found: Can't resolve '@/lib/supabase/client'
- Module not found: Can't resolve '@/components/DraggableModules'

Files included (add/overwrite in your repo):
- lib/supabase/client.ts
- components/DraggableModules.tsx
- components/AudioPlayer.tsx

iOS / Working Copy quick steps:
1) Copy each file into the exact paths above.
2) Commit: "fix: add supabase client + component stubs"
3) Push to GitHub. Vercel will redeploy.

Notes:
- The client file is a **client module** and exports both `supaClient()` and a default `supabase` instance.
- If you already had a file named `lib/supabase/client` (no extension), remove it to avoid ambiguity.
- Case matters on Linux. Ensure the import matches the filename exactly: DraggableModules.tsx ⇢ `@/components/DraggableModules`.
