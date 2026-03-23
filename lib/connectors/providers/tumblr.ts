/**
 * lib/connectors/providers/tumblr.ts
 *
 * Tumblr provider (Tier 1) — public blog RSS.
 *
 * Every public Tumblr blog exposes an RSS feed at:
 *   https://{username}.tumblr.com/rss
 *
 * No API key or OAuth required — purely public.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { username: string }  — Tumblr blog username or full URL
 *
 * ⚠️  YOUR TUMBLR BLOG MUST BE SET TO PUBLIC (not password-protected).
 *     Go to your blog's Settings → scroll to "Visibility" → make sure it is not
 *     set to "Password protected". Private blogs cannot be read via RSS.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseTumblr } from '@/lib/connectors/normalise';
import { parseRssFeed, tumblrRssUrl } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface TumblrCredentials {
  /** Tumblr blog username (e.g. "myblog") or full URL (e.g. "https://myblog.tumblr.com") */
  username: string;
}

/** Extract just the blog slug for display. */
function extractSlug(username: string): string {
  let slug = username.trim();
  if (slug.includes('tumblr.com')) {
    const match = slug.match(/([^/.]+)\.tumblr\.com/);
    return match?.[1] ?? slug;
  }
  return slug.replace(/^https?:\/\//, '').split('.')[0];
}

/**
 * Verify that the Tumblr RSS feed is accessible.
 */
export async function tumblrVerify(creds: TumblrCredentials): Promise<string> {
  const username = (creds.username ?? '').trim();
  if (!username) throw new Error('Tumblr username or URL is required.');

  const url = tumblrRssUrl(username);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'DREAMengin RSS Reader (+https://dreamengin.app)' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not reach Tumblr RSS. (${msg})`);
  }

  if (!res.ok) {
    throw new Error(
      `Tumblr RSS not accessible (${res.status}). ` +
      `Make sure your blog is Public (not password-protected). ` +
      `Go to your Tumblr blog Settings → Visibility → remove any password protection.`,
    );
  }
  return extractSlug(username);
}

/**
 * Fetch and normalise a public Tumblr blog RSS feed.
 */
export async function tumblrSync(creds: TumblrCredentials): Promise<UnifiedFeedItem[]> {
  const username = (creds.username ?? '').trim();
  const slug = extractSlug(username);
  const url = tumblrRssUrl(username);
  const items = await parseRssFeed({ provider: 'tumblr', feedUrl: url }, 40);
  return items.map((item) => normaliseTumblr(item.raw as Parameters<typeof normaliseTumblr>[0], slug));
}

export function tumblrCredentialFields() {
  return [
    {
      key: 'username',
      label: 'Tumblr Blog Username',
      placeholder: 'myblog  or  https://myblog.tumblr.com',
      type: 'text' as const,
      hint:
        'Your Tumblr blog username or URL (e.g. "myblog" or "https://myblog.tumblr.com"). ' +
        '⚠️ Your blog MUST be Public (not password-protected). ' +
        'Go to Tumblr blog Settings → remove password protection.',
    },
  ];
}
