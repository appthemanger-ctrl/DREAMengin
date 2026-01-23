import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client that persists auth via cookies.
 */
export function supaServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return store.get(name)?.value; },
        set(name: string, value: string, options: any) { store.set({ name, value, ...options }); },
        remove(name: string, options: any) { store.set({ name, value: "", ...options, expires: new Date(0) }); },
      },
    }
  );
}

// Some pages import this older name – keep it as an alias.
export const createServerSupabase = supaServer;

// Default export for default-import style.
export default supaServer;
