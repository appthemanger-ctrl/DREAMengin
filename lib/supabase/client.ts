import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_CONFIG } from './config'

export function createClient() {
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    const errorMsg = `Supabase is not configured. ${SUPABASE_CONFIG.setupHint}`
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

  return createBrowserClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
}
