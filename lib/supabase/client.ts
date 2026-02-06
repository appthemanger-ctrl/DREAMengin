import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Gracefully handle missing env vars - won't crash at build time
// but will throw clear errors at runtime if actually used without config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
  }
  
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
