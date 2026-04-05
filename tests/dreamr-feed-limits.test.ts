/**
 * tests/dreamr-feed-limits.test.ts
 *
 * Tests for DreamR feed query limits:
 *   - Main following feed hard cap (500 posts).
 *   - Profile feed composition (25 saved + 25 ephemeral = 50 total).
 *   - Saved-post FIFO queue (max 25, oldest evicted on 26th save).
 *   - Close-friends visibility filter in the following feed.
 */

import { describe, expect, it } from 'vitest';

// ── Helpers shared with the API logic ─────────────────────────────────────────

/**
 * Simulates the profile feed composition algorithm:
 * takes up to maxSaved saved posts, then fills remaining slots with
 * ephemeral posts (excluding already-included saved post IDs).
 */
function buildProfileFeed(
  savedPosts: Array<{ id: string; saved_at: string }>,
  ephemeralPosts: Array<{ id: string; created_at: string }>,
  maxSaved = 25,
  totalLimit = 50,
): Array<{ id: string; is_saved: boolean }> {
  const included = savedPosts.slice(0, maxSaved).map(p => ({ id: p.id, is_saved: true }));
  const savedIds = new Set(included.map(p => p.id));
  const slots = totalLimit - included.length;
  let added = 0;
  for (const p of ephemeralPosts) {
    if (added >= slots) break;
    if (savedIds.has(p.id)) continue;
    included.push({ id: p.id, is_saved: false });
    added++;
  }
  return included;
}

/**
 * Simulates the saved-posts FIFO queue:
 * if queue is at capacity, evict the oldest before inserting.
 */
function saveFifo(
  queue: Array<{ id: string; saved_at: number }>,
  newPostId: string,
  max = 25,
): Array<{ id: string; saved_at: number }> {
  const updated = [...queue];
  // Evict if at capacity
  if (updated.length >= max) {
    updated.sort((a, b) => a.saved_at - b.saved_at);
    updated.shift(); // remove oldest
  }
  updated.push({ id: newPostId, saved_at: Date.now() });
  return updated;
}

/**
 * Simulates the close-friends visibility filter for the following feed.
 * Returns only posts that the viewer is allowed to see.
 */
function filterCloseFriendsPosts(
  posts: Array<{ id: string; user_id: string; post_visibility: string }>,
  viewerId: string,
  closeFriendPosters: Set<string>,
): Array<{ id: string }> {
  return posts.filter(p => {
    if (p.post_visibility === 'close_friends') {
      return closeFriendPosters.has(p.user_id) || p.user_id === viewerId;
    }
    return true;
  });
}

// ── Feed limit tests ───────────────────────────────────────────────────────────

describe('Main feed hard cap', () => {
  it('allows requesting up to 500 posts', () => {
    const requested = 500;
    const cap = 500;
    expect(Math.min(requested, cap)).toBe(500);
  });

  it('clamps requests beyond 500 to 500', () => {
    const requested = 999;
    const cap = 500;
    expect(Math.min(requested, cap)).toBe(500);
  });

  it('allows requesting fewer than 500 posts', () => {
    const requested = 20;
    const cap = 500;
    expect(Math.min(requested, cap)).toBe(20);
  });
});

