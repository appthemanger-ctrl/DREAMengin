/**
 * tests/connectors.test.ts
 *
 * Phase 5 — Feed & Friends Connections tests
 *
 * Coverage:
 * A. ConnectorRegistry — status mapping, tier classification, defaultStatus rules
 * B. Normalisation — stripHtml, deduplication, provider-specific normalisation
 * C. Status truthfulness — no connector starts as 'connected' in initial state
 * D. Nostr utilities — pubkey validation
 *
 * No network calls, no DB calls — pure unit tests.
 *
 * AGENT_PLAYBOOK.md §5 — pnpm exec vitest run
 */

import { describe, it, expect } from 'vitest';
import {
  CONNECTOR_REGISTRY,
  getConnectorDef,
} from '@/lib/connectors/connectorRegistry';
import {
  stripHtml,
  hostFromUrl,
  atUriToHttps,
  normaliseMastodon,
  normaliseBluesky,
  normaliseGitHub,
  normaliseReddit,
  normaliseNostr,
  normalisePodcast,
  normaliseTwitter,
  normaliseYouTubePlaylistItem,
  normaliseYouTubeSearchResult,
  deduplicateFeedItems,
} from '@/lib/connectors/normalise';
import { isValidNostrPubkey } from '@/lib/connectors/providers/nostr';

// ── A. ConnectorRegistry ──────────────────────────────────────────────────

describe('CONNECTOR_REGISTRY', () => {
  it('has at least 6 tier-1 connectors', () => {
    const tier1 = CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier1');
    expect(tier1.length).toBeGreaterThanOrEqual(6);
  });

  it('includes Mastodon, Bluesky, GitHub, Reddit, Nostr, YouTube as tier-1', () => {
    const tier1Ids = CONNECTOR_REGISTRY
      .filter((c) => c.tier === 'tier1')
      .map((c) => c.id);
    expect(tier1Ids).toContain('mastodon');
    expect(tier1Ids).toContain('bluesky');
    expect(tier1Ids).toContain('github');
    expect(tier1Ids).toContain('reddit');
    expect(tier1Ids).toContain('nostr');
    expect(tier1Ids).toContain('youtube');
  });

  it('tier-1 connectors have defaultStatus of "not_connected"', () => {
    const tier1 = CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier1');
    for (const conn of tier1) {
      expect(conn.defaultStatus).toBe('not_connected');
    }
  });

  it('tier-3 connectors have defaultStatus of "unsupported"', () => {
    const tier3 = CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier3');
    expect(tier3.length).toBeGreaterThan(0);
    for (const conn of tier3) {
      expect(conn.defaultStatus).toBe('unsupported');
    }
  });

  it('Instagram is tier-3 (no official follower list API)', () => {
    const ig = getConnectorDef('instagram');
    expect(ig).toBeDefined();
    expect(ig!.tier).toBe('tier3');
    expect(ig!.defaultStatus).toBe('unsupported');
  });

  it('LinkedIn is tier-2 (requires approval)', () => {
    const li = getConnectorDef('linkedin');
    expect(li).toBeDefined();
    expect(li!.tier).toBe('tier2');
    expect(li!.defaultStatus).toBe('requires_approval');
  });

  it('every connector has a whatYouGet field', () => {
    for (const conn of CONNECTOR_REGISTRY) {
      expect(typeof conn.whatYouGet).toBe('string');
      expect(conn.whatYouGet.length).toBeGreaterThan(0);
    }
  });

  it('every connector has 1-5 sliceTypes', () => {
    for (const conn of CONNECTOR_REGISTRY) {
      expect(conn.sliceTypes.length).toBeGreaterThanOrEqual(1);
      expect(conn.sliceTypes.length).toBeLessThanOrEqual(5);
    }
  });

  it('getConnectorDef returns undefined for unknown id', () => {
    expect(getConnectorDef('nonexistent_provider_xyz')).toBeUndefined();
  });
});

// ── B. Status truthfulness ────────────────────────────────────────────────

