/**
 * lib/connectors/providers/pinterest.ts
 *
 * Pinterest provider (Tier 1) — public board RSS.
 *
 * Pinterest exposes RSS feeds for public boards and public profiles.
 * No API key or OAuth required — just public content.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { username: string, board?: string }
 *
 * ⚠️  YOUR PINTEREST PROFILE AND BOARDS MUST BE SET TO PUBLIC.
 *     Go to Pinterest Settings → Privacy and data → set "Profile privacy" to Public.
 *     Individual boards must also be set to Public (not Secret).
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normalisePinterest } from '@/lib/connectors/normalise';
import { parseRssFeed, pinterestRssUrl } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface PinterestCredentials {
  username: string;
  /** Optional specific board slug. If omitted, fetches all public pins. */
  board?: string;
}

/**
 * Verify that the Pinterest RSS feed is accessible.
 */
export async function pinterestVerify(creds: PinterestCredentials): Promise<string> {
  const username = (creds.username ?? '').replace(/^@/, '').trim();
  if (!username) throw new Error('Pinterest username is required.');

  const url = pinterestRssUrl(username, creds.board);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'DREAMengin RSS Reader (+https://dreamengin.app)' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not reach Pinterest RSS. (${msg})`);
  }

  if (!res.ok) {
    throw new Error(
      `Pinterest RSS not accessible (${res.status}). ` +
      `Make sure your profile and boards are set to Public. ` +
      `Go to Pinterest Settings → Privacy and data → Profile privacy → Public.`,
    );
  }
  return username;
}

/**
 * Fetch and normalise public Pinterest board/profile pins.
 */
export async function pinterestSync(creds: PinterestCredentials): Promise<UnifiedFeedItem[]> {
  const username = (creds.username ?? '').replace(/^@/, '').trim();
  const url = pinterestRssUrl(username, creds.board);
  const items = await parseRssFeed({ provider: 'pinterest', feedUrl: url }, 40);
  return items.map((item) => normalisePinterest(item.raw as Parameters<typeof normalisePinterest>[0], username));
}

export function pinterestCredentialFields() {
  return [
    {
      key: 'username',
      label: 'Pinterest Username',
      placeholder: 'yourname',
      type: 'text' as const,
      hint:
        'Your Pinterest username. ' +
        '⚠️ Your profile and boards MUST be set to Public. ' +
        'Go to Pinterest Settings → Privacy and data → Profile privacy → Public.',
    },
    {
      key: 'board',
      label: 'Board Name (optional)',
      placeholder: 'my-board-name',
      type: 'text' as const,
      hint:
        'Optional. The slug of a specific public board (e.g. "dream-home"). ' +
        'Leave blank to see all your public pins.',
    },
  ];
}
