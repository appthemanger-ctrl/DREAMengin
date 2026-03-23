/**
 * lib/connectors/normalise.ts
 *
 * Phase 5 — Feed & Friends Connections
 * Feed item normalisation utilities.
 *
 * Converts provider-native API responses into the UnifiedFeedItem shape
 * so every provider's content looks the same to the rest of the system.
 *
 * Rules:
 * - Pure functions only — no side effects, no DB calls, no fetch
 * - Every function is independently unit-testable
 * - If a field is missing in the provider response, use a safe default
 *
 * ARCHITECTURE.md §3 — Logic layer (lib/)
 */

import type { UnifiedFeedItem, FeedItemMedia } from '@/types/connector';

// ── Mastodon ──────────────────────────────────────────────────────────────

interface MastodonMediaAttachment {
  type: string;
  url: string;
  preview_url?: string;
  description?: string;
}

interface MastodonStatus {
  id: string;
  url?: string;
  uri?: string;
  content?: string;
  created_at?: string;
  account?: {
    acct?: string;
    display_name?: string;
  };
  media_attachments?: MastodonMediaAttachment[];
  reblog?: MastodonStatus | null;
  text?: string;
}

export function normaliseMastodon(
  status: MastodonStatus,
  instanceUrl: string,
): UnifiedFeedItem {
  // If this is a reblog (boost), normalise the inner status
  const s = status.reblog ?? status;

  const media: FeedItemMedia[] = (s.media_attachments ?? []).map((m) => ({
    url: m.url,
    type: m.type === 'video' ? 'video' : m.type === 'audio' ? 'audio' : 'image',
    alt: m.description,
    thumbnail_url: m.preview_url,
  }));

  const plainText = stripHtml(s.content ?? '');

  return {
    provider: 'mastodon',
    external_id: s.id,
    author_handle: `${s.account?.acct ?? 'unknown'}@${hostFromUrl(instanceUrl)}`,
    author_name: s.account?.display_name ?? s.account?.acct ?? 'Unknown',
    content_text: plainText,
    content_html: s.content,
    media,
    permalink: s.url ?? s.uri ?? `${instanceUrl}/@${s.account?.acct ?? 'unknown'}/${s.id}`,
    published_at: s.created_at ?? new Date().toISOString(),
    raw: status,
  };
}

// ── Bluesky (AT Protocol) ─────────────────────────────────────────────────

interface BlueskyFeedViewPost {
  post: {
    uri: string;
    cid: string;
    author: {
      handle: string;
      displayName?: string;
    };
    record: {
      $type?: string;
      text?: string;
      createdAt?: string;
    };
    embed?: {
      $type?: string;
      images?: Array<{
        thumb?: string;
        fullsize?: string;
        alt?: string;
      }>;
      video?: {
        thumbnail?: string;
        playlist?: string;
      };
    };
    indexedAt?: string;
  };
}

export function normaliseBluesky(feedItem: BlueskyFeedViewPost): UnifiedFeedItem {
  const { post } = feedItem;
  const record = post.record ?? {};

  const media: FeedItemMedia[] = [];
  const embed = post.embed;
  if (embed) {
    if (embed.images) {
      for (const img of embed.images) {
        media.push({
          url: img.fullsize ?? img.thumb ?? '',
          type: 'image',
          alt: img.alt,
          thumbnail_url: img.thumb,
        });
      }
    }
    if (embed.video) {
      media.push({
        url: embed.video.playlist ?? '',
        type: 'video',
        thumbnail_url: embed.video.thumbnail,
      });
    }
  }

  return {
    provider: 'bluesky',
    external_id: post.uri,
    author_handle: post.author.handle,
    author_name: post.author.displayName ?? post.author.handle,
    content_text: record.text ?? '',
    media,
    permalink: atUriToHttps(post.uri, post.author.handle),
    published_at: record.createdAt ?? post.indexedAt ?? new Date().toISOString(),
    raw: feedItem,
  };
}

// ── GitHub ────────────────────────────────────────────────────────────────

interface GitHubEvent {
  id: string;
  type?: string;
  actor?: {
    login?: string;
    display_login?: string;
  };
  repo?: {
    name?: string;
    url?: string;
  };
  payload?: {
    action?: string;
    commits?: Array<{ message?: string }>;
    pull_request?: { title?: string; html_url?: string };
    issue?: { title?: string; html_url?: string };
  };
  created_at?: string;
}

