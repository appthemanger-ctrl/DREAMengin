// ─── GDELT Provider ──────────────────────────────────────────────────────────
// Free. No API key required. Queries the GDELT 2.0 DOC API for recent articles
// matching theme keywords. Results are cached by the shared feed cache.
// See: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

import type { FeedItem, FeedRequest } from '../types';
import type { Provider, ProviderFetchResult } from './index';
import { sanitizeUrl, truncate } from '../sanitize';
import { sharedFetch } from './shared-fetch';
import { getTheme } from '../themes';

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const MAX_SUMMARY = 220;

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;   // YYYYMMDDTHHMMSSZ
  domain?: string;
  language?: string;
  socialimage?: string;
  sourcecountry?: string;
}

function gdeltDateToISO(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  // Format: "20240115T120000Z"
  try {
    const y = raw.slice(0, 4);
    const mo = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    const h = raw.slice(9, 11);
    const mi = raw.slice(11, 13);
    const s = raw.slice(13, 15);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export class GDELTProvider implements Provider {
  readonly id = 'gdelt';
  readonly type = 'news' as const;
  readonly supportsThemes = 'all' as const;
  readonly requiresConfig = false;

  async fetch(req: FeedRequest): Promise<ProviderFetchResult> {
    const profile = getTheme(req.theme);
    const limit = req.limit ?? 40;

    // Pick up to 3 representative keywords to build the query
    const keywords = profile.keywords.slice(0, 3).join(' OR ');

    const params = new URLSearchParams({
      query: keywords,
      mode: 'artlist',
      maxrecords: String(Math.min(limit * 2, 75)),
      timespan: '24h',
      format: 'json',
    });

    const url = `${GDELT_BASE}?${params.toString()}`;
    const res = await sharedFetch(url);
    if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);

    const json = await res.json() as { articles?: GdeltArticle[] };
    const articles = json.articles ?? [];

    const items: FeedItem[] = articles
      .filter((a) => a.url && a.title)
      .map((a): FeedItem => ({
        id: `gdelt:${Buffer.from(a.url!).toString('base64url').slice(0, 40)}`,
        source: a.domain ?? 'gdelt',
        sourceType: 'news',
        providerId: 'gdelt',
        title: a.title,
        text: truncate(a.title ?? '', MAX_SUMMARY),
        url: sanitizeUrl(a.url),
        author: { name: a.domain ?? 'GDELT' },
        media: a.socialimage ? [{ url: a.socialimage, type: 'image' }] : [],
        publishedAt: gdeltDateToISO(a.seendate),
        tags: [req.theme],
      }));

    return { items };
  }
}