describe('Status truthfulness', () => {
  it('no connector starts as "connected" in the registry defaultStatus', () => {
    for (const conn of CONNECTOR_REGISTRY) {
      expect(conn.defaultStatus).not.toBe('connected');
    }
  });

  it('tier-1 connectors never have requires_approval or unsupported as default', () => {
    const tier1 = CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier1');
    for (const conn of tier1) {
      expect(conn.defaultStatus).not.toBe('requires_approval');
      expect(conn.defaultStatus).not.toBe('unsupported');
    }
  });
});

// ── C. Normalisation utilities ────────────────────────────────────────────

describe('stripHtml', () => {
  it('strips basic tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('Hello &amp; world &lt;3&gt;')).toBe('Hello & world <3>');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('<p>   multiple   spaces   </p>')).toBe('multiple spaces');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('handles string with no tags', () => {
    expect(stripHtml('Plain text')).toBe('Plain text');
  });
});

describe('hostFromUrl', () => {
  it('extracts hostname', () => {
    expect(hostFromUrl('https://mastodon.social')).toBe('mastodon.social');
  });

  it('returns raw string for invalid URL', () => {
    expect(hostFromUrl('not-a-url')).toBe('not-a-url');
  });
});

describe('atUriToHttps', () => {
  it('converts AT URI to bsky.app URL', () => {
    const uri = 'at://did:plc:abc123/app.bsky.feed.post/rkey456';
    const result = atUriToHttps(uri, 'alice.bsky.social');
    expect(result).toBe('https://bsky.app/profile/alice.bsky.social/post/rkey456');
  });
});

// ── D. Provider normalisation ─────────────────────────────────────────────

describe('normaliseMastodon', () => {
  it('normalises a basic status', () => {
    const status = {
      id: 'status123',
      url: 'https://mastodon.social/@alice/status123',
      content: '<p>Hello world</p>',
      created_at: '2026-01-01T12:00:00.000Z',
      account: { acct: 'alice', display_name: 'Alice Smith' },
      media_attachments: [],
    };
    const item = normaliseMastodon(status, 'https://mastodon.social');
    expect(item.provider).toBe('mastodon');
    expect(item.external_id).toBe('status123');
    expect(item.author_handle).toBe('alice@mastodon.social');
    expect(item.author_name).toBe('Alice Smith');
    expect(item.content_text).toBe('Hello world');
    expect(item.content_html).toBe('<p>Hello world</p>');
    expect(item.media).toHaveLength(0);
    expect(item.published_at).toBe('2026-01-01T12:00:00.000Z');
  });

  it('uses reblog inner status when present', () => {
    const inner = {
      id: 'inner1',
      url: 'https://mastodon.social/@bob/inner1',
      content: '<p>Boost content</p>',
      created_at: '2026-01-01T10:00:00.000Z',
      account: { acct: 'bob', display_name: 'Bob' },
      media_attachments: [],
    };
    const status = {
      id: 'boost1',
      reblog: inner,
      account: { acct: 'alice', display_name: 'Alice' },
    };
    const item = normaliseMastodon(status, 'https://mastodon.social');
    expect(item.external_id).toBe('inner1');
    expect(item.content_text).toBe('Boost content');
  });

  it('normalises media attachments', () => {
    const status = {
      id: 'media1',
      content: '',
      created_at: '2026-01-01T00:00:00.000Z',
      account: { acct: 'alice' },
      media_attachments: [
        { type: 'image', url: 'https://example.com/img.jpg', preview_url: 'https://example.com/thumb.jpg', description: 'alt text' },
      ],
    };
    const item = normaliseMastodon(status, 'https://mastodon.social');
    expect(item.media).toHaveLength(1);
    expect(item.media[0].type).toBe('image');
    expect(item.media[0].alt).toBe('alt text');
  });
});

