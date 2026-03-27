import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

async function importSupabaseEnv(env: NodeJS.ProcessEnv) {
  vi.resetModules()
  process.env = env
  return import('@/lib/supabase/env')
}

describe('lib/supabase/env', () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.resetModules()
  })

  it('accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as a publishable key alias', async () => {
    const env = await importSupabaseEnv({
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: 'https://jnpkzaneznwnomhmvxxs.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: 'publishable-default-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY: '',
      dreamengin_SUPABASE_ANON_KEY: '',
      dreamengin_SUPABASE_PUBLISHABLE_KEY: '',
    })

    expect(env.SUPABASE_URL).toBe('https://jnpkzaneznwnomhmvxxs.supabase.co')
    expect(env.SUPABASE_ANON_KEY).toBe('publishable-default-key')
    expect(env.isSupabaseConfigured()).toBe(true)
  })
})
