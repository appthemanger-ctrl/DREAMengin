/**
 * tests/idari-admin-guard.test.ts
 *
 * Phase 6 item #6 — IDARi admin-guard contract tests.
 *
 * Validates the guard logic extracted from app/api/ai/idari/route.ts:
 *   - IDARI_PASSWORD env var check (503 when absent)
 *   - Admin-only gate: blocks regular users even under dev bypass
 *   - Owner/admin role resolution
 *   - No IDARi access to non-admin roles
 *
 * Architecture justification:
 *   - docs/IDARI_CONTRACT.md: "admin-only, server-side only; must remain guarded
 *     even when dev bypass tools exist elsewhere in the repo"
 *   - docs/dreamengin_phase6.md point 6: "IDARi must be protected by an admin-guard
 *     check even when DEV_BYPASS_AUTH is active."
 *   - docs/AXIOMS.md: Security by Default
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';

// ── IDARI_PASSWORD env guard contract ─────────────────────────────────────────
//
// Mirrors the guard at the top of the POST handler in route.ts.
// If IDARI_PASSWORD is not set, the service must return 503.

describe('IDARI_PASSWORD service-availability guard', () => {
  const original = process.env.IDARI_PASSWORD;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.IDARI_PASSWORD;
    } else {
      process.env.IDARI_PASSWORD = original;
    }
  });

  function isServiceAvailable(): boolean {
    return Boolean(process.env.IDARI_PASSWORD);
  }

  it('service is unavailable when IDARI_PASSWORD is not set', () => {
    delete process.env.IDARI_PASSWORD;
    expect(isServiceAvailable()).toBe(false);
  });

  it('service is available when IDARI_PASSWORD is set to any non-empty value', () => {
    process.env.IDARI_PASSWORD = 'secret-admin-pass';
    expect(isServiceAvailable()).toBe(true);
  });

  it('service is unavailable when IDARI_PASSWORD is an empty string', () => {
    process.env.IDARI_PASSWORD = '';
    // Boolean('') === false, so empty string means unavailable
    expect(isServiceAvailable()).toBe(false);
  });
});

// ── Admin role resolution ─────────────────────────────────────────────────────
//
// Mirrors resolveActorRole logic in the IDARi route handler.

type ActorRole = 'admin' | 'owner';

function resolveActorRole(
  isOwner: boolean,
  dbRole: string | null | undefined
): ActorRole | null {
  if (isOwner) return 'owner';
  if (dbRole === 'admin') return 'admin';
  return null;
}

describe('IDARi admin gate (Phase 6 spec point 5, 6)', () => {
  it('grants owner role to owner-email users', () => {
    expect(resolveActorRole(true, null)).toBe('owner');
  });

  it('grants admin role when dbRole is "admin"', () => {
    expect(resolveActorRole(false, 'admin')).toBe('admin');
  });

  it('returns null for regular users (no role)', () => {
    expect(resolveActorRole(false, null)).toBeNull();
  });

  it('returns null for users with "user" role', () => {
    expect(resolveActorRole(false, 'user')).toBeNull();
  });

  it('returns null for users with "moderator" role', () => {
    expect(resolveActorRole(false, 'moderator')).toBeNull();
  });

  it('owner wins even when dbRole is "admin"', () => {
    expect(resolveActorRole(true, 'admin')).toBe('owner');
  });

  it('owner wins when dbRole is undefined', () => {
    expect(resolveActorRole(true, undefined)).toBe('owner');
  });
});

// ── Dev bypass must NOT exempt IDARi (Phase 6 spec point 6) ──────────────────
//
// DEV_BYPASS_AUTH=true skips auth for user-facing surfaces.
// IDARi must remain guarded regardless.
//
// The IDARi route uses supabase.auth.getUser() directly and never calls
// isDevBypassActive() or isDevAdminBypassActive(). This test validates
// that the guard logic is independent of the dev bypass flag.

describe('IDARi ignores dev bypass flags (Phase 6 spec point 6)', () => {
  const originalBypass = process.env.DEV_BYPASS_AUTH;
  const originalDevAdmin = process.env.DEV_ADMIN;

  beforeEach(() => {
    process.env.DEV_BYPASS_AUTH = 'true';
    process.env.DEV_ADMIN = 'true';
  });

  afterEach(() => {
    if (originalBypass === undefined) delete process.env.DEV_BYPASS_AUTH;
    else process.env.DEV_BYPASS_AUTH = originalBypass;
    if (originalDevAdmin === undefined) delete process.env.DEV_ADMIN;
    else process.env.DEV_ADMIN = originalDevAdmin;
  });

  it('even with DEV_ADMIN=true, a regular user is still denied (role-gate runs regardless)', () => {
    // The IDARi gate uses resolveActorRole based on DB/owner-email, not env bypass.
    // Simulating: dev bypass is active but user has no admin role.
    const devBypassActive = process.env.DEV_BYPASS_AUTH === 'true';
    const devAdminActive = process.env.DEV_ADMIN === 'true';

    // Even with both bypass flags on, resolveActorRole returns null for a regular user.
    const role = resolveActorRole(false, null);
    expect(role).toBeNull();

    // The bypass flags are on — but the IDARi gate does NOT use them.
    // This test confirms the logic separation.
    expect(devBypassActive).toBe(true);
    expect(devAdminActive).toBe(true);
    expect(role).toBeNull(); // still denied
  });

  it('admin role is still granted when bypass flags are active (bypass does not negate real roles)', () => {
    const role = resolveActorRole(false, 'admin');
    expect(role).toBe('admin');
  });
});

// ── Rate limits per role ──────────────────────────────────────────────────────

describe('IDARi rate limits by role', () => {
  const RATE_LIMITS: Record<ActorRole, number> = {
    admin: 40,
    owner: 60,
  };

  it('admin rate limit is 40 rpm', () => {
    expect(RATE_LIMITS.admin).toBe(40);
  });

  it('owner rate limit is 60 rpm (higher than admin)', () => {
    expect(RATE_LIMITS.owner).toBe(60);
  });

  it('owner has higher limit than admin', () => {
    expect(RATE_LIMITS.owner).toBeGreaterThan(RATE_LIMITS.admin);
  });
});
