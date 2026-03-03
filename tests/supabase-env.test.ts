/**
 * tests/supabase-env.test.ts
 *
 * Unit tests for lib/env/supabase.ts — the env-var fallback resolver.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// getSupabasePublicEnv
// ---------------------------------------------------------------------------

describe('getSupabasePublicEnv', () => {
  it('throws when both public vars are absent', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabasePublicEnv } = await import('@/lib/env/supabase');
    expect(() => getSupabasePublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('throws when only URL is set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabasePublicEnv } = await import('@/lib/env/supabase');
    expect(() => getSupabasePublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('throws when only ANON_KEY is set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    const { getSupabasePublicEnv } = await import('@/lib/env/supabase');
    expect(() => getSupabasePublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('returns url and anonKey when both are set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    const { getSupabasePublicEnv } = await import('@/lib/env/supabase');
    expect(getSupabasePublicEnv()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
  });
});

// ---------------------------------------------------------------------------
// getSupabaseServiceRoleKey
// ---------------------------------------------------------------------------

describe('getSupabaseServiceRoleKey', () => {
  it('throws when neither canonical nor namespaced key is set', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.dreamengin_SUPABASE_SERVICE_ROLE_KEY;
    const { getSupabaseServiceRoleKey } = await import('@/lib/env/supabase');
    expect(() => getSupabaseServiceRoleKey()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('returns canonical key when set', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'canonical-service-key';
    delete process.env.dreamengin_SUPABASE_SERVICE_ROLE_KEY;
    const { getSupabaseServiceRoleKey } = await import('@/lib/env/supabase');
    expect(getSupabaseServiceRoleKey()).toBe('canonical-service-key');
  });

  it('falls back to namespaced key when canonical is absent', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.dreamengin_SUPABASE_SERVICE_ROLE_KEY = 'namespaced-service-key';
    const { getSupabaseServiceRoleKey } = await import('@/lib/env/supabase');
    expect(getSupabaseServiceRoleKey()).toBe('namespaced-service-key');
  });

  it('prefers canonical key over namespaced key', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'canonical-service-key';
    process.env.dreamengin_SUPABASE_SERVICE_ROLE_KEY = 'namespaced-service-key';
    const { getSupabaseServiceRoleKey } = await import('@/lib/env/supabase');
    expect(getSupabaseServiceRoleKey()).toBe('canonical-service-key');
  });
});

// ---------------------------------------------------------------------------
// getPostgresUrl
// ---------------------------------------------------------------------------

describe('getPostgresUrl', () => {
  it('throws when neither canonical nor namespaced URL is set', async () => {
    delete process.env.POSTGRES_URL;
    delete process.env.dreamengin_POSTGRES_URL;
    const { getPostgresUrl } = await import('@/lib/env/supabase');
    expect(() => getPostgresUrl()).toThrow(/POSTGRES_URL/);
  });

  it('returns canonical URL when set', async () => {
    process.env.POSTGRES_URL = 'postgres://canonical';
    delete process.env.dreamengin_POSTGRES_URL;
    const { getPostgresUrl } = await import('@/lib/env/supabase');
    expect(getPostgresUrl()).toBe('postgres://canonical');
  });

  it('falls back to namespaced URL when canonical is absent', async () => {
    delete process.env.POSTGRES_URL;
    process.env.dreamengin_POSTGRES_URL = 'postgres://namespaced';
    const { getPostgresUrl } = await import('@/lib/env/supabase');
    expect(getPostgresUrl()).toBe('postgres://namespaced');
  });

  it('prefers canonical URL over namespaced URL', async () => {
    process.env.POSTGRES_URL = 'postgres://canonical';
    process.env.dreamengin_POSTGRES_URL = 'postgres://namespaced';
    const { getPostgresUrl } = await import('@/lib/env/supabase');
    expect(getPostgresUrl()).toBe('postgres://canonical');
  });
});
