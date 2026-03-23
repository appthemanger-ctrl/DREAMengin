/**
 * app/api/social/rss-feed/route.ts
 *
 * GET /api/social/rss-feed
 *
 * Public RSS feed proxy. Fetches any supported public RSS/Atom feed and
 * returns normalised UnifiedFeedItem[] — no authentication required because
 * these are all public feeds.
 *
 * Supported query parameters:
 *
 *   provider (required) — one of: youtube, reddit, mastodon, github, nostr,
 *                                   medium, devto, substack, hackernews, podcast
 *
 *   Provider-specific params:
 *     youtube:    channel_id=... OR playlist_id=...
 *     reddit:     subreddit=...  OR username=...
 *     mastodon:   instance_url=...  handle=...
 *     github:     username=...
 *     nostr:      pubkey=...
 *     medium:     username=...
 *     devto:      username=...
 *     substack:   publication=... (subdomain or full URL)
 *     hackernews: feed_type=best|newest|ask|show|jobs  [username=...]
 *     podcast:    feed_url=...  (any public RSS/Atom URL)
 *
 *   limit (optional) — number of items to return (default 25, max 100)
 *
 * Responses:
 *   200  { ok: true, provider, feed_url, items: UnifiedFeedItem[] }
 *   400  { ok: false, error: '...' }
 *   502  { ok: false, error: '...' }   — upstream RSS fetch failed
 *
 * Security:
 *   - No auth required (feeds are public).
 *   - SSRF protection: only http/https URLs accepted; private IP ranges blocked.
 *   - Rate limiting is handled by Next.js edge middleware (not this route).
 *   - feed_url is validated against a blocklist of private IP ranges.
 *
 * ARCHITECTURE.md §3 — Logic layer (lib/social) used here; no direct DB writes.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  parseRssFeed,
  youtubeChannelRssUrl,
  youtubePlaylistRssUrl,
  redditSubredditRssUrl,
  redditUserRssUrl,
  mastodonUserRssUrl,
  githubUserAtomUrl,
  nostrGatewayRssUrl,
  mediumUserRssUrl,
  devtoUserRssUrl,
  substackRssUrl,
  hackerNewsRssUrl,
  hackerNewsUserRssUrl,
  podcastRssUrl,
  type RssProvider,
} from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

// ── SSRF guard ────────────────────────────────────────────────────────────

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^169\.254\./,           // link-local
  /^fc00:/i,               // IPv6 ULA
  /^fd[0-9a-f]{2}:/i,      // IPv6 ULA
  /metadata\.google\.internal/i,
  /instance-data\.ec2\.internal/i,
];

function isBlockedHost(urlStr: string): boolean {
  try {
    const { hostname, protocol } = new URL(urlStr);
    if (protocol !== 'http:' && protocol !== 'https:') return true;
    return BLOCKED_HOST_PATTERNS.some((re) => re.test(hostname));
  } catch {
    return true; // unparseable → block
  }
}

// ── Feed URL resolver ──────────────────────────────────────────────────────

function resolveFeedUrl(
  provider: RssProvider,
  params: URLSearchParams,
): { url: string; error?: string } {
  switch (provider) {
    case 'youtube': {
      const channelId = params.get('channel_id');
      const playlistId = params.get('playlist_id');
      if (!channelId && !playlistId) {
        return { url: '', error: 'youtube requires channel_id or playlist_id' };
      }
      return {
        url: playlistId
          ? youtubePlaylistRssUrl(playlistId)
          : youtubeChannelRssUrl(channelId!),
      };
    }
    case 'reddit': {
      const subreddit = params.get('subreddit');
      const username = params.get('username');
      if (!subreddit && !username) {
        return { url: '', error: 'reddit requires subreddit or username' };
      }
      return {
        url: username ? redditUserRssUrl(username) : redditSubredditRssUrl(subreddit!),
      };
    }
    case 'mastodon': {
      const instanceUrl = params.get('instance_url');
      const handle = params.get('handle');
      if (!instanceUrl || !handle) {
        return { url: '', error: 'mastodon requires instance_url and handle' };
      }
      return { url: mastodonUserRssUrl(instanceUrl, handle) };
    }
    case 'github': {
      const username = params.get('username');
      if (!username) return { url: '', error: 'github requires username' };
      return { url: githubUserAtomUrl(username) };
    }
    case 'nostr': {
      const pubkey = params.get('pubkey');
      if (!pubkey) return { url: '', error: 'nostr requires pubkey (hex or npub)' };
      return { url: nostrGatewayRssUrl(pubkey) };
    }
    case 'medium': {
      const username = params.get('username');
      if (!username) return { url: '', error: 'medium requires username' };
      return { url: mediumUserRssUrl(username) };
    }
    case 'devto': {
      const username = params.get('username');
      if (!username) return { url: '', error: 'devto requires username' };
      return { url: devtoUserRssUrl(username) };
    }
    case 'substack': {
      const publication = params.get('publication');
      if (!publication) return { url: '', error: 'substack requires publication' };
      return { url: substackRssUrl(publication) };
    }
    case 'hackernews': {
      const username = params.get('username');
      if (username) return { url: hackerNewsUserRssUrl(username) };
      const feedType = (params.get('feed_type') ?? 'best') as 'best' | 'newest' | 'ask' | 'show' | 'jobs';
      const validTypes = ['best', 'newest', 'ask', 'show', 'jobs'];
      if (!validTypes.includes(feedType)) {
        return { url: '', error: `hackernews feed_type must be one of: ${validTypes.join(', ')}` };
      }
      return { url: hackerNewsRssUrl(feedType) };
    }
    case 'podcast': {
      const feedUrl = params.get('feed_url');
      if (!feedUrl) return { url: '', error: 'podcast requires feed_url' };
      return { url: podcastRssUrl(feedUrl) };
    }
    default:
      return { url: '', error: `Unknown provider: ${provider as string}` };
  }
}

// ── Route handler ──────────────────────────────────────────────────────────

const VALID_PROVIDERS: RssProvider[] = [
  'youtube', 'reddit', 'mastodon', 'github', 'nostr',
  'medium', 'devto', 'substack', 'hackernews', 'podcast',
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const provider = searchParams.get('provider') as RssProvider | null;
  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Missing or invalid provider. Supported: ${VALID_PROVIDERS.join(', ')}`,
      },
      { status: 400 },
    );
  }

  const rawLimit = Number(searchParams.get('limit') ?? '25');
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(100, Math.floor(rawLimit)))
    : 25;

  const { url: feedUrl, error: urlError } = resolveFeedUrl(provider, searchParams);
  if (urlError || !feedUrl) {
    return NextResponse.json({ ok: false, error: urlError ?? 'Could not resolve feed URL' }, { status: 400 });
  }

  // SSRF guard — block private/internal IPs
  if (isBlockedHost(feedUrl)) {
    return NextResponse.json(
      { ok: false, error: 'Feed URL is not allowed (blocked host).' },
      { status: 400 },
    );
  }

  let items: UnifiedFeedItem[];
  try {
    items = await parseRssFeed({ provider, feedUrl }, limit);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Surface a clear public-vs-private message for auth failures
    const isAuthError = /401|403|unauthori|forbidden|private|login/i.test(message);
    return NextResponse.json(
      {
        ok: false,
        error: isAuthError
          ? `This feed is private or requires authentication. Make the feed public on the source platform, then try again. (${message})`
          : `Failed to fetch feed: ${message}`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      provider,
      feed_url: feedUrl,
      count: items.length,
      items,
    },
    {
      headers: {
        // Cache for 5 minutes — feeds don't change faster than that
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    },
  );
}
