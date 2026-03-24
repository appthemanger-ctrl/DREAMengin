/**
 * tests/rss-feed.test.ts
 *
 * Unit tests for lib/social/rss-feed.ts
 *
 * Coverage:
 *  A. URL builders — correct feed URL construction per provider
 *  B. stripHtml    — HTML stripping + entity decoding
 *  C. extractFirstImage — image extraction from rss-parser items
 *  D. normaliseRssItem — full item normalisation to UnifiedFeedItem
 *  E. parseRssFeed (mocked) — integration smoke test without network
 *
 * No network calls — rss-parser.parseURL is mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  youtubeChannelRssUrl,
  youtubePlaylistRssUrl,
  redditSubredditRssUrl,
  redditUserRssUrl,
  mastodonUserRssUrl,
  githubUserAtomUrl,
  nostrGatewayRssUrl,
  stripHtml,
  extractFirstImage,
  normaliseRssItem,
  parseRssFeed,
  type RssFeedConfig,
} from '@/lib/social/rss-feed';

// ── A. URL builders ───────────────────────────────────────────────────────

describe('youtubeChannelRssUrl', () => {
  it('builds the correct YouTube channel feed URL', () => {
    expect(youtubeChannelRssUrl('UCxxxxxx')).toBe(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxx',
    );
  });

  it('URL-encodes special characters in channel IDs', () => {
    const url = youtubeChannelRssUrl('UC a+b');
    expect(url).toContain(encodeURIComponent('UC a+b'));
  });
});

describe('youtubePlaylistRssUrl', () => {
  it('builds the correct YouTube playlist feed URL', () => {
    expect(youtubePlaylistRssUrl('PLxxxxxx')).toBe(
      'https://www.youtube.com/feeds/videos.xml?playlist_id=PLxxxxxx',
    );
  });
});

describe('redditSubredditRssUrl', () => {
  it('builds the correct subreddit RSS URL', () => {
    expect(redditSubredditRssUrl('programming')).toBe(
      'https://www.reddit.com/r/programming/.rss?limit=25',
    );
  });

  it('strips leading "r/" prefix if provided', () => {
    expect(redditSubredditRssUrl('r/programming')).toBe(
      'https://www.reddit.com/r/programming/.rss?limit=25',
    );
  });
});

describe('redditUserRssUrl', () => {
  it('builds the correct user submitted RSS URL', () => {
    expect(redditUserRssUrl('spez')).toBe(
      'https://www.reddit.com/user/spez/submitted/.rss?limit=25',
    );
  });

  it('strips leading "u/" prefix if provided', () => {
    expect(redditUserRssUrl('u/spez')).toBe(
      'https://www.reddit.com/user/spez/submitted/.rss?limit=25',
    );
  });
});

describe('mastodonUserRssUrl', () => {
  it('builds the correct Mastodon user RSS URL', () => {
    expect(mastodonUserRssUrl('https://mastodon.social', 'alice')).toBe(
      'https://mastodon.social/@alice.rss',
    );
  });

  it('strips trailing slash from instance URL', () => {
    expect(mastodonUserRssUrl('https://mastodon.social/', 'alice')).toBe(
      'https://mastodon.social/@alice.rss',
    );
  });

  it('strips leading @ from handle', () => {
    expect(mastodonUserRssUrl('https://mastodon.social', '@alice')).toBe(
      'https://mastodon.social/@alice.rss',
    );
  });

  it('strips @instance suffix from handle', () => {
    expect(mastodonUserRssUrl('https://mastodon.social', 'alice@mastodon.social')).toBe(
      'https://mastodon.social/@alice.rss',
    );
  });
});

describe('githubUserAtomUrl', () => {
  it('builds the correct GitHub atom URL', () => {
    expect(githubUserAtomUrl('octocat')).toBe(
      'https://github.com/octocat.atom',
    );
  });
});

describe('nostrGatewayRssUrl', () => {
  it('builds the correct njump.me RSS URL for a pubkey', () => {
    const npub = 'npub1abc123';
    expect(nostrGatewayRssUrl(npub)).toBe(
      `https://njump.me/${encodeURIComponent(npub)}/rss`,
    );
  });
});

// ── B. stripHtml ──────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('decodes &amp;', () => {
    expect(stripHtml('cats &amp; dogs')).toBe('cats & dogs');
  });

  it('decodes &lt; and &gt;', () => {
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
  });

  it('decodes &quot; and &#39;', () => {
    expect(stripHtml('say &quot;hi&quot; and &#39;bye&#39;')).toBe("say \"hi\" and 'bye'");
  });

  it('decodes &nbsp; to a space', () => {
    expect(stripHtml('word&nbsp;word')).toBe('word word');
  });

  it('collapses multiple spaces', () => {
    expect(stripHtml('  lots   of   space  ')).toBe('lots of space');
  });

  it('returns empty string for null / undefined', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml('')).toBe('');
  });
});

// ── C. extractFirstImage ──────────────────────────────────────────────────

describe('extractFirstImage', () => {
  it('returns enclosure.url when present and image-like', () => {
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

  it('extracts image from content:encoded (mapped to contentEncoded)', () => {
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

// ── D. normaliseRssItem ───────────────────────────────────────────────────

describe('normaliseRssItem', () => {
  const config: RssFeedConfig = {
    provider: 'youtube',
    feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC123',
    authorHandle: 'TestChannel',
    authorName: 'Test Channel',
  };

  const rawItem = {
    guid: 'yt:video:abc123',
    title: 'My YouTube Video',
    link: 'https://www.youtube.com/watch?v=abc123',
    description: '<p>A <b>cool</b> video</p>',
    isoDate: '2024-01-15T12:00:00.000Z',
    mediaThumbnail: [{ $: { url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg' } }],
  };

  it('maps provider correctly', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.provider).toBe('youtube');
  });

  it('uses guid as external_id', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.external_id).toBe('yt:video:abc123');
  });

  it('uses config authorHandle and authorName overrides', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.author_handle).toBe('TestChannel');
    expect(item.author_name).toBe('Test Channel');
  });

  it('strips HTML from description for content_text', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.content_text).toBe('A cool video');
  });

  it('preserves raw HTML in content_html', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.content_html).toBe('<p>A <b>cool</b> video</p>');
  });

  it('sets permalink from item.link', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.permalink).toBe('https://www.youtube.com/watch?v=abc123');
  });

  it('parses isoDate as published_at', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.published_at).toBe('2024-01-15T12:00:00.000Z');
  });

  it('extracts thumbnail as media item with type video (youtube provider)', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.media).toHaveLength(1);
    expect(item.media[0].url).toBe('https://i.ytimg.com/vi/abc123/hqdefault.jpg');
    expect(item.media[0].type).toBe('video');
  });

  it('stores the raw item', () => {
    const item = normaliseRssItem(rawItem, config, 'Test Channel');
    expect(item.raw).toBe(rawItem);
  });

  it('falls back to item.link for external_id when guid is absent', () => {
    const noGuid = { ...rawItem, guid: undefined };
    const item = normaliseRssItem(noGuid, config, 'Test Channel');
    expect(item.external_id).toBe('https://www.youtube.com/watch?v=abc123');
  });

  it('falls back to channel title for author when item has no author field', () => {
    const configNoAuthor: RssFeedConfig = {
      provider: 'reddit',
      feedUrl: 'https://www.reddit.com/r/programming/.rss',
    };
    const item = normaliseRssItem(
      { guid: 'r:123', title: 'A post', link: 'https://reddit.com/r/programming/123' },
      configNoAuthor,
      'r/programming',
    );
    expect(item.author_name).toBe('r/programming');
  });

  it('uses item.author field when config has no override', () => {
    const configNoAuthor: RssFeedConfig = { provider: 'github', feedUrl: 'https://github.com/octocat.atom' };
    const item = normaliseRssItem(
      { guid: 'gh:123', author: 'octocat', link: 'https://github.com/octocat' },
      configNoAuthor,
      'octocat',
    );
    expect(item.author_handle).toBe('octocat');
  });
});

// ── E. parseRssFeed (mocked) ──────────────────────────────────────────────

describe('parseRssFeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns normalised items from a mocked feed', async () => {
    // Mock rss-parser's parseURL
    const mockFeed = {
      title: 'DREAMengin Test Channel',
      items: [
        {
          guid: 'yt:video:test1',
          title: 'Test Video 1',
          link: 'https://www.youtube.com/watch?v=test1',
          description: '<p>Description 1</p>',
          isoDate: '2024-06-01T10:00:00.000Z',
        },
        {
          guid: 'yt:video:test2',
          title: 'Test Video 2',
          link: 'https://www.youtube.com/watch?v=test2',
          description: '<p>Description 2</p>',
          isoDate: '2024-06-02T10:00:00.000Z',
        },
      ],
    };

    // Patch the singleton parser via module-level mock
     
    const ParserModule = await import('rss-parser');
    const ParserClass = (ParserModule as { default: typeof import('rss-parser') }).default;
    vi.spyOn(ParserClass.prototype, 'parseURL').mockResolvedValueOnce(mockFeed as never);

    const config: RssFeedConfig = {
      provider: 'youtube',
      feedUrl: youtubeChannelRssUrl('UCtest'),
    };

    const items = await parseRssFeed(config, 10);

    expect(items).toHaveLength(2);
    expect(items[0].provider).toBe('youtube');
    expect(items[0].external_id).toBe('yt:video:test1');
    expect(items[0].content_text).toBe('Description 1');
    expect(items[1].external_id).toBe('yt:video:test2');
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

    const config: RssFeedConfig = { provider: 'reddit', feedUrl: redditSubredditRssUrl('programming') };
    const items = await parseRssFeed(config, 5);

    expect(items).toHaveLength(5);
  });
});
