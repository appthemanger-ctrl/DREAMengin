/**
 * tests/dev-bypass.test.ts
 *
 * Unit tests for the dev-auth-bypass helpers in lib/dev-bypass.ts (req #31–33).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to control process.env values per test.
const originalEnv = { ...process.env };

afterEach(() => {
  // Restore original env after each test.
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  vi.resetModules();
});

describe('isDevBypassActive', () => {
  it('returns false when env var is absent', async () => {
    delete process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
    const { isDevBypassActive } = await import('@/lib/dev-bypass');
    expect(isDevBypassActive()).toBe(false);
  });

  it('returns false when env var is "false"', async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = 'false';
    const { isDevBypassActive } = await import('@/lib/dev-bypass');
    expect(isDevBypassActive()).toBe(false);
  });

  it('returns true only when env var is exactly "true"', async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = 'true';
    const { isDevBypassActive } = await import('@/lib/dev-bypass');
    expect(isDevBypassActive()).toBe(true);
  });
});

describe('isDevAdminBypassActive', () => {
  it('returns false when both env vars are absent', async () => {
    delete process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
    delete process.env.DEV_ADMIN;
    const { isDevAdminBypassActive } = await import('@/lib/dev-bypass');
    expect(isDevAdminBypassActive()).toBe(false);
  });

  it('returns false when only DEV_ADMIN is set (req #32)', async () => {
    delete process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
    process.env.DEV_ADMIN = 'true';
    const { isDevAdminBypassActive } = await import('@/lib/dev-bypass');
    expect(isDevAdminBypassActive()).toBe(false);
  });

  it('returns false when only NEXT_PUBLIC_DEV_BYPASS_AUTH is set', async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = 'true';
    delete process.env.DEV_ADMIN;
    const { isDevAdminBypassActive } = await import('@/lib/dev-bypass');
    expect(isDevAdminBypassActive()).toBe(false);
  });

  it('returns true only when BOTH env vars are "true" (req #32)', async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = 'true';
    process.env.DEV_ADMIN = 'true';
    const { isDevAdminBypassActive } = await import('@/lib/dev-bypass');
    expect(isDevAdminBypassActive()).toBe(true);
  });
});