export function normaliseGitHub(event: GitHubEvent): UnifiedFeedItem {
  const handle = event.actor?.login ?? 'unknown';
  const displayName = event.actor?.display_login ?? handle;
  const repoName = event.repo?.name ?? '';

  let text = `[${event.type ?? 'Event'}] on ${repoName}`;
  let permalink = `https://github.com/${repoName}`;

  if (event.payload) {
    const p = event.payload;
    if (event.type === 'PushEvent') {
      const msg = p.commits?.[0]?.message ?? '';
      text = `Pushed to ${repoName}${msg ? `: ${msg}` : ''}`;
    } else if (event.type === 'PullRequestEvent' && p.pull_request) {
      text = `${p.action ?? 'Updated'} PR: ${p.pull_request.title ?? ''}`;
      permalink = p.pull_request.html_url ?? permalink;
    } else if (event.type === 'IssuesEvent' && p.issue) {
      text = `${p.action ?? 'Updated'} issue: ${p.issue.title ?? ''}`;
      permalink = p.issue.html_url ?? permalink;
    }
  }

  return {
    provider: 'github',
    external_id: event.id,
    author_handle: handle,
    author_name: displayName,
    content_text: text,
    media: [],
    permalink,
    published_at: event.created_at ?? new Date().toISOString(),
    raw: event,
  };
}

// ── Reddit ────────────────────────────────────────────────────────────────

interface RedditPost {
  data: {
    id: string;
    name?: string;
    title?: string;
    selftext?: string;
    url?: string;
    permalink?: string;
    author?: string;
    subreddit_name_prefixed?: string;
    thumbnail?: string;
    post_hint?: string;
    created_utc?: number;
  };
}

export function normaliseReddit(post: RedditPost): UnifiedFeedItem {
  const d = post.data;
  const handle = d.author ?? 'unknown';
  const sub = d.subreddit_name_prefixed ?? 'r/unknown';

  const media: FeedItemMedia[] = [];
  if (d.thumbnail && d.thumbnail !== 'self' && d.thumbnail !== 'nsfw' && d.thumbnail !== 'default') {
    media.push({
      url: d.thumbnail,
      type: d.post_hint === 'video' ? 'video' : 'image',
    });
  }

  return {
    provider: 'reddit',
    external_id: d.id,
    author_handle: `u/${handle}`,
    author_name: handle,
    content_text: d.title ?? d.selftext ?? '',
    media,
    permalink: d.permalink
      ? `https://reddit.com${d.permalink}`
      : d.url ?? `https://reddit.com/${d.name ?? ''}`,
    published_at: d.created_utc
      ? new Date(d.created_utc * 1000).toISOString()
      : new Date().toISOString(),
    raw: post,
  };
}

// ── Nostr ─────────────────────────────────────────────────────────────────

interface NostrEvent {
  id: string;
  pubkey: string;
  kind: number;
  content?: string;
  created_at?: number;
  tags?: string[][];
  /** Resolved display name from kind-0 profile (caller provides) */
  authorName?: string;
  /** Resolved NIP-19 npub (caller provides) */
  npub?: string;
}

export function normaliseNostr(event: NostrEvent): UnifiedFeedItem {
  const handle = event.npub ?? event.pubkey.slice(0, 16);
  const created = event.created_at
    ? new Date(event.created_at * 1000).toISOString()
    : new Date().toISOString();

  return {
    provider: 'nostr',
    external_id: event.id,
    author_handle: handle,
    author_name: event.authorName ?? handle,
    content_text: event.content ?? '',
    media: [],
    permalink: `https://njump.me/${event.id}`,
    published_at: created,
    raw: event,
  };
}

// ── Medium ────────────────────────────────────────────────────────────────

export interface MediumRssItem {
  guid?: string;
  link?: string;
  title?: string;
  /** HTML content (content:encoded) */
  contentEncoded?: string;
  content?: string;
  description?: string;
  isoDate?: string;
  pubDate?: string;
  author?: string;
  creator?: string;
}

export function normaliseMedium(item: MediumRssItem, authorHandle: string): UnifiedFeedItem {
  const id = item.guid ?? item.link ?? String(Math.random());
  const rawHtml = item.contentEncoded ?? item.content ?? item.description ?? '';
  const text = stripHtml(rawHtml) || stripHtml(item.title ?? '');

  const imgMatch = rawHtml.match(/<img[^>]+src="([^"]+)"/i);
  const media: FeedItemMedia[] = imgMatch?.[1]
    ? [{ url: imgMatch[1], type: 'image' }]
    : [];

  return {
    provider: 'medium',
    external_id: id,
    author_handle: authorHandle,
    author_name: item.author ?? item.creator ?? authorHandle,
    content_text: text,
    content_html: rawHtml || undefined,
    media,
    permalink: item.link ?? `https://medium.com`,
    published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    raw: item,
  };
}

