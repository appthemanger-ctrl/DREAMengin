import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SETUP_HINT } from './env'

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const errorMsg = `Supabase is not configured. ${SETUP_HINT}`
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
