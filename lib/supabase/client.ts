'use client';
import { createBrowserClient } from '@supabase/ssr';

export const supa = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Some files import `createClient` instead of `supa`.
export function createClient() {
  return supa;
}

// Default export so `import supa from '@/lib/supabase/client'` also works.
export default supa;
