// server.ts — Next 16.1.4 compatible
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for Next 15/16.
 * `cookies()` is async; we lazily await it inside each method.
 */
export function supaServer() {
  const cookieStorePromise = cookies(); // Promise<ReadonlyRequestCookies>

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStorePromise;
          return store.get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          const store = await cookieStorePromise;
          store.set({ name, value, ...options });
        },
        async remove(name: string, options: any) {
          const store = await cookieStorePromise;
          store.set({ name, value: '', ...options, expires: new Date(0) });
        },
      },
    }
  );
}

// Keep older import name working, if present elsewhere.
export const createServerSupabase = supaServer;
