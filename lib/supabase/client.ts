"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * - Safe for Client Components
 * - NO `next/headers` here
 */
export const supa = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Some pages import `createClient` – keep that working.
export const createClient = () => supa;

// Default export for default-import style.
export default supa;