describe('normaliseBluesky', () => {
  it('normalises a basic feed view post', () => {
    const feedItem = {
      post: {
        uri: 'at://did:plc:abc/app.bsky.feed.post/rkey1',
        cid: 'bafyrei',
        author: { handle: 'alice.bsky.social', displayName: 'Alice' },
        record: { $type: 'app.bsky.feed.post', text: 'Hello Bluesky', createdAt: '2026-01-01T12:00:00.000Z' },
        indexedAt: '2026-01-01T12:00:01.000Z',
      },
    };
    const item = normaliseBluesky(feedItem);
    expect(item.provider).toBe('bluesky');
    expect(item.external_id).toBe('at://did:plc:abc/app.bsky.feed.post/rkey1');
    expect(item.author_handle).toBe('alice.bsky.social');
    expect(item.author_name).toBe('Alice');
    expect(item.content_text).toBe('Hello Bluesky');
    expect(item.permalink).toBe('https://bsky.app/profile/alice.bsky.social/post/rkey1');
  });
});

describe('normaliseGitHub', () => {
  it('normalises a PushEvent', () => {
    const event = {
      id: 'evt1',
      type: 'PushEvent',
      actor: { login: 'alice', display_login: 'alice' },
      repo: { name: 'alice/myrepo', url: 'https://api.github.com/repos/alice/myrepo' },
      payload: { commits: [{ message: 'fix: typo' }] },
      created_at: '2026-01-01T12:00:00Z',
    };
    const item = normaliseGitHub(event);
    expect(item.provider).toBe('github');
    expect(item.external_id).toBe('evt1');
    expect(item.author_handle).toBe('alice');
    expect(item.content_text).toContain('Pushed to alice/myrepo');
    expect(item.content_text).toContain('fix: typo');
  });
});

describe('normaliseReddit', () => {
  it('normalises a post', () => {
    const post = {
      data: {
        id: 'abc123',
        title: 'My first post',
        author: 'alice',
        subreddit_name_prefixed: 'r/test',
        permalink: '/r/test/comments/abc123/my_first_post/',
        created_utc: 1704067200, // 2024-01-01 00:00:00 UTC
      },
    };
    const item = normaliseReddit(post);
    expect(item.provider).toBe('reddit');
    expect(item.external_id).toBe('abc123');
    expect(item.author_handle).toBe('u/alice');
    expect(item.content_text).toBe('My first post');
    expect(item.permalink).toBe('https://reddit.com/r/test/comments/abc123/my_first_post/');
  });
});

describe('normaliseNostr', () => {
  it('normalises a kind-1 note', () => {
    const event = {
      id: 'abc123def456',
      pubkey: '7b3a6c8f9e2d1a0b5c4e3f2a1d0e9f8c7b6a5d4e3f2c1b0a9d8e7f6c5b4a3d2e',
      kind: 1,
      content: 'Hello Nostr!',
      created_at: 1704067200,
      npub: 'npub1test',
      authorName: 'Alice',
    };
    const item = normaliseNostr(event);
    expect(item.provider).toBe('nostr');
    expect(item.external_id).toBe('abc123def456');
    expect(item.author_handle).toBe('npub1test');
    expect(item.author_name).toBe('Alice');
    expect(item.content_text).toBe('Hello Nostr!');
    expect(item.permalink).toBe('https://njump.me/abc123def456');
  });
});

describe('normaliseYouTubePlaylistItem', () => {
  it('normalises a playlist item into a video feed item', () => {
    const item = normaliseYouTubePlaylistItem({
      contentDetails: { videoId: 'abc123', videoPublishedAt: '2026-01-01T12:00:00.000Z' },
      snippet: {
        title: 'Dreamengin walkthrough',
        channelTitle: 'Dream Channel',
        thumbnails: { high: { url: 'https://img.youtube.com/vi/abc123/hqdefault.jpg' } },
      },
    }, 'history');

    expect(item.provider).toBe('youtube');
    expect(item.external_id).toBe('history:abc123');
    expect(item.permalink).toBe('https://www.youtube.com/watch?v=abc123');
    expect(item.media[0].type).toBe('video');
    expect(item.author_name).toBe('Dream Channel');
  });
});

