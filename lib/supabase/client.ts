"use client";
import { createBrowserClient } from "@supabase/ssr";

export const supa = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Backwards-compatible helper for files importing { createClient } from '@/lib/supabase/client'
export function createClient() {
  return supa;
}
