"use client";

import { createBrowserClient } from "@supabase/ssr";

// Named export used by some pages
export const supa = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Some pages import `createClient` instead of `supa` — provide it:
export const createClient = () => supa;

// Optional default export so `import x from '@/lib/supabase/client'` also works
export default supa;
