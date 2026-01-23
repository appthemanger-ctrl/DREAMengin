# Patch: Fix `WidgetEntry.Component` type error in app/home/page.tsx

**Problem**
Build failed with:
  Property 'Component' does not exist on type 'WidgetEntry' (in app/home/page.tsx).

**What this patch changes**
1) Adds `lib/modules/types.ts` where `WidgetEntry` includes `Component?: React.ComponentType<any>`.
2) Replaces `lib/modules/registry.gen.ts` to build `widgetModules` from `modules/registry.generated.ts`
   and attach a real `Component` via `next/dynamic`. Now `mod?.Component` exists at compile time.

**Files in this patch**
- lib/modules/types.ts
- lib/modules/registry.gen.ts

**How to apply**
1) Upload these files into the same paths in your repo (overwrite existing if present).
2) Commit to main.
3) Vercel will redeploy; the type error on `Component` will be gone.
