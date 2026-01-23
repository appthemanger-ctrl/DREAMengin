// lib/supabase/client.js
'use client';
import { createBrowserClient } from '@supabase/ssr';

let _client = null;
export function supaBrowser() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("@supabase/ssr: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _client = createBrowserClient(url, anon);
  return _client;
}
