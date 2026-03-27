import {
  createServerClient,
  createServerClientWithCookies,
  type SupabaseCookieStore,
} from '@/lib/supabase/server'

export function createClient(cookieStore: SupabaseCookieStore): ReturnType<typeof createServerClientWithCookies>
export function createClient(): ReturnType<typeof createServerClient>
export function createClient(cookieStore?: SupabaseCookieStore) {
  return cookieStore ? createServerClientWithCookies(cookieStore) : createServerClient()
}
