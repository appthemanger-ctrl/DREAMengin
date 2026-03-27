/**
 * tests/social-feed.test.ts
 *
 * Unit tests for lib/social-feed.ts
 *
 * Coverage:
 *  A. stripHtml — HTML stripping
 *  B. extractFirstImage — image extraction from rss-parser items
 *  C. fetchSocialFeed (mocked) — normalisation to SocialFeedItem
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stripHtml,
  extractFirstImage,
  fetchSocialFeed,
  type SocialFeedItem,
} from '@/lib/social-feed';

// ── A. stripHtml ──────────────────────────────────────────────────────────

describe('social-feed stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('  lots   of   space  ')).toBe('lots of space');
  });

  it('returns empty string for null / undefined / empty', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml('')).toBe('');
  });
});

// ── B. extractFirstImage ──────────────────────────────────────────────────

describe('social-feed extractFirstImage', () => {
  it('returns enclosure.url when present', () => {
    expect(extractFirstImage({ enclosure: { url: 'https://example.com/img.jpg' } })).toBe(
      'https://example.com/img.jpg',
    );
  });

  it('returns first media:content url', () => {
    const item = {
      mediaContent: [{ $: { url: 'https://example.com/video.jpg' } }],
    };
    expect(extractFirstImage(item)).toBe('https://example.com/video.jpg');
  });

  it('returns first media:thumbnail url', () => {
    const item = {
      mediaThumbnail: [{ $: { url: 'https://example.com/thumb.jpg' } }],
    };
    expect(extractFirstImage(item)).toBe('https://example.com/thumb.jpg');
  });

  it('extracts image from HTML description', () => {
    const item = {
      description: '<p>Hello <img src="https://example.com/post.png" /> world</p>',
    };
    expect(extractFirstImage(item)).toBe('https://example.com/post.png');
  });

  it('extracts image from contentEncoded', () => {
    const item = {
      contentEncoded: '<div><img src="https://example.com/content.png" /></div>',
    };
    expect(extractFirstImage(item)).toBe('https://example.com/content.png');
  });

  it('returns null when no image found', () => {
    expect(extractFirstImage({ title: 'No image here' })).toBeNull();
  });

  it('prefers enclosure over media:content', () => {
    const item = {
      enclosure: { url: 'https://example.com/enc.jpg' },
      mediaContent: [{ $: { url: 'https://example.com/mc.jpg' } }],
    };
    expect(extractFirstImage(item)).toBe('https://example.com/enc.jpg');
  });
});

// ── C. fetchSocialFeed (mocked) ───────────────────────────────────────────

describe('fetchSocialFeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns normalised SocialFeedItems from a mocked feed', async () => {
    const mockFeed = {
      title: 'Test YouTube Channel',
      items: [
        {
          guid: 'yt:video:abc123',
          title: 'My Video',
          link: 'https://www.youtube.com/watch?v=abc123',
          description: '<p>A <b>cool</b> video</p>',
          isoDate: '2024-01-15T12:00:00.000Z',
          pubDate: 'Mon, 15 Jan 2024 12:00:00 GMT',
          mediaThumbnail: [{ $: { url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg' } }],
        },
      ],
    };

    const ParserModule = await import('rss-parser');
    const ParserClass = (ParserModule as { default: typeof import('rss-parser') }).default;
    vi.spyOn(ParserClass.prototype, 'parseURL').mockResolvedValueOnce(mockFeed as never);

    const items = await fetchSocialFeed(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCtest',
      'youtube',
    );

    expect(items).toHaveLength(1);
    const item: SocialFeedItem = items[0];
    expect(item.source).toBe('youtube');
    expect(item.id).toBe('yt:video:abc123');
    expect(item.title).toBe('My Video');
    expect(item.link).toBe('https://www.youtube.com/watch?v=abc123');
    expect(item.image).toBe('https://i.ytimg.com/vi/abc123/hqdefault.jpg');
    expect(item.description).toBe('A cool video');
    expect(item.isoDate).toBe('2024-01-15T12:00:00.000Z');
    expect(item.pubDate).toBe('Mon, 15 Jan 2024 12:00:00 GMT');
  });

  it('respects the limit parameter', async () => {
    const mockFeed = {
      title: 'Big Channel',
      items: Array.from({ length: 20 }, (_, i) => ({
        guid: `item:${i}`,
        title: `Item ${i}`,
        link: `https://example.com/${i}`,
        isoDate: new Date().toISOString(),
      })),
    };

    const ParserModule = await import('rss-parser');
    const ParserClass = (ParserModule as { default: typeof import('rss-parser') }).default;
    vi.spyOn(ParserClass.prototype, 'parseURL').mockResolvedValueOnce(mockFeed as never);

    const items = await fetchSocialFeed('https://example.com/rss', 'x', 5);
    expect(items).toHaveLength(5);
  });

  it('sets author from feed title when item has no creator', async () => {
    const mockFeed = {
      title: 'Channel Name',
      items: [
        {
          guid: 'post:1',
          title: 'Post',
          link: 'https://example.com/1',
        },
      ],
    };

    const ParserModule = await import('rss-parser');
    const ParserClass = (ParserModule as { default: typeof import('rss-parser') }).default;
    vi.spyOn(ParserClass.prototype, 'parseURL').mockResolvedValueOnce(mockFeed as never);

    const items = await fetchSocialFeed('https://example.com/rss', 'tiktok');
    expect(items[0].author).toBe('Channel Name');
  });

  it('returns null description when content is missing', async () => {
    const mockFeed = {
      title: 'Empty Feed',
      items: [
        {
          guid: 'post:2',
          title: 'No Content',
          link: 'https://example.com/2',
        },
      ],
    };

    const ParserModule = await import('rss-parser');
    const ParserClass = (ParserModule as { default: typeof import('rss-parser') }).default;
    vi.spyOn(ParserClass.prototype, 'parseURL').mockResolvedValueOnce(mockFeed as never);

    const items = await fetchSocialFeed('https://example.com/rss', 'instagram');
    expect(items[0].description).toBeNull();
  });
});
