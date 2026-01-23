import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function supaServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          store.set({ name, value: '', ...options, expires: new Date(0) });
        },
      },
    }
  );
}

// Alias for older imports.
export const createServerSupabase = supaServer;
export default supaServer;
