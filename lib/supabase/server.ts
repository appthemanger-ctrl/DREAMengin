import 'server-only'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './config'
import { SUPABASE_SERVICE_ROLE_KEY } from './config'

type DisabledSupabaseClient = {
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: Error }>
    getSession: () => Promise<{ data: { session: null }; error: Error }>
    signOut: () => Promise<{ error: null }>
  }
  from: (..._args: unknown[]) => DisabledQueryBuilder
  rpc: (..._args: unknown[]) => DisabledQueryBuilder
  storage: {
    from: (..._args: unknown[]) => DisabledStorageBucket
  }
}

/**
 * Chainable, thenable query-builder stub used by the disabled client.
 *
 * Why: real PostgREST queries look like
 *   `await supabase.from('t').select('*').eq('user_id', id).order(...).limit(N)`
 * and callers always destructure `{ data, error }`. When Supabase is not
 * configured we MUST NOT throw from these calls — that would crash the SSR
 * stream for every PPR page in the app and the server would close the socket
 * before sending any body bytes (manifesting as `IncompleteRead(0 bytes read)`
 * to clients). Instead the proxy:
 *   - returns itself for any method access (so chains keep building),
 *   - is awaitable (a thenable) and resolves to a Supabase-shaped error result.
 */
type DisabledQueryResult = {
  data: null
  error: { message: string; code: string; details: null; hint: null }
  count: null
  status: number
  statusText: string
}

type DisabledQueryBuilder = PromiseLike<DisabledQueryResult> & {
  [key: string]: unknown
}

type DisabledStorageBucket = {
  upload: (..._args: unknown[]) => Promise<{ data: null; error: Error }>
  download: (..._args: unknown[]) => Promise<{ data: null; error: Error }>
  remove: (..._args: unknown[]) => Promise<{ data: null; error: Error }>
  list: (..._args: unknown[]) => Promise<{ data: null; error: Error }>
  getPublicUrl: (..._args: unknown[]) => { data: { publicUrl: string } }
  createSignedUrl: (..._args: unknown[]) => Promise<{ data: null; error: Error }>
}

export type SupabaseCookieStore = Pick<Awaited<ReturnType<typeof cookies>>, 'getAll' | 'set'>

/**
 * Supabase SSR client factory.
 *
 * - Does not crash builds when env vars are missing.
 * - When unconfigured, falls back to canonical project config.
 * - Env vars resolved by lib/supabase/config.ts.
 */

function createDisabledClient(reason: string: SupabaseClient<Database>) {
  const authError = new Error(reason)

  // Proxy that satisfies the postgrest query-builder shape: every method
  // returns the same proxy (so `.from('x').select().eq().order().limit()`
  // keeps chaining), and the proxy is awaitable, resolving to an error
  // result that matches PostgREST's `{ data, error, count, status }` shape.
  const buildDisabledQueryBuilder = (): DisabledQueryBuilder => {
    const result: DisabledQueryResult = {
      data: null,
      error: {
        message: reason,
        code: 'supabase_unconfigured',
        details: null,
        hint: null,
      },
      count: null,
      status: 503,
      statusText: 'Service Unavailable',
    }

    const target: DisabledQueryBuilder = {
      then(onfulfilled, onrejected) {
        return Promise.resolve(result).then(onfulfilled, onrejected)
      },
    } as DisabledQueryBuilder

    return new Proxy(target, {
      get(obj, prop) {
        if (prop === 'then') {
          return obj.then
        }
        // Async iterator support for `for await (...)` consumers.
        if (prop === Symbol.asyncIterator || prop === Symbol.iterator) {
          return undefined
        }
        // Any other property — including unknown PostgREST builder methods —
        // returns a callable that yields the same chainable builder.
        return (..._args: unknown[]) => buildDisabledQueryBuilder()
      },
    }) as DisabledQueryBuilder
  }

  const buildDisabledStorageBucket = (): DisabledStorageBucket => ({
    upload: async () => ({ data: null, error: authError }),
    download: async () => ({ data: null, error: authError }),
    remove: async () => ({ data: null, error: authError }),
    list: async () => ({ data: null, error: authError }),
    getPublicUrl: () => ({ data: { publicUrl: '' } }),
    createSignedUrl: async () => ({ data: null, error: authError }),
  })

  const disabled: DisabledSupabaseClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: authError }),
      getSession: async () => ({ data: { session: null }, error: authError }),
      signOut: async () => ({ error: null }),
    },
    from: () => buildDisabledQueryBuilder(),
    rpc: () => buildDisabledQueryBuilder(),
    storage: {
      from: () => buildDisabledStorageBucket(),
    },
  }

  return disabled as unknown as SupabaseClient<Database>
}

export function createServerClientWithCookies(
  cookieStore: SupabaseCookieStore
): SupabaseClient<Database> {
  if (!SUPABASE_CONFIG.isConfigured()) {
    return createDisabledClient(`Supabase is not configured. ${SUPABASE_CONFIG.setupHint}`)
  }

  return createSupabaseServerClient<Database>(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach({ name, value: Record<string, unknown>, options } => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component. Ignore if middleware refreshes sessions.
        }
      },
    },
  })
}

export async function createServerClient(: Promise<SupabaseClient<Database>>) {
  return createServerClientWithCookies(await cookies())
}

export function createServerClientWithCustomCookies(
  getAll: () => ReturnType<SupabaseCookieStore['getAll']>,
  setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => void
): SupabaseClient<Database> {
  return createSupabaseServerClient<Database>(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    cookies: {
      getAll,
      setAll,
    },
  })
}

export async function createServiceClient(: Promise<SupabaseClient<Database>>) {
  if (!SUPABASE_CONFIG.url || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      `Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.`
    )
  }

  return createSupabaseServerClient<Database>(SUPABASE_CONFIG.url, SUPABASE_SERVICE_ROLE_KEY, {
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
