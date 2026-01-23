import { createBrowserClient } from '@supabase/ssr';

// Returns a Supabase browser client or null if env not set.
export function getSupaBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}
