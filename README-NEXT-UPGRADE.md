# Next.js Upgrade Patch (minimal)

This patch only replaces **package.json** to:
- Upgrade `next` from 14.2.6 → ^14.2.15 (patched 14.x).
- Add the devDependencies Vercel needs for TS + Tailwind builds.

## Apply
1) Replace your repo's `package.json` with the one in this patch.
2) If your repo has `package-lock.json`, run locally:

   ```bash
   npm install
   git add package.json package-lock.json
   git commit -m "chore: bump next to ^14.2.15 + add devDeps"
   git push
   ```

   *If you cannot run locally right now*, you can also delete `package-lock.json` in the repo,
   commit the deletion, and Vercel will resolve fresh versions from `package.json` on build.

3) Trigger a new Vercel deployment.

## Notes
- This patch does **not** delete or modify any other files.
- If you still see "Attempted import error" about `supa` or `createClient`,
  ensure your `lib/supabase/client.ts` exports:

  ```ts
  "use client";
  import { createBrowserClient } from "@supabase/ssr";
  export const supa = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  export const createClient = () => supa;
  export default supa;
  ```

  And server-side at `lib/supabase/server.ts`:

  ```ts
  import { cookies } from "next/headers";
  import { createServerClient } from "@supabase/ssr";
  export function supaServer() {
    const store = cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: {
          get: (n) => store.get(n)?.value,
          set: (n, v, o) => store.set({ name: n, value: v, ...o }),
          remove: (n, o) => store.set({ name: n, value: "", ...o, expires: new Date(0) })
      }}
    );
  }
  export const createServerSupabase = supaServer;
  ```

