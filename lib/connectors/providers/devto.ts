/**
 * lib/connectors/providers/devto.ts
 *
 * Dev.to provider (Tier 1) — RSS-based, no OAuth required.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { username: string }
 *
 * Dev.to exposes public RSS feeds at: https://dev.to/feed/username
 * No access token required for public profile feeds.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseDevto } from '@/lib/connectors/normalise';
import { parseRssFeed, devtoUserRssUrl } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface DevtoCredentials {
  username: string;
}

/**
 * Verify by checking that the RSS feed is accessible.
 */
export async function devtoVerify(creds: DevtoCredentials): Promise<string> {
  if (!creds.username || creds.username.trim().length === 0) {
    throw new Error('Dev.to username is required.');
  }
  const url = devtoUserRssUrl(creds.username.trim());
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) {
    throw new Error(`Dev.to feed not accessible (${res.status}). Check your username.`);
  }
  return creds.username.trim();
}

/**
 * Fetch and normalise the user's Dev.to article feed.
 */
export async function devtoSync(creds: DevtoCredentials): Promise<UnifiedFeedItem[]> {
  const username = creds.username.trim();
  const url = devtoUserRssUrl(username);
  const items = await parseRssFeed({ provider: 'devto', feedUrl: url }, 40);
  return items.map((item) => normaliseDevto(item.raw as Parameters<typeof normaliseDevto>[0], username));
}

export function devtoCredentialFields() {
  return [
    {
      key: 'username',
      label: 'Dev.to Username',
      placeholder: 'yourname',
      type: 'text' as const,
      hint: 'Your Dev.to username (e.g. "alice"). Found in your profile URL: dev.to/alice.',
    },
  ];
}
