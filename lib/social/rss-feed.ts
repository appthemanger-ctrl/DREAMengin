/**
 * lib/social/rss-feed.ts
 *
 * RSS / Atom feed parser for DREAMengin's social connector system.
 *
 * Many platforms expose public RSS/Atom feeds without OAuth:
 *   - YouTube  → channel, playlist, and search feeds
 *   - Reddit   → subreddit and user feeds
 *   - Mastodon → per-user public feed
 *   - GitHub   → per-user public activity (Atom)
 *   - Nostr    → public gateway feeds (e.g. njump.me)
 *   - Medium   → user profile feed
 *   - Dev.to   → user article feed
 *   - Substack → newsletter feed
 *   - Hacker News → stories via hnrss.org
 *   - Twitter/X   → unofficial via Nitter RSS instance
 *   - ANY platform with a public RSS/Atom URL
 *
 * ⚠️  PUBLIC FEEDS ONLY — The feed URL must be publicly accessible.
 *     Private or login-protected feeds are not supported and will fail
 *     with a 401 or 403.  Tell users: "Make sure your feed is public."
 *
 * All parsed items are normalised into UnifiedFeedItem so they flow into the
 * same feed_items table and display logic as OAuth-sourced items.
 *
 * Rules:
 * - Pure parser layer — no DB calls, no React imports
 * - Server-safe (uses `rss-parser` — not a browser lib)
 * - Gracefully handles missing / malformed fields
 *
 * ARCHITECTURE.md §3 — Logic layer (lib/)
 */

import Parser from 'rss-parser';
import type { UnifiedFeedItem, FeedItemMedia } from '@/types/connector';

// ── Custom field map ──────────────────────────────────────────────────────

/**
 * rss-parser custom fields we care about for image extraction.
 * `keepArray: true` preserves multi-value elements (e.g. multiple media:content tags).
 */
const RSS_CUSTOM_FIELDS = {
  item: [
    ['media:content', 'mediaContent', { keepArray: true }],
    ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
    ['media:group', 'mediaGroup'],
    ['content:encoded', 'contentEncoded'],
    ['description', 'description'],
  ],
};

// ── Provider types ────────────────────────────────────────────────────────

/**
 * Providers that expose public RSS / Atom feeds DREAMengin can parse without
 * requiring an OAuth access token.  All map to existing ConnectorDef.id values.
 */
export type RssProvider =
  | 'youtube'
  | 'reddit'
  | 'mastodon'
  | 'github'
  | 'nostr'
  | 'medium'
  | 'devto'
  | 'substack'
  | 'hackernews'
  | 'podcast'
  | 'twitter';

// ── Feed config ───────────────────────────────────────────────────────────

export interface RssFeedConfig {
  /** Provider slug — matches ConnectorDef.id */
  provider: RssProvider;
  /** Full RSS / Atom URL to fetch */
  feedUrl: string;
  /**
   * Optional override for the author handle shown in the normalised item.
   * When omitted the parser uses the feed's <author> / <dc:creator> field.
   */
  authorHandle?: string;
  /**
   * Optional override for the author display name.
   * When omitted the parser uses the feed channel title.
   */
  authorName?: string;
}

// ── Provider URL builders ─────────────────────────────────────────────────

/**
 * Returns the public RSS feed URL for a YouTube channel.
 * No API key required — this feed is always public.
 */
export function youtubeChannelRssUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

/**
 * Returns the public RSS feed URL for a YouTube playlist.
 */
export function youtubePlaylistRssUrl(playlistId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
}

/**
 * Returns the public RSS feed URL for a subreddit.
 * Accepts names with or without the "r/" prefix.
 */
