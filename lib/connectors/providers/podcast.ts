/**
 * lib/connectors/providers/podcast.ts
 *
 * Universal public RSS / Atom feed provider (Tier 1).
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { feed_url: string }
 *
 * This is the universal adapter: ANY platform that exposes a public RSS or
 * Atom feed works here — podcasts, YouTube channels, Reddit, Mastodon,
 * GitHub, Substack, Medium, Dev.to, Hacker News, news sites, blogs, etc.
 *
 * The ONLY requirement: the feed URL must be publicly accessible.
 * Private / login-protected feeds are not supported and will be rejected
 * with a clear error message telling the user to make the feed public.
 *
 * No API key or OAuth required — purely public feed URLs.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normalisePodcast } from '@/lib/connectors/normalise';
import { parseRssFeed } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface PodcastCredentials {
  /** Full RSS / Atom feed URL — must be publicly accessible */
  feed_url: string;
}

/** Basic URL validation — must be http(s). */
function isValidFeedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Maps an HTTP status code to a user-friendly error message.
 * Specifically calls out 401/403 as "feed is private" so the user knows
 * exactly what to fix.
 */
function httpErrorMessage(status: number, url: string): string {
  if (status === 401 || status === 403) {
    return (
      `This feed requires authentication (${status}). ` +
      `The feed at ${url} is private or login-protected. ` +
      `Go to the platform settings and make the feed public, then try again.`
    );
  }
  if (status === 404) {
    return `Feed not found (404). Double-check the URL: ${url}`;
  }
  if (status >= 500) {
    return `The feed server returned an error (${status}). Try again later.`;
  }
  return `Feed not accessible (${status}). Make sure the URL is correct and the feed is public.`;
}

/**
 * Verify by fetching the feed URL and checking it is:
 * 1. A valid https:// URL
 * 2. Publicly accessible (no 401/403)
 * 3. Returns a response with XML-like content (RSS/Atom)
 *
 * Returns the feed URL on success, or throws with a user-friendly message.
 */
export async function podcastVerify(creds: PodcastCredentials): Promise<string> {
  const url = (creds.feed_url ?? '').trim();
  if (!isValidFeedUrl(url)) {
    throw new Error(
      'Invalid feed URL. Must be a full https:// or http:// URL. ' +
      'Example: https://feeds.example.com/mypodcast.rss',
    );
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'DREAMengin RSS Reader (+https://dreamengin.app)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      // Only read the first chunk — we just want to confirm the feed exists
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not reach the feed URL. Check your internet connection or that the URL is correct. (${msg})`,
    );
  }

  if (!res.ok) {
    throw new Error(httpErrorMessage(res.status, url));
  }

  // Quick content-type sniff — warn if it's not XML
  const ct = res.headers.get('content-type') ?? '';
  const isXml =
    ct.includes('xml') ||
    ct.includes('rss') ||
    ct.includes('atom') ||
    ct.includes('text/plain'); // Some feeds serve as text/plain

  if (!isXml) {
    // Read a small snippet to check if it looks like XML
    const snippet = (await res.text().catch(() => '')).slice(0, 200);
    if (!snippet.includes('<rss') && !snippet.includes('<feed') && !snippet.includes('<?xml')) {
      throw new Error(
        `The URL does not appear to be an RSS or Atom feed (content-type: ${ct || 'unknown'}). ` +
        `Make sure you are using the feed URL, not the website URL. ` +
        `Most platforms have a separate /feed, /rss, or .xml URL.`,
      );
    }
  }

  return url;
}

/**
 * Fetch and normalise items from any public RSS/Atom feed.
 */
export async function podcastSync(creds: PodcastCredentials): Promise<UnifiedFeedItem[]> {
  const url = (creds.feed_url ?? '').trim();
  if (!isValidFeedUrl(url)) {
    throw new Error('Invalid feed URL.');
  }

  const rawItems = await parseRssFeed({ provider: 'podcast', feedUrl: url }, 50);

  // Re-normalise with podcast-aware normaliser so enclosures (audio/video) are typed correctly
  return rawItems.map((item) =>
    normalisePodcast(
      item.raw as Parameters<typeof normalisePodcast>[0],
      item.author_name,
    ),
  );
}

export function podcastCredentialFields() {
  return [
    {
      key: 'feed_url',
      label: 'RSS / Atom Feed URL',
      placeholder: 'https://example.com/feed.xml',
      type: 'url' as const,
      hint:
        'Paste the RSS or Atom feed URL for any platform — podcasts, YouTube channels, ' +
        'Reddit, Mastodon, GitHub, Substack, blogs, news sites, and more. ' +
        '⚠️ The feed must be publicly accessible (not behind a login). ' +
        'If connecting fails with a 401 or 403 error, go to that platform and make the feed public first.',
    },
  ];
}

