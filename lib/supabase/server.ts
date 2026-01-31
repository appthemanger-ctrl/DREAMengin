import 'server-only'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Gracefully handle missing env vars at module load time
// Actual validation happens when the client is created
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function validateSupabaseEnv(requireServiceRole = false) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
  }
  if (requireServiceRole && !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase service role is not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.'
    )
  }
}

export async function createServerClient() {
  validateSupabaseEnv()
  
  // In Next.js 16, cookies() is async
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  validateSupabaseEnv(true)
  
  return createSupabaseServerClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // no-op
        },
      },
    }
  )
}
