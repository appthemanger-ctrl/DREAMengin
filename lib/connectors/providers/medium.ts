/**
 * lib/connectors/providers/medium.ts
 *
 * Medium provider (Tier 1) — RSS-based, no OAuth required.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { username: string }
 *
 * Medium exposes public RSS feeds at: https://medium.com/feed/@username
 * No access token required for public profile feeds.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseMedium } from '@/lib/connectors/normalise';
import { parseRssFeed, mediumUserRssUrl } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface MediumCredentials {
  username: string;
}

/**
 * Verify by fetching the first page of the RSS feed.
 * If it returns at least one item, credentials are valid.
 */
export async function mediumVerify(creds: MediumCredentials): Promise<string> {
  if (!creds.username || creds.username.trim().length === 0) {
    throw new Error('Medium username is required.');
  }
  const url = mediumUserRssUrl(creds.username.trim());
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) {
    throw new Error(`Medium feed not accessible (${res.status}). Check your username.`);
  }
  return creds.username.trim();
}

/**
 * Fetch and normalise the user's Medium feed.
 */
export async function mediumSync(creds: MediumCredentials): Promise<UnifiedFeedItem[]> {
  const username = creds.username.trim();
  const url = mediumUserRssUrl(username);
  const items = await parseRssFeed({ provider: 'medium', feedUrl: url }, 40);
  // Re-normalise using our custom normaliser so author_handle is the @username
  return items.map((item) => normaliseMedium(item.raw as Parameters<typeof normaliseMedium>[0], `@${username}`));
}

export function mediumCredentialFields() {
  return [
    {
      key: 'username',
      label: 'Medium Username',
      placeholder: 'yourname',
      type: 'text' as const,
      hint: 'Your Medium username without the @ sign (e.g. "alice"). Found in your profile URL: medium.com/@alice.',
    },
  ];
}
