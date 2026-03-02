import { describe, it, expect } from 'vitest';
import { TTLCache } from '@/lib/feed/cache';
import { validateThemes, getAllThemes, getTheme } from '@/lib/feed/themes';
import { sanitizeUrl, htmlToText, truncate } from '@/lib/feed/sanitize';
import { assembleFeed } from '@/lib/feed/assembler';
import { registerProvider } from '@/lib/feed/providers/index';
import type { FeedItem, FeedRequest } from '@/lib/feed/types';

// ─── TTLCache ─────────────────────────────────────────────────────────────────

describe('TTLCache', () => {
  it('stores and retrieves a value', () => {
    const cache = new TTLCache<string>(1000);
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('returns undefined for a missing key', () => {
    const cache = new TTLCache<string>(1000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('returns undefined after TTL expires', async () => {
    const cache = new TTLCache<string>(10); // 10 ms TTL
    cache.set('key', 'value');
    await new Promise((r) => setTimeout(r, 20));
    expect(cache.get('key')).toBeUndefined();
  });

  it('getStale returns expired value', async () => {
    const cache = new TTLCache<string>(10);
    cache.set('key', 'stale');
    await new Promise((r) => setTimeout(r, 20));
    expect(cache.getStale('key')).toBe('stale');
  });

  it('evict removes expired entries', async () => {
    const cache = new TTLCache<string>(10);
    cache.set('k1', 'v1');
    cache.set('k2', 'v2', 60_000);
    await new Promise((r) => setTimeout(r, 20));
    cache.evict();
    expect(cache.size()).toBe(1);
  });

  it('delete removes an entry', () => {
    const cache = new TTLCache<string>(10_000);
    cache.set('key', 'val');
    cache.delete('key');
    expect(cache.get('key')).toBeUndefined();
  });
});

// ─── Theme Profiles ───────────────────────────────────────────────────────────

describe('Theme profiles', () => {
  it('all 6 daydream themes are defined', () => {
    const themes = getAllThemes();
    expect(themes).toHaveLength(6);
    const ids = themes.map((t) => t.id);
    expect(ids).toContain('analytics');
    expect(ids).toContain('brand');
    expect(ids).toContain('games');
    expect(ids).toContain('media-vault');
    expect(ids).toContain('music');
    expect(ids).toContain('play');
  });

  it('each theme has at least 10 keywords and at least 1 RSS feed', () => {
    for (const theme of getAllThemes()) {
      expect(theme.keywords.length).toBeGreaterThanOrEqual(10);
      expect(theme.rssFeeds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('validateThemes returns valid=true', () => {
    const { valid, errors } = validateThemes();
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it('getTheme returns the correct profile', () => {
    const games = getTheme('games');
    expect(games.id).toBe('games');
    expect(games.mediaPreference).toBe('video-first');
  });
});

// ─── Sanitizers ───────────────────────────────────────────────────────────────

describe('sanitizeUrl', () => {
  it('removes utm_* parameters', () => {
    const raw = 'https://example.com/article?utm_source=feed&utm_medium=rss&title=hello';
    const clean = sanitizeUrl(raw);
    expect(clean).not.toContain('utm_source');
    expect(clean).not.toContain('utm_medium');
    expect(clean).toContain('title=hello');
  });

  it('removes fbclid and gclid', () => {
    const raw = 'https://example.com/?fbclid=abc&gclid=xyz';
    expect(sanitizeUrl(raw)).toBe('https://example.com/');
  });

  it('returns original when URL is invalid', () => {
    expect(sanitizeUrl('not-a-url')).toBe('not-a-url');
  });

  it('returns undefined when input is undefined', () => {
    expect(sanitizeUrl(undefined)).toBeUndefined();
  });
});

describe('htmlToText', () => {
  it('strips HTML tags', () => {
    expect(htmlToText('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('decodes HTML entities', () => {
    expect(htmlToText('AT&amp;T &lt;rocks&gt;')).toBe('AT&T <rocks>');
  });

  it('removes script blocks', () => {
    const html = 'Before<script>alert("x")</script>After';
    expect(htmlToText(html)).toBe('BeforeAfter');
  });
});

describe('truncate', () => {
  it('leaves short strings untouched', () => {
    expect(truncate('hi', 10)).toBe('hi');
  });

  it('appends ellipsis when over limit', () => {
    const result = truncate('Hello World', 8);
    expect(result.length).toBe(8);
    expect(result.endsWith('…')).toBe(true);
  });
});

// ─── Feed Assembler ───────────────────────────────────────────────────────────

// Helper: build a mock FeedItem
function mockItem(overrides: Partial<FeedItem> & { id: string }): FeedItem {
  return {
    id: overrides.id,
    source: 'test',
    sourceType: 'news',
    providerId: 'test-provider',
    text: 'Test content',
    author: { name: 'Test Author' },
    media: [],
    publishedAt: new Date().toISOString(),
    tags: [],
    ...overrides,
  };
}

// Register a minimal test provider once at module level
registerProvider({
  id: 'test-provider',
  type: 'news',
  supportsThemes: 'all',
  requiresConfig: false,
  fetch: async (_req: FeedRequest) => ({
    items: [
      mockItem({ id: 'test-provider:1', url: 'https://example.com/a', title: 'Alpha analytics dashboard' }),
      mockItem({ id: 'test-provider:2', url: 'https://example.com/b', title: 'Beta post' }),
      // Duplicate URL – should be deduped
      mockItem({ id: 'test-provider:3', url: 'https://example.com/a', title: 'Alpha duplicate' }),
      // Missing title and text – should be filtered
      { ...mockItem({ id: 'test-provider:4' }), title: undefined, text: '' },
    ],
  }),
});

describe('assembleFeed – dedupe + safety', () => {
  it('deduplicates items by canonical URL', async () => {
    const response = await assembleFeed({ theme: 'analytics', limit: 10 });
    const urls = response.items.map((i) => i.url).filter(Boolean);
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  it('removes items with neither title nor text', async () => {
    const response = await assembleFeed({ theme: 'analytics', limit: 10 });
    for (const item of response.items) {
      expect(Boolean(item.title) || Boolean(item.text)).toBe(true);
    }
  });

  it('returns partialErrors array (may be empty)', async () => {
    const response = await assembleFeed({ theme: 'brand', limit: 5 });
    expect(Array.isArray(response.partialErrors)).toBe(true);
  });

  it('respects the limit', async () => {
    const response = await assembleFeed({ theme: 'play', limit: 1 });
    expect(response.items.length).toBeLessThanOrEqual(1);
  });

  it('assembledAt is a valid ISO date', async () => {
    const response = await assembleFeed({ theme: 'games', limit: 5 });
    expect(() => new Date(response.assembledAt)).not.toThrow();
    expect(new Date(response.assembledAt).toISOString()).toBe(response.assembledAt);
  });
});
