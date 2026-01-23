// lib/supabase/server.js
import { createServerClient } from '@supabase/ssr';

export function supaServer(cookiesAdapter) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('@supabase/ssr: Your project URL and API key are required to create a Supabase client!');
  }
  // cookiesAdapter is optional; next/headers based adapters can be passed in pages
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: cookiesAdapter ?? {
      get(name){ return undefined; },
      set(){},
      remove(){},
    }
  });
}
