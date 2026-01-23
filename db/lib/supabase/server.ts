import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// DB helper variant used by some modules; same async-cookies pattern.
export function createClient() {
  const cookieStorePromise = cookies();
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
