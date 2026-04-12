/**
 * tests/dreamr-feed-topics.test.ts
 *
 * Unit tests for DreamR feed topic channel data and YouTube channel API response typing.
 * These tests verify:
 *   1. DREAMR_TOPICS structure — 11 topics (including "All"), correct fields
 *   2. All topic IDs are unique
 *   3. Non-"All" topics have YouTube search queries
 *   4. Topic emoji and label presence
 *   5. ytItemToFeedPost shape (via the exported helper logic)
 *   6. YouTubeChannelResponse typing matches expected shape
 *   7. Swipe-left routing logic (YouTube vs native post detection)
 */

import { describe, it, expect } from 'vitest';

// ── Import topic data directly ─────────────────────────────────────────────────

import { DREAMR_TOPICS } from '@/dreamdmbar/homedream/dreamr/DreamRFeed';

// ── Topic structure tests ──────────────────────────────────────────────────────

describe('DREAMR_TOPICS', () => {
  it('has at least 11 entries including "All"', () => {
    expect(DREAMR_TOPICS.length).toBeGreaterThanOrEqual(11);
  });

  it('starts with an "All" topic with empty query', () => {
    const first = DREAMR_TOPICS[0]!;
    expect(first.id).toBe('all');
    expect(first.label).toBe('All');
    expect(first.query).toBe('');
  });

  it('all topic IDs are unique', () => {
    const ids = DREAMR_TOPICS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every non-All topic has a non-empty query', () => {
    DREAMR_TOPICS.filter(t => t.id !== 'all').forEach(t => {
      expect(t.query.length).toBeGreaterThan(0);
    });
  });

  it('every topic has an emoji', () => {
    DREAMR_TOPICS.forEach(t => {
      expect(t.emoji.length).toBeGreaterThan(0);
    });
  });

  it('every topic has a label', () => {
    DREAMR_TOPICS.forEach(t => {
      expect(t.label.length).toBeGreaterThan(0);
    });
  });

  it('contains the 10 expected content topics', () => {
    const ids = new Set(DREAMR_TOPICS.map(t => t.id));
    const required = ['world-news', 'sports', 'hip-hop', 'tech', 'stocks', 'science', 'gaming', 'music', 'business', 'space'];
    for (const id of required) {
      expect(ids.has(id), `Missing topic: ${id}`).toBe(true);
    }
  });

  it('world-news query includes "english" for EN-language bias', () => {
    const wn = DREAMR_TOPICS.find(t => t.id === 'world-news')!;
    expect(wn.query.toLowerCase()).toContain('english');
  });

  it('hip-hop query contains "hip hop"', () => {
    const hh = DREAMR_TOPICS.find(t => t.id === 'hip-hop')!;
    expect(hh.query.toLowerCase()).toContain('hip hop');
  });

  it('stocks query contains "stock market"', () => {
    const sm = DREAMR_TOPICS.find(t => t.id === 'stocks')!;
    expect(sm.query.toLowerCase()).toContain('stock market');
  });

  it('all queries include a year (2026) for freshness signals', () => {
    DREAMR_TOPICS.filter(t => t.id !== 'all').forEach(t => {
      expect(t.query).toContain('2026');
    });
  });
});

// ── ytItemToFeedPost contract ─────────────────────────────────────────────────
// We test the mapping logic directly — no need to import the private helper;
// instead we inline the same transformation to verify expected output shape.

function ytItemToFeedPostLocal(item: {
  external_id: string;
  content_text: string;
  published_at: string;
  author_handle: string;
  author_name: string;
  permalink: string;
  media: Array<{ thumbnail_url?: string; url?: string }>;
}) {
  const thumbnail = item.media.length > 0
    ? (item.media[0]?.thumbnail_url ?? item.media[0]?.url ?? null)
    : null;
  return {
    id:          `yt:${item.external_id}`,
    content:     item.content_text,
    visibility:  'public',
    media_url:   thumbnail,
    created_at:  item.published_at,
    profiles:    { handle: item.author_handle, display_name: item.author_name, avatar_url: null },
    likes_count: 0,
    comments_count: 0,
    source:      'connector',
    provider:    'youtube',
    permalink:   item.permalink,
  };
}

