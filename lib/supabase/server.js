// Server-only Supabase client for Next.js App Router
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export function supaServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Return a dummy client-like shim to avoid crashing builds
    return {
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      from: () => ({ select: async () => ({ data: [], error: null }) })
    };
  }

  const cookieStore = cookies();
  const hdrs = headers();

  return createServerClient(url, anon, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch { /* no-op during edge/static */ }
      }
    },
    headers: {
      get(name) { try { return hdrs.get(name); } catch { return undefined; } }
    }
  });
}
