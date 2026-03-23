/**
 * lib/connectors/providers/substack.ts
 *
 * Substack provider (Tier 1) — RSS-based, no OAuth required.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { publication: string }
 *
 * publication may be:
 *   - A subdomain slug: "mynewsletter" → https://mynewsletter.substack.com/feed
 *   - A full URL: "https://mynewsletter.substack.com"
 *
 * No access token required — Substack RSS feeds are public.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseSubstack } from '@/lib/connectors/normalise';
import { parseRssFeed, substackRssUrl } from '@/lib/social/rss-feed';
import type { UnifiedFeedItem } from '@/types/connector';

export interface SubstackCredentials {
  /** Subdomain slug (e.g. "mynewsletter") or full publication URL */
  publication: string;
}

/** Extract the subdomain slug from a Substack URL or slug string. */
function extractSlug(publication: string): string {
  if (publication.includes('substack.com')) {
    // e.g. https://mynewsletter.substack.com/ → mynewsletter
    const match = publication.match(/https?:\/\/([^.]+)\.substack\.com/);
    return match?.[1] ?? publication;
  }
  return publication.trim();
}

/**
 * Verify by checking that the RSS feed is accessible.
 */
export async function substackVerify(creds: SubstackCredentials): Promise<string> {
  if (!creds.publication || creds.publication.trim().length === 0) {
    throw new Error('Substack publication is required (slug or URL).');
  }
  const url = substackRssUrl(creds.publication.trim());
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) {
    throw new Error(`Substack feed not accessible (${res.status}). Check the publication slug.`);
  }
  return extractSlug(creds.publication.trim());
}

/**
 * Fetch and normalise the Substack newsletter feed.
 */
export async function substackSync(creds: SubstackCredentials): Promise<UnifiedFeedItem[]> {
  const slug = extractSlug(creds.publication.trim());
  const url = substackRssUrl(creds.publication.trim());
  const items = await parseRssFeed({ provider: 'substack', feedUrl: url }, 40);
  return items.map((item) => normaliseSubstack(item.raw as Parameters<typeof normaliseSubstack>[0], slug));
}

export function substackCredentialFields() {
  return [
    {
      key: 'publication',
      label: 'Substack Publication',
      placeholder: 'mynewsletter',
      type: 'text' as const,
      hint: 'Your Substack subdomain (e.g. "mynewsletter") or full URL (e.g. "https://mynewsletter.substack.com").',
    },
  ];
}
