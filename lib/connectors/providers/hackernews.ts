/**
 * lib/connectors/providers/hackernews.ts
 *
 * Hacker News provider (Tier 1) — RSS-based via hnrss.org, no auth required.
 *
 * Credentials (stored in connector_accounts.token_blob):
 *   { feed_type: 'best' | 'newest' | 'ask' | 'show' | 'jobs', username?: string }
 *
 * If username is provided, fetches that user's submissions.
 * Otherwise fetches the selected curated feed (default: 'best').
 *
 * No API key required — hnrss.org is a free public RSS bridge for HN.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseHackerNews } from '@/lib/connectors/normalise';
import {
  parseRssFeed,
  hackerNewsRssUrl,
  hackerNewsUserRssUrl,
} from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export type HNFeedType = 'best' | 'newest' | 'ask' | 'show' | 'jobs';

export interface HackerNewsCredentials {
  feed_type?: HNFeedType;
  username?: string;
}

/**
 * Verify by checking hnrss.org is reachable.
 */
export async function hackernewsVerify(creds: HackerNewsCredentials): Promise<string> {
  const url = creds.username
    ? hackerNewsUserRssUrl(creds.username.trim())
    : hackerNewsRssUrl(creds.feed_type ?? 'best');
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) {
    throw new Error(`Hacker News feed not accessible (${res.status}).`);
  }
  return creds.username ? `user:${creds.username}` : (creds.feed_type ?? 'best');
}

/**
 * Fetch and normalise HN items.
 */
export async function hackernewsSync(creds: HackerNewsCredentials): Promise<UnifiedFeedItem[]> {
  const url = creds.username
    ? hackerNewsUserRssUrl(creds.username.trim())
    : hackerNewsRssUrl(creds.feed_type ?? 'best');

  const items = await parseRssFeed({ provider: 'hackernews', feedUrl: url }, 40);
  return items.map((item) => normaliseHackerNews(item.raw as Parameters<typeof normaliseHackerNews>[0]));
}

export function hackernewsCredentialFields() {
  return [
    {
      key: 'feed_type',
      label: 'Feed Type',
      placeholder: 'best',
      type: 'text' as const,
      hint: 'Choose from: best, newest, ask, show, or jobs. Default: best.',
    },
    {
      key: 'username',
      label: 'HN Username (optional)',
      placeholder: 'pg',
      type: 'text' as const,
      hint: 'Optional. Your HN username to see your own submissions instead of a curated feed.',
    },
  ];
}
