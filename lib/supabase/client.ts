'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 * Make sure you have the following env vars set in Vercel:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
