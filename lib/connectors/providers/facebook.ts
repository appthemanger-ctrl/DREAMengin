/**
 * lib/connectors/providers/facebook.ts
 *
 * Facebook provider (Tier 1) — public Page RSS.
 *
 * Facebook exposes RSS feeds for public Pages.
 * This does NOT require OAuth or a Facebook developer account.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { page: string }  — Page ID, page username, or full Facebook page URL
 *
 * ⚠️  YOUR FACEBOOK PAGE/PROFILE MUST BE SET TO PUBLIC.
 *     Go to Facebook Page settings → Privacy → set visibility to "Public".
 *     Personal profiles with privacy set to Friends or Private are not accessible.
 *
 * Note: Facebook RSS works best for public Pages (businesses, creators, groups).
 * Personal profile RSS was deprecated — use a Page instead, or use the
 * "Any RSS Feed" connector with a third-party bridge for personal profiles.
 *
 * No API key or OAuth required.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseFacebook } from '@/lib/connectors/normalise';
import { parseRssFeed, facebookPageRssUrl } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface FacebookCredentials {
  /** Page ID, page username, or full Facebook page URL */
  page: string;
}

/** Extract a short handle from the page input for display. */
function pageHandle(page: string): string {
  if (page.includes('facebook.com/')) {
    const match = page.match(/facebook\.com\/([^/?#]+)/);
    return match?.[1] ?? page;
  }
  return page.trim().replace(/\/$/, '');
}

/**
 * Verify that the Facebook public page RSS is accessible.
 */
export async function facebookVerify(creds: FacebookCredentials): Promise<string> {
  const page = (creds.page ?? '').trim();
  if (!page) throw new Error('Facebook page ID, username, or URL is required.');

  const url = facebookPageRssUrl(page);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'DREAMengin RSS Reader (+https://dreamengin.app)' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not reach Facebook RSS feed. (${msg})`);
  }

  if (!res.ok) {
    throw new Error(
      `Facebook RSS not accessible (${res.status}). ` +
      `Make sure this is a PUBLIC Page (not a private profile). ` +
      `Go to your Facebook Page settings and set visibility to Public.`,
    );
  }
  return pageHandle(page);
}

/**
 * Fetch and normalise the public Facebook page RSS feed.
 */
export async function facebookSync(creds: FacebookCredentials): Promise<UnifiedFeedItem[]> {
  const page = (creds.page ?? '').trim();
  const url = facebookPageRssUrl(page);
  const handle = pageHandle(page);
  const items = await parseRssFeed({ provider: 'facebook', feedUrl: url }, 40);
  return items.map((item) => normaliseFacebook(item.raw as Parameters<typeof normaliseFacebook>[0], handle));
}

export function facebookCredentialFields() {
  return [
    {
      key: 'page',
      label: 'Facebook Page or Profile',
      placeholder: 'https://facebook.com/yourpage  or  yourpagename',
      type: 'text' as const,
      hint:
        'Paste your Facebook Page URL, Page username, or numeric Page ID. ' +
        '⚠️ The Page MUST be set to Public. ' +
        'Go to your Facebook Page → Settings → Privacy → set to Public. ' +
        'Personal profile RSS is limited — use a Page for best results.',
    },
  ];
}
