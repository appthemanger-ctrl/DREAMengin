/**
 * tests/dreamr-visibility-cursor.test.ts
 *
 * Tests for the two new server-side helpers wired into the DreamR feed
 * routes:
 *
 *   • filterByCloseFriends   — pure visibility filter for the new
 *                              `post_visibility` column
 *   • parseFeedParams        — pagination param parser (limit / offset /
 *                              before / seen) with sane defaults & clamps
 *   • deriveNextCursor       — stable cursor for the next page, anchored
 *                              on the oldest created_at returned
 */

import { describe, it, expect } from 'vitest';
import {
  filterByCloseFriends,
} from '@/lib/dreamr/closeFriendsVisibility';
import {
  parseFeedParams,
  deriveNextCursor,
  MAX_SEEN_IDS,
} from '@/lib/dreamr/feedCursor';

// ── filterByCloseFriends ─────────────────────────────────────────────────────

describe('filterByCloseFriends', () => {
  const posts = [
    { id: 'p1', user_id: 'alice', post_visibility: 'public' },
    { id: 'p2', user_id: 'bob',   post_visibility: 'close_friends' },
    { id: 'p3', user_id: 'carol', post_visibility: 'close_friends' },
    { id: 'p4', user_id: 'dave',  post_visibility: 'public' },
    { id: 'p5', user_id: 'eve',   post_visibility: null },          // null defaults public
    { id: 'p6', user_id: 'eve',   post_visibility: 'close_friends' },
  ];

  it('lets all public posts through to any viewer', () => {
    const out = filterByCloseFriends(posts, 'mallory', new Set());
    const ids = out.map(p => p.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p4');
    expect(ids).toContain('p5');
  });

  it('hides close_friends posts from viewers not in the poster\'s circle', () => {
    const out = filterByCloseFriends(posts, 'mallory', new Set());
    const ids = out.map(p => p.id);
    expect(ids).not.toContain('p2');
    expect(ids).not.toContain('p3');
    expect(ids).not.toContain('p6');
  });

  it('reveals close_friends posts to viewers in the poster\'s circle', () => {
    const out = filterByCloseFriends(posts, 'mallory', new Set(['bob', 'eve']));
    const ids = out.map(p => p.id);
    expect(ids).toContain('p2');
    expect(ids).toContain('p6');
    expect(ids).not.toContain('p3'); // carol didn't add mallory
  });

  it('always shows a viewer their own close_friends posts', () => {
    const out = filterByCloseFriends(posts, 'bob', new Set());
    const ids = out.map(p => p.id);
    expect(ids).toContain('p2'); // bob's own CF post
  });

  it('treats missing post_visibility as public (DB default)', () => {
    const out = filterByCloseFriends(
      [{ id: 'x', user_id: 'someone' }],
      'viewer',
      new Set(),
    );
    expect(out.map(p => p.id)).toContain('x');
  });

  it('treats missing user_id on a CF post as not visible (defensive)', () => {
    const out = filterByCloseFriends(
      [{ id: 'x', user_id: null, post_visibility: 'close_friends' }],
      'viewer',
      new Set(),
    );
    expect(out).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const input = [...posts];
    const ids = input.map(p => p.id);
    filterByCloseFriends(input, 'mallory', new Set());
    expect(input.map(p => p.id)).toEqual(ids);
  });
});

// ── parseFeedParams ──────────────────────────────────────────────────────────

describe('parseFeedParams', () => {
  it('returns sensible defaults for empty input', () => {
    const p = parseFeedParams(new URLSearchParams(''));
    expect(p.limit).toBe(20);
    expect(p.fetchLimit).toBe(60);
    expect(p.before).toBeNull();
    expect(p.offset).toBe(0);
    expect(p.seen.size).toBe(0);
  });

  it('clamps limit to maxLimit (default 40)', () => {
    const p = parseFeedParams(new URLSearchParams('limit=99'));
    expect(p.limit).toBe(40);
    // fetchLimit caps at poolCap (default 120)
    expect(p.fetchLimit).toBeLessThanOrEqual(120);
  });

  it('respects custom limit / maxLimit / poolFactor / poolCap', () => {
    const p = parseFeedParams(
      new URLSearchParams('limit=10'),
      { limit: 5, maxLimit: 50, poolFactor: 4, poolCap: 200 },
    );
    expect(p.limit).toBe(10);
    expect(p.fetchLimit).toBe(40);
  });

  it('parses an ISO `before` cursor', () => {
    const iso = '2026-04-05T12:00:00Z';
    const p = parseFeedParams(new URLSearchParams(`before=${iso}`));
    expect(p.before).toBe(iso);
  });

  it('rejects malformed `before` values (must look like ISO)', () => {
    const p = parseFeedParams(new URLSearchParams('before=tomorrow'));
    expect(p.before).toBeNull();
  });

  it('parses comma-separated seen ids', () => {
    const p = parseFeedParams(new URLSearchParams('seen=a,b,c'));
    expect(p.seen).toEqual(new Set(['a', 'b', 'c']));
  });

  it('caps seen ids at MAX_SEEN_IDS', () => {
    const ids = Array.from({ length: MAX_SEEN_IDS + 50 }, (_, i) => `id${i}`);
    const p = parseFeedParams(new URLSearchParams(`seen=${ids.join(',')}`));
    expect(p.seen.size).toBe(MAX_SEEN_IDS);
  });

  it('clamps negative limit to 1', () => {
    const p = parseFeedParams(new URLSearchParams('limit=-5'));
    expect(p.limit).toBeGreaterThanOrEqual(1);
  });

  it('handles non-numeric offset gracefully', () => {
    const p = parseFeedParams(new URLSearchParams('offset=banana'));
    expect(p.offset).toBe(0);
  });
});

// ── deriveNextCursor ─────────────────────────────────────────────────────────

describe('deriveNextCursor', () => {
  it('returns null when fewer rows than fetchLimit (end of pool)', () => {
    expect(deriveNextCursor([{ created_at: '2026-04-05T00:00:00Z' }], 5, 60)).toBeNull();
  });

  it('returns null when ranked is empty even at full pool', () => {
    expect(deriveNextCursor([], 60, 60)).toBeNull();
  });

  it('returns the oldest created_at when the pool was full', () => {
    const ranked = [
      { created_at: '2026-04-05T12:00:00Z' },
      { created_at: '2026-04-05T08:00:00Z' },
      { created_at: '2026-04-05T10:00:00Z' },
    ];
    expect(deriveNextCursor(ranked, 60, 60)).toBe('2026-04-05T08:00:00Z');
  });

  it('skips entries missing created_at', () => {
    const ranked = [
      { created_at: '2026-04-05T12:00:00Z' },
      { created_at: undefined },
      { created_at: '2026-04-05T09:00:00Z' },
    ];
    expect(deriveNextCursor(ranked, 60, 60)).toBe('2026-04-05T09:00:00Z');
  });
});
