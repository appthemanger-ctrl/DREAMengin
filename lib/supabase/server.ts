import 'server-only'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  isSupabaseConfigured,
  SETUP_HINT,
} from './env'

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

export type SupabaseCookieStore = Pick<Awaited<ReturnType<typeof cookies>>, 'getAll' | 'set'>

/**
 * Supabase SSR client factory.
 *
 * - Does not crash builds when env vars are missing.
 * - When unconfigured, returns a "disabled" client that throws only when used.
 * - Env vars resolved by lib/supabase/env.ts (accepts multiple naming conventions).
 */

function createDisabledClient(reason: string): SupabaseClient<Database> {
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

  return disabled as unknown as SupabaseClient<Database>
}

export function createServerClientWithCookies(
  cookieStore: SupabaseCookieStore
): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    return createDisabledClient(`Supabase is not configured. ${SETUP_HINT}`)
  }

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

export async function createServerClient(): Promise<SupabaseClient<Database>> {
  return createServerClientWithCookies(await cookies())
}

export async function createServiceClient(): Promise<SupabaseClient<Database>> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      `Supabase service role is not configured. Set dreamengin_SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.`
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
