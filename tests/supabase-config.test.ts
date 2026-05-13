import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

async function importSupabaseConfig(env: NodeJS.ProcessEnv) {
  vi.resetModules()
  process.env = env
  return import('@/lib/supabase/config')
}

describe('lib/supabase/config', () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.resetModules()
  })

  it('falls back to canonical values when env vars are empty', async () => {
    const config = await importSupabaseConfig({
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
    })
    expect(config.SUPABASE_URL).toBe('https://suaiqcynxospjijzdudc.supabase.co')
    expect(config.SUPABASE_PUBLISHABLE_KEY).toBe('sb_publishable_5gYss6NWI2tvE6wDOsb8cw_rjVqrAe6')
  })
})