describe('normaliseYouTubeSearchResult', () => {
  it('normalises a subscription search result', () => {
    const item = normaliseYouTubeSearchResult({
      id: { videoId: 'sub123' },
      snippet: {
        title: 'Latest build log',
        channelTitle: 'Dreamengin Dev',
        publishedAt: '2026-01-03T05:00:00.000Z',
        thumbnails: { medium: { url: 'https://i.ytimg.com/vi/sub123/mqdefault.jpg' } },
      },
    });

    expect(item.provider).toBe('youtube');
    expect(item.external_id).toBe('subs:sub123');
    expect(item.author_handle).toBe('Dreamengin Dev');
    expect(item.content_text).toBe('Latest build log');
  });
});

describe('normalisePodcast', () => {
  it('maps podcast enclosures to audio media', () => {
    const item = normalisePodcast({
      guid: 'episode-1',
      title: 'Dreamengin FM',
      link: 'https://example.com/podcast/episode-1',
      enclosure: {
        url: 'https://cdn.example.com/audio/episode-1.mp3',
        type: 'audio/mpeg',
      },
    }, 'Dreamengin FM');

    expect(item.provider).toBe('podcast');
    expect(item.media[0]).toMatchObject({
      url: 'https://cdn.example.com/audio/episode-1.mp3',
      type: 'audio',
    });
  });
});

describe('normaliseTwitter', () => {
  it('prefixes the author handle with @ for Twitter feeds', () => {
    const item = normaliseTwitter({
      guid: 'tweet-1',
      title: 'Build is green',
      link: 'https://nitter.net/dreamengin/status/1',
    }, 'dreamengin');

    expect(item.provider).toBe('twitter');
    expect(item.author_handle).toBe('@dreamengin');
    expect(item.author_name).toBe('@dreamengin');
  });
});

// ── E. Deduplication ──────────────────────────────────────────────────────

describe('deduplicateFeedItems', () => {
  it('removes duplicate (provider, external_id) pairs', () => {
    const items = [
      { provider: 'mastodon', external_id: '1', author_handle: 'a', author_name: 'A', content_text: 'x', media: [], permalink: '', published_at: '', raw: {} },
      { provider: 'mastodon', external_id: '1', author_handle: 'a', author_name: 'A', content_text: 'x', media: [], permalink: '', published_at: '', raw: {} },
      { provider: 'mastodon', external_id: '2', author_handle: 'b', author_name: 'B', content_text: 'y', media: [], permalink: '', published_at: '', raw: {} },
    ];
    const result = deduplicateFeedItems(items);
    expect(result).toHaveLength(2);
    expect(result[0].external_id).toBe('1');
    expect(result[1].external_id).toBe('2');
  });

  it('keeps items from different providers with the same external_id', () => {
    const items = [
      { provider: 'mastodon', external_id: '1', author_handle: 'a', author_name: 'A', content_text: 'x', media: [], permalink: '', published_at: '', raw: {} },
      { provider: 'bluesky',  external_id: '1', author_handle: 'b', author_name: 'B', content_text: 'y', media: [], permalink: '', published_at: '', raw: {} },
    ];
    const result = deduplicateFeedItems(items);
    expect(result).toHaveLength(2);
  });

  it('handles empty array', () => {
    expect(deduplicateFeedItems([])).toHaveLength(0);
  });
});

// ── F. Nostr pubkey validation ────────────────────────────────────────────

describe('isValidNostrPubkey', () => {
  it('accepts 64-char hex', () => {
    expect(isValidNostrPubkey('7b3a6c8f9e2d1a0b5c4e3f2a1d0e9f8c7b6a5d4e3f2c1b0a9d8e7f6c5b4a3d2e')).toBe(true);
  });

  it('accepts npub1... key with sufficient length', () => {
    expect(isValidNostrPubkey('npub1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs3nq4m')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidNostrPubkey('')).toBe(false);
  });

  it('rejects short string', () => {
    expect(isValidNostrPubkey('abc123')).toBe(false);
  });

  it('rejects npub with insufficient length', () => {
    expect(isValidNostrPubkey('npub1short')).toBe(false);
  });
});