// ── Dev.to ────────────────────────────────────────────────────────────────

export interface DevtoRssItem {
  guid?: string;
  link?: string;
  title?: string;
  contentEncoded?: string;
  content?: string;
  description?: string;
  isoDate?: string;
  pubDate?: string;
  author?: string;
  creator?: string;
}

export function normaliseDevto(item: DevtoRssItem, authorHandle: string): UnifiedFeedItem {
  const id = item.guid ?? item.link ?? String(Math.random());
  const rawHtml = item.contentEncoded ?? item.content ?? item.description ?? '';
  const text = stripHtml(rawHtml) || stripHtml(item.title ?? '');

  const imgMatch = rawHtml.match(/<img[^>]+src="([^"]+)"/i);
  const media: FeedItemMedia[] = imgMatch?.[1]
    ? [{ url: imgMatch[1], type: 'image' }]
    : [];

  return {
    provider: 'devto',
    external_id: id,
    author_handle: authorHandle,
    author_name: item.author ?? item.creator ?? authorHandle,
    content_text: text,
    content_html: rawHtml || undefined,
    media,
    permalink: item.link ?? `https://dev.to`,
    published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    raw: item,
  };
}

// ── Substack ──────────────────────────────────────────────────────────────

export interface SubstackRssItem {
  guid?: string;
  link?: string;
  title?: string;
  contentEncoded?: string;
  content?: string;
  description?: string;
  isoDate?: string;
  pubDate?: string;
  author?: string;
  creator?: string;
}

export function normaliseSubstack(item: SubstackRssItem, publicationSlug: string): UnifiedFeedItem {
  const id = item.guid ?? item.link ?? String(Math.random());
  const rawHtml = item.contentEncoded ?? item.content ?? item.description ?? '';
  const text = stripHtml(rawHtml) || stripHtml(item.title ?? '');

  const imgMatch = rawHtml.match(/<img[^>]+src="([^"]+)"/i);
  const media: FeedItemMedia[] = imgMatch?.[1]
    ? [{ url: imgMatch[1], type: 'image' }]
    : [];

  return {
    provider: 'substack',
    external_id: id,
    author_handle: publicationSlug,
    author_name: item.author ?? item.creator ?? publicationSlug,
    content_text: text,
    content_html: rawHtml || undefined,
    media,
    permalink: item.link ?? `https://${publicationSlug}.substack.com`,
    published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    raw: item,
  };
}

// ── Hacker News ───────────────────────────────────────────────────────────

export interface HackerNewsRssItem {
  guid?: string;
  link?: string;
  title?: string;
  content?: string;
  contentSnippet?: string;
  description?: string;
  isoDate?: string;
  pubDate?: string;
  author?: string;
  creator?: string;
  comments?: string;
}

export function normaliseHackerNews(item: HackerNewsRssItem): UnifiedFeedItem {
  const id = item.guid ?? item.link ?? String(Math.random());
  const handle = item.author ?? item.creator ?? 'hn';

  return {
    provider: 'hackernews',
    external_id: id,
    author_handle: handle,
    author_name: handle,
    content_text: item.title ?? item.contentSnippet ?? '',
    media: [],
    permalink: item.link ?? item.comments ?? `https://news.ycombinator.com`,
    published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    raw: item,
  };
}

// ── Podcast / Generic RSS ─────────────────────────────────────────────────

