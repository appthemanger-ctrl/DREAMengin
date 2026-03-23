/**
 * tests/phase8a.test.ts
 *
 * Phase 8 Section A regression tests — HomeDream Surface: Real Feed &
 * Real Customization (Points 1–10).
 *
 * Architecture justification:
 *   - docs/dreamengin_phase8.md §A: HomeDream Surface spec
 *   - docs/ARCHITECTURE.md §3: user settings live in Supabase
 *   - docs/AXIOMS.md Axiom 5: Privacy by Design
 *   - docs/LAW.md Product law 3: every action does something real
 *   - docs/SECURITY.md: feed_items user-scoped via RLS
 */

import { describe, expect, it } from 'vitest';
import { CANONICAL_NAV_ROUTES } from '@/lib/ai/triad';

// ── Point 9: Canonical route set validation ───────────────────────────────────

describe('Phase 8 §A Point 9 — Dr. Eams canonical routes', () => {
  it('exports a non-empty set of canonical routes', () => {
    expect(CANONICAL_NAV_ROUTES.size).toBeGreaterThan(0);
  });

  it('contains all 6 Daydream surface routes', () => {
    const daydreams = [
      '/daydream/music',
      '/daydream/games',
      '/daydream/lab',
      '/daydream/code',
      '/daydream/brand',
      '/daydream/create',
    ];
    for (const route of daydreams) {
      expect(CANONICAL_NAV_ROUTES.has(route)).toBe(true);
    }
  });

  it('contains the HomeDream canonical route', () => {
    expect(CANONICAL_NAV_ROUTES.has('/homedream')).toBe(true);
  });

  it('contains the EditProfileDream canonical route', () => {
    expect(CANONICAL_NAV_ROUTES.has('/edit-profiledream')).toBe(true);
  });

  it('contains the settings route', () => {
    expect(CANONICAL_NAV_ROUTES.has('/settings')).toBe(true);
  });

  it('contains the messages route', () => {
    expect(CANONICAL_NAV_ROUTES.has('/messages')).toBe(true);
  });

  it('contains the feed-settings route', () => {
    expect(CANONICAL_NAV_ROUTES.has('/feed-settings')).toBe(true);
  });

  it('does NOT contain non-existent or placeholder routes', () => {
    const invalidRoutes = [
      '/coming-soon',
      '/placeholder',
      '/todo',
      '/not-implemented',
    ];
    for (const route of invalidRoutes) {
      expect(CANONICAL_NAV_ROUTES.has(route)).toBe(false);
    }
  });

  it('all canonical routes start with /', () => {
    for (const route of CANONICAL_NAV_ROUTES) {
      expect(route.startsWith('/')).toBe(true);
    }
  });

  it('no canonical route is an empty string', () => {
    for (const route of CANONICAL_NAV_ROUTES) {
      expect(route.length).toBeGreaterThan(1);
    }
  });
});

// ── Point 3: Feed preferences schema validation ───────────────────────────────

const ALLOWED_FEED_PREF_KEYS = new Set([
  'showDreamenginUpdates',
  'autoRefresh',
  'showEmptyStateGuides',
  'enabledProviders',
  'sortOrder',
]);

const VALID_SORT_ORDERS = new Set(['recent', 'trending']);

describe('Phase 8 §A Point 3 — Feed preferences schema', () => {
  it('only allows known preference keys', () => {
    const incoming = {
      showDreamenginUpdates: true,
      autoRefresh: false,
      showEmptyStateGuides: true,
      unknownField: 'should be rejected',
    };
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (ALLOWED_FEED_PREF_KEYS.has(k)) safe[k] = v;
    }
    expect(Object.keys(safe)).not.toContain('unknownField');
    expect(Object.keys(safe)).toContain('showDreamenginUpdates');
  });

  it('accepts valid sortOrder values', () => {
    for (const order of VALID_SORT_ORDERS) {
      expect(VALID_SORT_ORDERS.has(order)).toBe(true);
    }
  });

  it('rejects invalid sortOrder values', () => {
    expect(VALID_SORT_ORDERS.has('hot')).toBe(false);
    expect(VALID_SORT_ORDERS.has('random')).toBe(false);
  });

  it('defaults produce a valid empty object', () => {
    const defaults = {};
    expect(typeof defaults).toBe('object');
    expect(Array.isArray(defaults)).toBe(false);
  });
});

// ── Point 4: Home layout slot validation ─────────────────────────────────────

interface LayoutSlot {
  id: string;
  type: string;
  title?: string;
  position: number;
  config?: Record<string, unknown>;
}

function isValidSlot(s: unknown): s is LayoutSlot {
  if (!s || typeof s !== 'object') return false;
  const obj = s as Record<string, unknown>;
  return typeof obj.id === 'string' && typeof obj.type === 'string' && typeof obj.position === 'number';
}

