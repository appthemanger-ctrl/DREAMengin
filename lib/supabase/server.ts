import 'server-only'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

type DisabledSupabaseClient = {
  auth: {
    getUser: () => Promise<never>
    getSession: () => Promise<never>
    signOut: () => Promise<never>
  }
  from: (..._args: unknown[]) => never
  rpc: (..._args: unknown[]) => never
  storage: unknown
}

/**
 * Supabase SSR client factory.
 *
 * - Does not crash builds when env vars are missing.
 * - When unconfigured, returns a "disabled" client that throws only when used.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

function createDisabledClient(reason: string): DisabledSupabaseClient {
  const thrower = async () => {
    throw new Error(reason)
  }

  const disabled: DisabledSupabaseClient = {
    auth: {
      getUser: thrower,
      getSession: thrower,
      signOut: thrower,
    },
    from() {
      throw new Error(reason)
    },
    rpc() {
      throw new Error(reason)
    },
    storage: {},
  }

  return disabled
}

export async function createServerClient() {
  if (!isSupabaseConfigured()) {
    return createDisabledClient(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    ) as unknown as ReturnType<typeof createSupabaseServerClient<Database>>
  }

  // In Next.js 16, cookies() is async
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component. Ignore if middleware refreshes sessions.
        }
      },
    },
  })
}

export async function createServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase service role is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createSupabaseServerClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // no-op
      },
    },
  })
}