export interface PodcastRssItem {
  guid?: string;
  link?: string;
  title?: string;
  contentEncoded?: string;
  content?: string;
  contentSnippet?: string;
  description?: string;
  isoDate?: string;
  pubDate?: string;
  author?: string;
  creator?: string;
  enclosure?: { url?: string; type?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itunes?: Record<string, any>;
}

export function normalisePodcast(item: PodcastRssItem, feedTitle: string): UnifiedFeedItem {
  const id = item.guid ?? item.link ?? String(Math.random());
  const handle = item.author ?? item.creator ?? feedTitle;
  const rawHtml = item.contentEncoded ?? item.content ?? item.description ?? '';
  const text = stripHtml(rawHtml) || stripHtml(item.contentSnippet ?? '') || stripHtml(item.title ?? '');

  const media: FeedItemMedia[] = [];
  if (item.enclosure?.url) {
    const isAudio = /audio/i.test(item.enclosure.type ?? '');
    const isVideo = /video/i.test(item.enclosure.type ?? '');
    media.push({
      url: item.enclosure.url,
      type: isVideo ? 'video' : isAudio ? 'audio' : 'audio',
    });
  }

  const thumbnail: string | undefined = item.itunes?.image;
  if (thumbnail && media.length > 0) {
    media[0].thumbnail_url = thumbnail;
  }

  return {
    provider: 'podcast',
    external_id: id,
    author_handle: handle,
    author_name: handle,
    content_text: text,
    content_html: rawHtml || undefined,
    media,
    permalink: item.link ?? '',
    published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    raw: item,
  };
}

// ── Dedup helper ──────────────────────────────────────────────────────────

/**
 * Deduplicates a list of UnifiedFeedItems by (provider, external_id).
 * The first occurrence wins; duplicates are dropped.
 */
export function deduplicateFeedItems(items: UnifiedFeedItem[]): UnifiedFeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.provider}:${item.external_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────

/** Strip HTML tags from a string, returning plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract hostname from a URL, falling back to the raw string on failure. */
export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Convert an AT Protocol URI (at://did:plc:.../app.bsky.feed.post/...) to an https URL. */
export function atUriToHttps(atUri: string, handle: string): string {
  // at://did:plc:xxx/app.bsky.feed.post/yyy → https://bsky.app/profile/{handle}/post/yyy
  const parts = atUri.split('/');
  const rkey = parts[parts.length - 1];
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

// ── YouTube ───────────────────────────────────────────────────────────────

type ThumbnailMap = Record<string, { url?: string }>;

export interface YouTubePlaylistItem {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    videoOwnerChannelTitle?: string;
    thumbnails?: ThumbnailMap;
    resourceId?: {
      videoId?: string;
    };
  };
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
}

export interface YouTubeSearchItem {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: ThumbnailMap;
  };
}

function bestYouTubeThumb(thumbnails?: ThumbnailMap): string | undefined {
  if (!thumbnails) return undefined;
  return thumbnails.maxres?.url
    ?? thumbnails.standard?.url
    ?? thumbnails.high?.url
    ?? thumbnails.medium?.url
    ?? thumbnails.default?.url;
}

export function normaliseYouTubePlaylistItem(
  item: YouTubePlaylistItem,
  source: 'history' | 'watch_later',
): UnifiedFeedItem {
  const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? item.id ?? '';
  const title = item.snippet?.title ?? 'Untitled video';
  const channelTitle = item.snippet?.videoOwnerChannelTitle ?? item.snippet?.channelTitle ?? 'YouTube';
  const permalink = videoId ? `https://www.youtube.com/watch?v=${videoId}` : 'https://www.youtube.com';
  const thumbnail = bestYouTubeThumb(item.snippet?.thumbnails);

  const media: FeedItemMedia[] = videoId
    ? [{
        url: permalink,
        type: 'video',
        thumbnail_url: thumbnail,
        alt: title,
      }]
    : [];

  return {
    provider: 'youtube',
    external_id: `${source}:${videoId || title}`,
    author_handle: channelTitle,
    author_name: channelTitle,
    content_text: title,
    media,
    permalink,
    published_at:
      item.snippet?.publishedAt
      ?? item.contentDetails?.videoPublishedAt
      ?? new Date().toISOString(),
    raw: item,
  };
}

export function normaliseYouTubeSearchResult(item: YouTubeSearchItem): UnifiedFeedItem {
  const videoId = item.id?.videoId ?? '';
  const title = item.snippet?.title ?? 'Untitled video';
  const channelTitle = item.snippet?.channelTitle ?? 'YouTube';
  const permalink = videoId ? `https://www.youtube.com/watch?v=${videoId}` : 'https://www.youtube.com';
  const thumbnail = bestYouTubeThumb(item.snippet?.thumbnails);

  const media: FeedItemMedia[] = videoId
    ? [{
        url: permalink,
        type: 'video',
        thumbnail_url: thumbnail,
        alt: title,
      }]
    : [];

  return {
    provider: 'youtube',
    external_id: `subs:${videoId || title}`,
    author_handle: channelTitle,
    author_name: channelTitle,
    content_text: title,
    media,
    permalink,
    published_at: item.snippet?.publishedAt ?? new Date().toISOString(),
    raw: item,
  };
}