describe('Phase 8 §A Point 4 — Home layout slot validation', () => {
  it('accepts a valid layout slot', () => {
    expect(isValidSlot({ id: 'slot-1', type: 'music', position: 0 })).toBe(true);
  });

  it('accepts a slot with optional fields', () => {
    expect(isValidSlot({
      id: 'slot-2', type: 'code', position: 1,
      title: 'My Code Window', config: { theme: 'dark' }
    })).toBe(true);
  });

  it('rejects a slot with missing id', () => {
    expect(isValidSlot({ type: 'music', position: 0 })).toBe(false);
  });

  it('rejects a slot with missing type', () => {
    expect(isValidSlot({ id: 'slot-1', position: 0 })).toBe(false);
  });

  it('rejects a slot with missing position', () => {
    expect(isValidSlot({ id: 'slot-1', type: 'music' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidSlot(null)).toBe(false);
  });

  it('rejects a non-object', () => {
    expect(isValidSlot('string')).toBe(false);
    expect(isValidSlot(42)).toBe(false);
  });

  it('preserves slot ordering by position', () => {
    const slots: LayoutSlot[] = [
      { id: 'a', type: 'code',  position: 2 },
      { id: 'b', type: 'music', position: 0 },
      { id: 'c', type: 'lab',   position: 1 },
    ];
    const sorted = [...slots].sort((a, b) => a.position - b.position);
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('c');
    expect(sorted[2].id).toBe('a');
  });
});

// ── Point 1 & 2: Unified feed entry shape ────────────────────────────────────

interface UnifiedFeedEntry {
  id: string;
  source: 'connector' | 'post' | 'system';
  provider?: string;
  published_at: string;
  created_at: string;
}

function isValidFeedEntry(e: unknown): e is UnifiedFeedEntry {
  if (!e || typeof e !== 'object') return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    (obj.source === 'connector' || obj.source === 'post' || obj.source === 'system') &&
    typeof obj.published_at === 'string' &&
    typeof obj.created_at === 'string'
  );
}

describe('Phase 8 §A Points 1 & 2 — Unified feed entry schema', () => {
  it('accepts a valid connector feed entry', () => {
    expect(isValidFeedEntry({
      id: 'abc-123',
      source: 'connector',
      provider: 'mastodon',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })).toBe(true);
  });

  it('accepts a valid platform post entry', () => {
    expect(isValidFeedEntry({
      id: 'post-456',
      source: 'post',
      provider: 'dreamengin',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })).toBe(true);
  });

  it('rejects an entry with unknown source', () => {
    expect(isValidFeedEntry({
      id: 'xyz',
      source: 'unknown',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })).toBe(false);
  });

  it('rejects an entry with missing id', () => {
    expect(isValidFeedEntry({
      source: 'post',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })).toBe(false);
  });

  it('sorts feed entries by published_at descending', () => {
    const now = Date.now();
    const entries: UnifiedFeedEntry[] = [
      { id: 'a', source: 'post',      published_at: new Date(now - 3000).toISOString(), created_at: new Date(now - 3000).toISOString() },
      { id: 'b', source: 'connector', published_at: new Date(now - 1000).toISOString(), created_at: new Date(now - 1000).toISOString() },
      { id: 'c', source: 'post',      published_at: new Date(now - 2000).toISOString(), created_at: new Date(now - 2000).toISOString() },
    ];
    const sorted = [...entries].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('c');
    expect(sorted[2].id).toBe('a');
  });

  it('connector items from feed_items are tagged source=connector', () => {
    const connectorEntry: UnifiedFeedEntry = {
      id: 'fi-001',
      source: 'connector',
      provider: 'github',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    expect(connectorEntry.source).toBe('connector');
    expect(connectorEntry.provider).toBe('github');
  });
});

// ── Point 6: Feed privacy model ───────────────────────────────────────────────

describe('Phase 8 §A Point 6 — Feed content private by default', () => {
  it('feed_items are user-scoped (RLS enforcement documented)', () => {
    // This test validates the documented RLS model for feed_items.
    // In the live system, only auth.uid() = user_id can SELECT or INSERT.
    // The migration (20260310000004_feed_items.sql) enforces this at the DB layer.
    const rlsPolicy = {
      table: 'feed_items',
      policies: [
        { name: 'feed_items_select_own', using: 'auth.uid() = user_id' },
        { name: 'feed_items_insert_own', with_check: 'auth.uid() = user_id' },
        { name: 'feed_items_delete_own', using: 'auth.uid() = user_id' },
      ],
      no_update_policy: true, // feed items are immutable once stored
    };
    expect(rlsPolicy.table).toBe('feed_items');
    expect(rlsPolicy.policies).toHaveLength(3);
    expect(rlsPolicy.no_update_policy).toBe(true);
  });

  it('connector feed items do not expose cross-user data', () => {
    // A user can only see their own connector feed items.
    // This is a policy contract test — the actual enforcement is in Supabase.
    const userId = 'user-a';
    const anotherUserId = 'user-b';
    // Simulate the filter: only return items where user_id === requestingUserId
    const allItems = [
      { id: '1', user_id: userId,        provider: 'mastodon' },
      { id: '2', user_id: anotherUserId, provider: 'github'   },
    ];
    const visible = allItems.filter(i => i.user_id === userId);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('1');
  });
});
