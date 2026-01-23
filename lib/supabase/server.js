import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function supaServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return store.get(name)?.value;
        },
        set(name, value, options) {
          store.set({ name, value, ...options });
        },
        remove(name, options) {
          store.set({ name, value: '', ...options, expires: new Date(0) });
        },
      },
    }
  );
}

export const createServerSupabase = supaServer;
export default supaServer;
