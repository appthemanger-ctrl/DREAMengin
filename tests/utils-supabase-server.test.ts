import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseServerMocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  createServerClientWithCookies: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => supabaseServerMocks)

import { createClient } from '@/utils/supabase/server'

describe('utils/supabase/server createClient', () => {
  beforeEach(() => {
    supabaseServerMocks.createServerClient.mockReset()
    supabaseServerMocks.createServerClientWithCookies.mockReset()
  })

  it('delegates to the async server client when no cookie store is provided', () => {
    const asyncClient = Promise.resolve({ from: vi.fn() })
    supabaseServerMocks.createServerClient.mockReturnValueOnce(asyncClient)

    expect(createClient()).toBe(asyncClient)
    expect(supabaseServerMocks.createServerClient).toHaveBeenCalledTimes(1)
    expect(supabaseServerMocks.createServerClientWithCookies).not.toHaveBeenCalled()
  })

  it('delegates to the cookie-store helper when a cookie store is provided', () => {
    const cookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    }
    const syncClient = { from: vi.fn() }
    supabaseServerMocks.createServerClientWithCookies.mockReturnValueOnce(syncClient)

    expect(createClient(cookieStore)).toBe(syncClient)
    expect(supabaseServerMocks.createServerClientWithCookies).toHaveBeenCalledWith(cookieStore)
  })
})
