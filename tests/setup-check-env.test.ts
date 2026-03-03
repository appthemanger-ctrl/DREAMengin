import { afterEach, describe, expect, it } from 'vitest';

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe('GET /api/setup/check', () => {
  it('accepts namespaced NEXT_PUBLIC Supabase vars', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_dreamengin_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

    const { GET } = await import('@/app/api/setup/check/route');
    const response = await GET();
    const payload = await response.json();

    expect(payload.ok).toBe(true);
    expect(payload.checks[0].ok).toBe(true);
    expect(payload.checks[1].ok).toBe(true);
  });

  it('returns updated key guidance when public vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_dreamengin_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY;

    const { GET } = await import('@/app/api/setup/check/route');
    const response = await GET();
    const payload = await response.json();

    expect(payload.ok).toBe(false);
    expect(payload.checks[0].key).toContain('NEXT_PUBLIC_dreamengin_SUPABASE_URL');
    expect(payload.checks[1].hint).toContain('NEXT_PUBLIC_dreamengin');
  });
});
