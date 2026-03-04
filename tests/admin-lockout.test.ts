/**
 * tests/admin-lockout.test.ts
 *
 * Unit tests for the pure, synchronous utility functions exported from
 * lib/admin/lockout.ts — isOwner() and isDomainBlocked().
 *
 * The async Supabase-backed isAdminLocked() / triggerAdminLockout()
 * functions require a live service-role client and are covered by
 * integration / e2e tests.
 */

import { describe, it, expect, vi } from 'vitest';

// lib/supabase/server.ts carries `import 'server-only'` which throws
// outside the Next.js server runtime.  Mock both to keep tests in the
// plain Node.js vitest environment.
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
  createServerClient: vi.fn(),
}));
import { isOwner, isDomainBlocked, OWNER_EMAIL } from '@/lib/admin/lockout';

// ── isOwner ───────────────────────────────────────────────────────────────────

describe('isOwner', () => {
  it('returns true for the exact owner email', () => {
    expect(isOwner('Appthemanger@gmail.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isOwner('appthemanger@gmail.com')).toBe(true);
    expect(isOwner('APPTHEMANGER@GMAIL.COM')).toBe(true);
    expect(isOwner('AppThemanger@Gmail.Com')).toBe(true);
  });

  it('returns false for a different email', () => {
    expect(isOwner('other@gmail.com')).toBe(false);
    expect(isOwner('theboogieman@boogieman.ai')).toBe(false);
  });

  it('returns false for null / undefined / empty string', () => {
    expect(isOwner(null)).toBe(false);
    expect(isOwner(undefined)).toBe(false);
    expect(isOwner('')).toBe(false);
  });

  it('OWNER_EMAIL constant matches expected address (normalized)', () => {
    expect(OWNER_EMAIL.toLowerCase()).toBe('appthemanger@gmail.com');
  });
});

// ── isDomainBlocked ───────────────────────────────────────────────────────────
// NOTE: theboogieman.ai is blocked at the edge via the Host-header check in
// middleware.ts, NOT via BLOCKED_DOMAINS in lockout.ts (which the owner
// intentionally left empty so they can reach this API from their BoogieMan AI
// app without being blocked by Origin/Referer checks).
// These tests cover the lockout.ts utility function specifically.

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://dreamengin.vercel.app/api/admin/code-files', {
    method: 'POST',
    headers,
  });
}

describe('isDomainBlocked', () => {
  it('returns false when BLOCKED_DOMAINS is empty (the list is intentionally empty — domain banning is handled by middleware Host check)', () => {
    const req = makeRequest({ origin: 'https://theboogieman.ai' });
    expect(isDomainBlocked(req)).toBe(false);
  });

  it('returns false for a normal origin', () => {
    const req = makeRequest({ origin: 'https://dreamengin.vercel.app' });
    expect(isDomainBlocked(req)).toBe(false);
  });

  it('returns false when no origin/referer/host headers are present', () => {
    const req = makeRequest({});
    expect(isDomainBlocked(req)).toBe(false);
  });
});
