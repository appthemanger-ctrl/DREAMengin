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

/** Audit-mode mock user — lets every auth-guarded page render without a real session. */
const AUDIT_USER = {
  id: 'audit-user-00000000-0000-0000-0000-000000000001',
  email: 'audit@dreamengin.local',
  app_metadata: {},
  user_metadata: { display_name: 'Audit User', handle: 'audit_user' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

function createAuditClient(): SupabaseClient<Database> {
  // A chainable query builder that always resolves to empty data.
  const emptyQuery = () => {
    const q: Record<string, unknown> = {}
    const noop = () => q
    const resolve = () => Promise.resolve({ data: [], error: null, count: 0 })
    ;[
      'select','insert','update','delete','upsert',
      'eq','neq','gt','gte','lt','lte','like','ilike','is','in','contains',
      'containedBy','rangeLt','rangeGt','rangeGte','rangeLte','rangeAdjacent',
      'overlaps','textSearch','match','not','or','filter',
      'order','limit','range','abortSignal','single','maybeSingle',
      'csv','geojson','explain','rollback','returns',
    ].forEach(m => { q[m] = noop })
    q['then'] = (_: unknown, rej: unknown) =>
      Promise.resolve({ data: [], error: null, count: 0 }).then(_ as Parameters<typeof Promise.prototype.then>[0], rej as Parameters<typeof Promise.prototype.then>[1])
    q['single'] = () => Promise.resolve({ data: null, error: null })
    q['maybeSingle'] = () => Promise.resolve({ data: null, error: null })
    q['select'] = () => q
    void resolve
    return q
  }

  const client = {
    auth: {
      getUser: async () => ({ data: { user: AUDIT_USER }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (_table: string) => emptyQuery(),
    rpc: (_fn: string) => emptyQuery(),
    storage: {
      from: () => ({
        list: async () => ({ data: [], error: null }),
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: [], error: null }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => {},
    }),
    removeChannel: () => {},
    removeAllChannels: () => {},
  }

  return client as unknown as SupabaseClient<Database>
}


export async function createServerClient(): Promise<SupabaseClient<Database>> {
  // AUDIT_MODE: bypass all auth guards so every page renders without a real session.
  if (process.env.AUDIT_MODE === 'true') {
    return createAuditClient()
  }

  if (!isSupabaseConfigured()) {
    return createDisabledClient(`Supabase is not configured. ${SETUP_HINT}`)
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
