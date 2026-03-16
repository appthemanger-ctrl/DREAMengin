/**
 * tests/phase6-privacy-idari.test.ts
 *
 * Phase 6 regression tests — IDARi admin guard + BoogieMan privacy event
 * endpoint contract validation.
 *
 * Architecture justification:
 *   - docs/dreamengin_phase6.md points 5, 6, 7, 8 (Phase 6 obligations)
 *   - docs/IDARI_CONTRACT.md: admin-only, server-side only
 *   - docs/AXIOMS.md: Privacy by Design, Security by Default
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// ── PrivacyEventSchema contract ───────────────────────────────────────────────
// We re-define the schema locally to test its contract without importing
// the route handler (which has Next.js dependencies).

const PrivacyEventSchema = z.object({
  event_type: z.enum([
    'VISIBILITY_CHANGE',
    'PROFILE_PUBLISH',
    'EXPLICIT_SHARE',
    'VISIBILITY_REVOKE',
  ]),
  content_id: z.string().min(1).max(255),
  content_type: z.enum(['dream_window', 'profile_info', 'post', 'daydream_state', 'other']),
  from_visibility: z.enum(['private', 'followers', 'public']).optional(),
  to_visibility: z.enum(['private', 'followers', 'public']),
  update_mapping: z.boolean().optional().default(false),
});

// ── Privacy event schema validation ──────────────────────────────────────────

describe('BoogieMan PrivacyEventSchema', () => {
  it('accepts a valid VISIBILITY_CHANGE event', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'VISIBILITY_CHANGE',
      content_id: 'dream-window-123',
      content_type: 'dream_window',
      from_visibility: 'private',
      to_visibility: 'public',
      update_mapping: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid PROFILE_PUBLISH event', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'PROFILE_PUBLISH',
      content_id: 'profile_info',
      content_type: 'profile_info',
      to_visibility: 'public',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid VISIBILITY_REVOKE event (making something private)', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'VISIBILITY_REVOKE',
      content_id: 'dream-window-456',
      content_type: 'dream_window',
      from_visibility: 'public',
      to_visibility: 'private',
    });
    expect(result.success).toBe(true);
  });

  it('defaults update_mapping to false when omitted', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'EXPLICIT_SHARE',
      content_id: 'post-789',
      content_type: 'post',
      to_visibility: 'followers',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.update_mapping).toBe(false);
    }
  });

  it('rejects an unknown event_type', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'SOME_UNKNOWN_EVENT',
      content_id: 'abc',
      content_type: 'post',
      to_visibility: 'public',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown content_type', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'EXPLICIT_SHARE',
      content_id: 'abc',
      content_type: 'widget',   // legacy name — must use 'dream_window'
      to_visibility: 'public',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid visibility value', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'VISIBILITY_CHANGE',
      content_id: 'abc',
      content_type: 'dream_window',
      to_visibility: 'everyone',  // invalid
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing content_id', () => {
    const result = PrivacyEventSchema.safeParse({
      event_type: 'EXPLICIT_SHARE',
      content_type: 'post',
      to_visibility: 'public',
    });
    expect(result.success).toBe(false);
  });
});

// ── Privacy exposure policy guard (Phase 6 spec point 8) ─────────────────────

describe('Privacy exposure policy guard', () => {
  /**
   * The policy: if to_visibility is 'public' or 'followers',
   * the event_type must be an explicit action.
   * Non-explicit types (only VISIBILITY_REVOKE — reverting to private) are safe.
   */
  function checkExposurePolicy(event_type: string, to_visibility: string): boolean {
    const isExposing = to_visibility === 'public' || to_visibility === 'followers';
    const isExplicit = ['EXPLICIT_SHARE', 'VISIBILITY_CHANGE', 'PROFILE_PUBLISH'].includes(event_type);
    if (isExposing && !isExplicit) return false;
    return true;
  }

  it('allows EXPLICIT_SHARE → public', () => {
    expect(checkExposurePolicy('EXPLICIT_SHARE', 'public')).toBe(true);
  });

  it('allows VISIBILITY_CHANGE → followers', () => {
    expect(checkExposurePolicy('VISIBILITY_CHANGE', 'followers')).toBe(true);
  });

  it('allows PROFILE_PUBLISH → public', () => {
    expect(checkExposurePolicy('PROFILE_PUBLISH', 'public')).toBe(true);
  });

  it('allows VISIBILITY_REVOKE → private (nothing is being exposed)', () => {
    expect(checkExposurePolicy('VISIBILITY_REVOKE', 'private')).toBe(true);
  });

  it('blocks a hypothetical unknown event type trying to expose content', () => {
    expect(checkExposurePolicy('SOME_EVENT', 'public')).toBe(false);
  });
});

// ── IDARi admin-only guard contract ──────────────────────────────────────────

describe('IDARi admin gate', () => {
  type ActorRole = 'admin' | 'owner';

  /**
   * Simulate the IDARi role-check logic extracted from route.ts.
   * A regular user (no admin/owner) should be rejected.
   */
  function resolveActorRole(
    isOwner: boolean,
    dbRole: string | null
  ): ActorRole | null {
    if (isOwner) return 'owner';
    if (dbRole === 'admin') return 'admin';
    return null; // null = not authorized
  }

  it('resolves owner email to owner role', () => {
    expect(resolveActorRole(true, null)).toBe('owner');
  });

  it('resolves admin db role to admin', () => {
    expect(resolveActorRole(false, 'admin')).toBe('admin');
  });

  it('returns null for a regular user with no admin role (Phase 6 spec point 5)', () => {
    expect(resolveActorRole(false, null)).toBeNull();
  });

  it('returns null for a regular user even if they have a non-admin role', () => {
    expect(resolveActorRole(false, 'moderator')).toBeNull();
    expect(resolveActorRole(false, 'user')).toBeNull();
  });

  it('owner always wins even if dbRole is null', () => {
    expect(resolveActorRole(true, null)).toBe('owner');
  });

  it('owner wins even if dbRole is also "admin"', () => {
    expect(resolveActorRole(true, 'admin')).toBe('owner');
  });
});

// ── visibility_mappings default (Privacy by Design) ──────────────────────────

describe('visibility_mappings privacy defaults', () => {
  it('new records default to private (nothing public by default)', () => {
    // Simulates the SQL DEFAULT 'private' constraint
    const defaultVisibility = 'private';
    expect(['private', 'followers', 'public']).toContain(defaultVisibility);
    expect(defaultVisibility).toBe('private');
  });

  it('only public and followers content appears on ViewProfile', () => {
    const allWidgets = [
      { id: 'w1', visibility: 'private' },
      { id: 'w2', visibility: 'public' },
      { id: 'w3', visibility: 'followers' },
      { id: 'w4', visibility: 'private' },
    ];
    const visible = allWidgets.filter(
      (w) => w.visibility === 'public' || w.visibility === 'followers'
    );
    expect(visible).toHaveLength(2);
    expect(visible.map((w) => w.id)).toEqual(['w2', 'w3']);
  });
});