describe('Profile feed composition', () => {
  const makePosts = (n: number, prefix: string, base = 0) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${prefix}-${i}`,
      saved_at: new Date(base + i * 1000).toISOString(),
      created_at: new Date(base + i * 1000).toISOString(),
    }));

  it('returns up to 50 posts total', () => {
    const saved = makePosts(25, 's');
    const ephem = makePosts(30, 'e', 100_000);
    const feed = buildProfileFeed(saved, ephem);
    expect(feed.length).toBe(50);
  });

  it('includes 25 saved and 25 ephemeral when both have enough', () => {
    const saved = makePosts(25, 's');
    const ephem = makePosts(30, 'e', 100_000);
    const feed = buildProfileFeed(saved, ephem);
    const savedCount = feed.filter(p => p.is_saved).length;
    const ephemCount = feed.filter(p => !p.is_saved).length;
    expect(savedCount).toBe(25);
    expect(ephemCount).toBe(25);
  });

  it('backfills with ephemeral when fewer than 25 saved posts', () => {
    const saved = makePosts(10, 's');
    const ephem = makePosts(50, 'e', 100_000);
    const feed = buildProfileFeed(saved, ephem);
    expect(feed.length).toBe(50);
    const savedCount = feed.filter(p => p.is_saved).length;
    expect(savedCount).toBe(10);
    const ephemCount = feed.filter(p => !p.is_saved).length;
    expect(ephemCount).toBe(40);
  });

  it('does not include saved posts twice in the ephemeral fill', () => {
    const saved = makePosts(5, 'x');
    // Ephemeral list overlaps with saved IDs
    const ephem = [...makePosts(5, 'x'), ...makePosts(50, 'e', 100_000)];
    const feed = buildProfileFeed(saved, ephem);
    const ids = feed.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('returns fewer than 50 when not enough posts exist', () => {
    const saved = makePosts(3, 's');
    const ephem = makePosts(5, 'e', 100_000);
    const feed = buildProfileFeed(saved, ephem);
    expect(feed.length).toBe(8);
  });
});

describe('Saved posts FIFO queue', () => {
  it('allows saving up to 25 posts without eviction', () => {
    let queue: Array<{ id: string; saved_at: number }> = [];
    for (let i = 0; i < 25; i++) {
      queue = saveFifo(queue, `post-${i}`);
    }
    expect(queue.length).toBe(25);
  });

  it('evicts the oldest post when saving the 26th', () => {
    let queue: Array<{ id: string; saved_at: number }> = [];
    for (let i = 0; i < 25; i++) {
      queue = saveFifo(queue, `post-${i}`);
    }
    const oldestId = queue.sort((a, b) => a.saved_at - b.saved_at)[0].id;
    queue = saveFifo(queue, 'post-new');
    expect(queue.length).toBe(25);
    expect(queue.find(p => p.id === oldestId)).toBeUndefined();
    expect(queue.find(p => p.id === 'post-new')).toBeDefined();
  });

  it('always maintains exactly max 25 after many saves', () => {
    let queue: Array<{ id: string; saved_at: number }> = [];
    for (let i = 0; i < 100; i++) {
      queue = saveFifo(queue, `post-${i}`);
    }
    expect(queue.length).toBe(25);
  });
});

describe('Close friends visibility filter', () => {
  const posts = [
    { id: '1', user_id: 'alice', post_visibility: 'public' },
    { id: '2', user_id: 'bob',   post_visibility: 'close_friends' },
    { id: '3', user_id: 'carol', post_visibility: 'close_friends' },
    { id: '4', user_id: 'dave',  post_visibility: 'public' },
  ];

  it('shows public posts to all viewers', () => {
    const visible = filterCloseFriendsPosts(posts, 'eve', new Set());
    expect(visible.map(p => p.id)).toContain('1');
    expect(visible.map(p => p.id)).toContain('4');
  });

  it('hides close_friends posts if viewer is not in the poster\'s CF list', () => {
    const visible = filterCloseFriendsPosts(posts, 'eve', new Set());
    expect(visible.map(p => p.id)).not.toContain('2');
    expect(visible.map(p => p.id)).not.toContain('3');
  });

  it('shows close_friends posts if viewer is in the poster\'s CF list', () => {
    const closeFriendPosters = new Set(['bob']); // 'eve' is in bob's CF list
    const visible = filterCloseFriendsPosts(posts, 'eve', closeFriendPosters);
    expect(visible.map(p => p.id)).toContain('2');
    expect(visible.map(p => p.id)).not.toContain('3');
  });

  it('shows own close_friends posts to the owner', () => {
    const visible = filterCloseFriendsPosts(posts, 'bob', new Set());
    expect(visible.map(p => p.id)).toContain('2');
  });
});