export function redditSubredditRssUrl(subreddit: string): string {
  const name = subreddit.replace(/^r\//, '');
  return `https://www.reddit.com/r/${encodeURIComponent(name)}/.rss?limit=25`;
}

/**
 * Returns the public RSS feed URL for a Reddit user's submitted posts.
 * Accepts names with or without the "u/" prefix.
 */
export function redditUserRssUrl(username: string): string {
  const name = username.replace(/^u\//, '');
  return `https://www.reddit.com/user/${encodeURIComponent(name)}/submitted/.rss?limit=25`;
}

/**
 * Returns the public RSS feed URL for a Mastodon user.
 *
 * @param instanceUrl - full instance URL, e.g. "https://mastodon.social"
 * @param handle      - local handle without the @instance suffix, e.g. "alice"
 */
export function mastodonUserRssUrl(instanceUrl: string, handle: string): string {
  const base = instanceUrl.replace(/\/$/, '');
  const localHandle = handle.replace(/^@/, '').split('@')[0];
  return `${base}/@${localHandle}.rss`;
}

/**
 * Returns the public Atom feed URL for a GitHub user's activity.
 */
export function githubUserAtomUrl(username: string): string {
  return `https://github.com/${encodeURIComponent(username)}.atom`;
}

/**
 * Returns the RSS feed URL for a Nostr public key via the njump.me gateway.
 * npub or hex pubkey are both accepted.
 */
export function nostrGatewayRssUrl(pubkeyOrNpub: string): string {
  return `https://njump.me/${encodeURIComponent(pubkeyOrNpub)}/rss`;
}

/**
 * Returns the RSS feed URL for a Medium user or publication.
 * Accepts a username (e.g. "alice") or a publication slug.
 * For custom domains use the full URL form: https://pub.medium.com/feed
 */
export function mediumUserRssUrl(username: string): string {
  const name = username.replace(/^@/, '');
  return `https://medium.com/feed/@${encodeURIComponent(name)}`;
}

/**
 * Returns the RSS feed URL for a Dev.to user.
 * https://dev.to/feed/username
 */
export function devtoUserRssUrl(username: string): string {
  return `https://dev.to/feed/${encodeURIComponent(username)}`;
}

/**
 * Returns the RSS feed URL for a Substack newsletter.
 * Accepts either a full subdomain URL (e.g. "https://mynewsletter.substack.com")
 * or just the subdomain slug (e.g. "mynewsletter").
 */
export function substackRssUrl(subdomainOrUrl: string): string {
  if (subdomainOrUrl.startsWith('http')) {
    const base = subdomainOrUrl.replace(/\/$/, '');
    return `${base}/feed`;
  }
  return `https://${encodeURIComponent(subdomainOrUrl)}.substack.com/feed`;
}

/**
 * Returns the RSS feed URL for Hacker News stories.
 * @param type - 'newest' | 'best' | 'ask' | 'show' | 'jobs' (default: 'best')
 */
export function hackerNewsRssUrl(type: 'newest' | 'best' | 'ask' | 'show' | 'jobs' = 'best'): string {
  const map = {
    newest: 'https://hnrss.org/newest',
    best: 'https://hnrss.org/best',
    ask: 'https://hnrss.org/ask',
    show: 'https://hnrss.org/show',
    jobs: 'https://hnrss.org/jobs',
  };
  return map[type];
}

/**
 * Returns the RSS feed URL for a Hacker News user's submissions.
 */
export function hackerNewsUserRssUrl(username: string): string {
  return `https://hnrss.org/submitted?id=${encodeURIComponent(username)}`;
}

/**
 * Returns a Twitter / X feed via a Nitter instance RSS.
 * Requires a configured Nitter instance URL — NOT official Twitter API.
 * Marked as optional / unofficial.
 *
 * @param nitterInstance - e.g. "https://nitter.net"
 * @param username       - Twitter handle without @
 */
export function twitterNitterRssUrl(nitterInstance: string, username: string): string {
  const base = nitterInstance.replace(/\/$/, '');
  return `${base}/${encodeURIComponent(username)}/rss`;
}

/**
 * Returns the given podcast / generic RSS feed URL unchanged.
 * This is a passthrough — the user provides the full URL.
 */
export function podcastRssUrl(feedUrl: string): string {
  return feedUrl;
}

// ── Core parser ───────────────────────────────────────────────────────────

// Lazily-created singleton; each call shares the same Parser instance.
let _parser: Parser | null = null;

function getParser(): Parser {
  if (!_parser) {
    _parser = new Parser({
      customFields: RSS_CUSTOM_FIELDS,
      timeout: 10_000,
      headers: {
        'User-Agent': 'DREAMengin RSS Reader (+https://dreamengin.app)',
      },
    });
  }
  return _parser;
}

/**
 * Fetches and parses an RSS/Atom feed, returning an array of normalised
 * UnifiedFeedItems ready to upsert into feed_items.
 *
 * Works with ANY platform that exposes a public RSS or Atom feed — YouTube
 * channels, Reddit, Mastodon, GitHub, Substack, Medium, Dev.to, Hacker News,
 * Twitter via Nitter, podcasts, blogs, and more.
 *
 * ⚠️  The feed URL MUST be publicly accessible (no login required).
 *     Private feeds will throw an error with status 401 or 403.
 *     Tell users: go to the platform settings and make the feed public first.
 *
 * Throws on network failure, auth failure, or unparseable XML — callers
 * should catch and surface the error message to the user.
 *
 * @param config  - Feed config including provider slug and URL
 * @param limit   - Maximum number of items to return (default 50)
 */
export async function parseRssFeed(
  config: RssFeedConfig,
  limit = 50,
): Promise<UnifiedFeedItem[]> {
  const p = getParser();
  const feed = await p.parseURL(config.feedUrl);

  const channelTitle = feed.title ?? config.authorName ?? config.provider;
  const items = (feed.items ?? []).slice(0, limit);

  return items.map((item) => normaliseRssItem(item, config, channelTitle));
}

// ── Item normaliser ───────────────────────────────────────────────────────

/**
 * Normalises a single rss-parser output item into UnifiedFeedItem.
 *
 * @param item         - Raw item from rss-parser
 * @param config       - Feed config (provider + optional author overrides)
 * @param channelTitle - Feed-level channel/show title (from feed.title)
 */
export function normaliseRssItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
  config: RssFeedConfig,
  channelTitle: string,
): UnifiedFeedItem {
  const externalId = item.guid ?? item.id ?? item.link ?? String(Math.random());
  const pubDate: string =
    item.isoDate ?? item.pubDate ?? new Date().toISOString();

  const rawAuthor: string =
    item.author ?? item['dc:creator'] ?? item.creator ?? channelTitle;

  const authorHandle = config.authorHandle ?? rawAuthor;
  const authorName = config.authorName ?? rawAuthor;

  const rawText =
    item.contentEncoded ?? item['content:encoded'] ?? item.content ?? item.description ?? '';

  const contentText = stripHtml(rawText) || stripHtml(item.title ?? '') || '';
  const contentHtml = rawText || undefined;

  const image = extractFirstImage(item);
  const media: FeedItemMedia[] = image
    ? [{ url: image, type: guessMediaType(config.provider, image) }]
    : [];

  const permalink: string = item.link ?? config.feedUrl;

  return {
    provider: config.provider,
    external_id: externalId,
    author_handle: authorHandle,
    author_name: authorName,
    content_text: contentText,
    content_html: contentHtml,
    media,
    permalink,
    published_at: toIso(pubDate),
    raw: item,
  };
}

// ── Image extraction ──────────────────────────────────────────────────────

/**
 * Extracts the first usable image URL from an rss-parser item.
 *
 * Strategy (in order of preference):
 *  1. enclosure (podcasts / video RSS)
 *  2. media:content[url]
 *  3. media:thumbnail[url]
 *  4. media:group → media:thumbnail[url]
 *  5. <img src> inside content:encoded / description HTML
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractFirstImage(item: any): string | null {
  // 1) enclosure
  if (item.enclosure?.url && isImageLike(item.enclosure.url)) {
    return item.enclosure.url;
  }

  // 2) media:content (array)
  if (Array.isArray(item.mediaContent)) {
    const url = item.mediaContent.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (x: any) => x?.$?.url && isImageLike(x.$?.url),
    )?.$?.url;
    if (url) return url;
    // Fall back to any url even if it's a video (still usable as thumbnail)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyUrl = item.mediaContent.find((x: any) => x?.$?.url)?.$?.url;
    if (anyUrl) return anyUrl;
  }

  // 3) media:thumbnail (array)
  if (Array.isArray(item.mediaThumbnail)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const url = item.mediaThumbnail.find((x: any) => x?.$?.url)?.$?.url;
    if (url) return url;
  }

  // 4) media:group → media:thumbnail
  if (item.mediaGroup) {
    const group = item.mediaGroup;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumb = Array.isArray(group['media:thumbnail'])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? group['media:thumbnail'].find((x: any) => x?.$?.url)?.$?.url
      : group['media:thumbnail']?.$?.url;
    if (thumb) return thumb;
  }

  // 5) <img src> inside HTML
  const html: string =
    item.contentEncoded ??
    item['content:encoded'] ??
    item.content ??
    item.description ??
    '';
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  if (match?.[1]) return match[1];

  return null;
}

// ── Internal helpers ──────────────────────────────────────────────────────

/**
 * Strips HTML tags and decodes common HTML entities, returning plain text.
 * Also collapses excessive whitespace.
 */
export function stripHtml(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns true if the URL looks like an image (common extensions or known CDN paths). */
function isImageLike(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(url);
}

/** Heuristic: guess FeedItemMedia type from provider + URL. */
function guessMediaType(
  provider: RssProvider,
  url: string,
): FeedItemMedia['type'] {
  if (provider === 'youtube') return 'video';
  if (/\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url)) return 'video';
  if (/\.(mp3|ogg|flac|aac|wav)(\?|$)/i.test(url)) return 'audio';
  return 'image';
}

/** Convert any date string to ISO 8601, falling back to now on parse failure. */
function toIso(raw: string): string {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
