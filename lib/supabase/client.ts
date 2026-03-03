import { createBrowserClient } from '@supabase/ssr'

// Gracefully handle missing env vars - won't crash at build time
// but will throw clear errors at runtime if actually used without config
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_dreamengin_SUPABASE_URL ||
  ''
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY ||
  ''

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Return a proxy that throws only when methods are actually called
    // This prevents build-time crashes while still giving clear runtime errors
    const errorMsg = 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_dreamengin_SUPABASE_URL) and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY).'
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'auth') {
          return new Proxy({}, {
            get() {
              return () => Promise.reject(new Error(errorMsg))
            }
          })
        }
        if (typeof prop === 'string') {
          return () => ({ data: null, error: new Error(errorMsg) })
        }
        return undefined
      }
    }
    return new Proxy({}, handler) as ReturnType<typeof createBrowserClient>
  }
  
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
