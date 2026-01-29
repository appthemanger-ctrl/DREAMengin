import { createBrowserClient } from '@supabase/ssr'

function requirePublicEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required public environment variable: ${name}`)
  }
  return v
}

export function createClient() {
  return createBrowserClient(
    requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requirePublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}