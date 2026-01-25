PATCH: Fix @/* path alias so Vercel resolves imports like @/lib/... and @/components/...

How to use (iOS / Working Copy):
1) Put `tsconfig.json` at the **root** of your repo (same folder as package.json).
2) If your code lives in the root (no /src folder), keep this file as-is.
   If your code lives under /src, rename `tsconfig.src.json` -> `tsconfig.json`.
3) Commit and push:
   - message: "fix: tsconfig alias @/* -> ./*"
4) Redeploy on Vercel. If needed, click "Redeploy" > "Clear build cache".

Sanity checks:
- A file at lib/supabase/client.ts should be importable as:
    import supabase from "@/lib/supabase/client";
- A component at components/DraggableModules.tsx should be importable as:
    import DraggableModules from "@/components/DraggableModules";

Notes:
- Linux (Vercel) is case-sensitive. DraggableModules.tsx != draggablemodules.tsx.
- Remove any files with no extension like `lib/supabase/client` (without .ts/.js),
  they can confuse the resolver.