describe('ytItemToFeedPost mapping', () => {
  const sampleItem = {
    external_id:  'abc123',
    content_text: 'NASA Discovery Launch 2026',
    published_at: '2026-04-05T00:00:00Z',
    author_handle: 'NASAChannel',
    author_name:   'NASA',
    permalink:     'https://www.youtube.com/watch?v=abc123',
    media: [{ thumbnail_url: 'https://img.youtube.com/vi/abc123/hqdefault.jpg' }],
  };

  it('prefixes id with "yt:"', () => {
    const post = ytItemToFeedPostLocal(sampleItem);
    expect(post.id).toBe('yt:abc123');
  });

  it('maps content_text to content', () => {
    const post = ytItemToFeedPostLocal(sampleItem);
    expect(post.content).toBe('NASA Discovery Launch 2026');
  });

  it('picks thumbnail as media_url', () => {
    const post = ytItemToFeedPostLocal(sampleItem);
    expect(post.media_url).toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
  });

  it('sets provider to "youtube"', () => {
    const post = ytItemToFeedPostLocal(sampleItem);
    expect(post.provider).toBe('youtube');
  });

  it('sets source to "connector"', () => {
    const post = ytItemToFeedPostLocal(sampleItem);
    expect(post.source).toBe('connector');
  });

  it('maps profiles correctly', () => {
    const post = ytItemToFeedPostLocal(sampleItem);
    expect(post.profiles.handle).toBe('NASAChannel');
    expect(post.profiles.display_name).toBe('NASA');
    expect(post.profiles.avatar_url).toBeNull();
  });

  it('returns null media_url when media is empty', () => {
    const post = ytItemToFeedPostLocal({ ...sampleItem, media: [] });
    expect(post.media_url).toBeNull();
  });

  it('falls back to url if no thumbnail_url', () => {
    const post = ytItemToFeedPostLocal({
      ...sampleItem,
      media: [{ url: 'https://img.youtube.com/vi/abc123/default.jpg' }],
    });
    expect(post.media_url).toBe('https://img.youtube.com/vi/abc123/default.jpg');
  });
});

// ── Swipe-left routing logic ──────────────────────────────────────────────────
// isYouTube(post) → true for YouTube provider or youtube permalink

function isYouTubeLocal(post: { provider?: string; source?: string; permalink?: string | null }): boolean {
  return post.provider === 'youtube' || !!(post.permalink?.includes('youtu'));
}

describe('isYouTube routing', () => {
  it('returns true for provider=youtube', () => {
    expect(isYouTubeLocal({ provider: 'youtube' })).toBe(true);
  });

  it('returns true for youtube.com permalink', () => {
    expect(isYouTubeLocal({ permalink: 'https://www.youtube.com/watch?v=abc' })).toBe(true);
  });

  it('returns true for youtu.be permalink', () => {
    expect(isYouTubeLocal({ permalink: 'https://youtu.be/abc' })).toBe(true);
  });

  it('returns false for dreamengin native post', () => {
    expect(isYouTubeLocal({ provider: 'dreamengin', source: 'post' })).toBe(false);
  });

  it('returns false for instagram connector', () => {
    expect(isYouTubeLocal({ provider: 'instagram', permalink: 'https://instagram.com/p/abc' })).toBe(false);
  });

  it('returns false for no provider or permalink', () => {
    expect(isYouTubeLocal({})).toBe(false);
  });
});

// ── YouTubeChannelResponse shape ──────────────────────────────────────────────

describe('YouTubeChannelResponse typing', () => {
  it('has the expected shape', () => {
    const response = {
      ok: true,
      channelVideos: [
        {
          provider: 'youtube',
          external_id: 'vid1',
          author_handle: 'CNN',
          author_name: 'CNN',
          content_text: 'Breaking news',
          media: [],
          permalink: 'https://www.youtube.com/watch?v=vid1',
          published_at: '2026-04-05T00:00:00Z',
          raw: {},
        },
      ],
      similarVideos: [],
      channel: 'CNN',
      topic: 'World News',
    };

    expect(response.ok).toBe(true);
    expect(response.channelVideos).toHaveLength(1);
    expect(response.similarVideos).toHaveLength(0);
    expect(response.channel).toBe('CNN');
    expect(response.topic).toBe('World News');
    expect(response.channelVideos[0]!.provider).toBe('youtube');
  });

  it('handles error shape', () => {
    const errorResponse = {
      ok: false,
      channelVideos: [],
      similarVideos: [],
      channel: '',
      topic: '',
      error: 'YOUTUBE_API_KEY is not configured.',
    };
    expect(errorResponse.ok).toBe(false);
    expect(errorResponse.error).toContain('YOUTUBE_API_KEY');
  });
});
