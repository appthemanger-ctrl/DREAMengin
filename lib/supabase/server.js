import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export function supaServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Return a client that won't crash if keys are missing
    return createServerClient('http://localhost', 'public-anon-key', {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {}
      }
    });
  }

  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value; },
      set(name, value, options) { cookieStore.set({ name, value, ...options }); },
      remove(name, options) { cookieStore.set({ name, value: '', ...options }); }
    },
    headers: {
      get: (name) => headers().get(name) || undefined
    }
  });
}
