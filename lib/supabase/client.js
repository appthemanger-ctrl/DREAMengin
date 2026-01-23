// lib/supabase/client.js
// Browser-side Supabase client (Next.js App Router)
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

// Optional named alias used by older imports in this repo:
export const supaClient = createClient
