/**
 * tests/rate-limiting.test.ts
 *
 * Tests for post creation rate limiting (spec §4):
 *   - Public posts: max 10 per 5-minute window.
 *   - Close-friends posts: max 50 per 5-minute window.
 */

import { describe, expect, it } from 'vitest';

// ── Pure rate-limit logic (extracted for testability) ──────────────────────────

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns whether a new post should be blocked by the rate limiter.
 *
 * @param recentCount  — number of posts by this user in the last 5 minutes
 * @param postVisibility — 'public' or 'close_friends'
 */
function isRateLimited(
  recentCount: number,
  postVisibility: 'public' | 'close_friends',
): boolean {
  const limit = postVisibility === 'close_friends' ? 50 : 10;
  return recentCount >= limit;
}

/**
 * Computes the window start timestamp (ISO string) for a rate-limit query.
 */
function windowStart(now = Date.now()): string {
  return new Date(now - WINDOW_MS).toISOString();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Rate limiting: public posts (10 per 5 min)', () => {
  it('allows posting when under the limit', () => {
    expect(isRateLimited(0,  'public')).toBe(false);
    expect(isRateLimited(5,  'public')).toBe(false);
    expect(isRateLimited(9,  'public')).toBe(false);
  });

  it('blocks when exactly at the limit (10)', () => {
    expect(isRateLimited(10, 'public')).toBe(true);
  });

  it('blocks when over the limit', () => {
    expect(isRateLimited(15, 'public')).toBe(true);
    expect(isRateLimited(99, 'public')).toBe(true);
  });
});

describe('Rate limiting: close-friends posts (50 per 5 min)', () => {
  it('allows posting when under the limit', () => {
    expect(isRateLimited(0,  'close_friends')).toBe(false);
    expect(isRateLimited(10, 'close_friends')).toBe(false);
    expect(isRateLimited(49, 'close_friends')).toBe(false);
  });

  it('blocks when exactly at the limit (50)', () => {
    expect(isRateLimited(50, 'close_friends')).toBe(true);
  });

  it('blocks when over the limit', () => {
    expect(isRateLimited(51, 'close_friends')).toBe(true);
  });
});

describe('Window start calculation', () => {
  it('returns a timestamp exactly 5 minutes in the past', () => {
    const now = 1_700_000_000_000;
    const start = new Date(windowStart(now)).getTime();
    expect(now - start).toBe(WINDOW_MS);
  });

  it('returns an ISO 8601 string', () => {
    const start = windowStart();
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
