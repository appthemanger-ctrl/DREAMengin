/**
 * lib/connectors/providers/twitter.ts
 *
 * Twitter / X provider (Tier 1) — public profile RSS via Nitter.
 *
 * Nitter is an open-source, privacy-respecting Twitter frontend that exposes
 * RSS feeds for any PUBLIC Twitter/X profile without requiring API access.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { username: string, nitter_instance?: string }
 *
 * ⚠️  YOUR TWITTER/X ACCOUNT MUST BE SET TO PUBLIC.
 *     Protected (private) accounts cannot be read via Nitter.
 *     Go to Settings → Privacy and safety → set "Protect your posts" OFF.
 *
 * No API key or OAuth required — Nitter reads public profile data.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseTwitter } from '@/lib/connectors/normalise';
import { parseRssFeed, twitterNitterRssUrl, DEFAULT_NITTER_INSTANCE } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface TwitterCredentials {
  username: string;
  /** Optional Nitter instance URL. Defaults to https://nitter.net */
  nitter_instance?: string;
}

/**
 * Verify by checking that the Nitter RSS feed URL is reachable.
 * The account MUST be public — protected accounts return a 404 or redirect.
 */
export async function twitterVerify(creds: TwitterCredentials): Promise<string> {
  const username = creds.username.replace(/^@/, '').trim();
  if (!username) throw new Error('Twitter/X username is required.');

  const instance = (creds.nitter_instance || DEFAULT_NITTER_INSTANCE).trim();
  const url = twitterNitterRssUrl(instance, username);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'DREAMengin RSS Reader (+https://dreamengin.app)' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not reach Nitter instance at ${instance}. ` +
      `Try a different Nitter instance or check your internet connection. (${msg})`,
    );
  }

  if (res.status === 404) {
    throw new Error(
      `Twitter/X profile @${username} not found on Nitter. ` +
      `Make sure the username is correct and your account is set to PUBLIC ` +
      `(Twitter Settings → Privacy and safety → turn off "Protect your posts").`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `Could not access @${username} on Nitter (${res.status}). ` +
      `Make sure your Twitter/X account is set to PUBLIC.`,
    );
  }
  return `@${username}`;
}

/**
 * Fetch and normalise the public Twitter/X profile feed via Nitter RSS.
 */
export async function twitterSync(creds: TwitterCredentials): Promise<UnifiedFeedItem[]> {
  const username = creds.username.replace(/^@/, '').trim();
  const instance = (creds.nitter_instance || DEFAULT_NITTER_INSTANCE).trim();
  const url = twitterNitterRssUrl(instance, username);
  const items = await parseRssFeed({ provider: 'twitter', feedUrl: url }, 40);
  return items.map((item) => normaliseTwitter(item.raw as Parameters<typeof normaliseTwitter>[0], username));
}

export function twitterCredentialFields() {
  return [
    {
      key: 'username',
      label: 'Twitter / X Username',
      placeholder: 'yourhandle',
      type: 'text' as const,
      hint:
        'Your Twitter/X username without @. ' +
        '⚠️ Your account MUST be set to Public. ' +
        'Go to Twitter/X Settings → Privacy and safety → turn off "Protect your posts".',
    },
    {
      key: 'nitter_instance',
      label: 'Nitter Instance (optional)',
      placeholder: 'https://nitter.net',
      type: 'url' as const,
      hint:
        'Optional. Nitter is a free open-source Twitter frontend. ' +
        'Leave blank to use the default (nitter.net), or enter your own instance URL.',
    },
  ];
}
