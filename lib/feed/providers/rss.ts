// ─── RSS / Atom Provider ─────────────────────────────────────────────────────
// Parses both RSS 2.0 and Atom 1.0 feeds.
// No auth required. Configured per-theme via theme profiles.

import type { FeedItem, FeedRequest } from '../types';
import type { Provider, ProviderFetchResult } from './index';
import { sanitizeUrl, htmlToText, truncate } from '../sanitize';
import { sharedFetch } from './shared-fetch';
import { getTheme } from '../themes';

const MAX_SUMMARY_CHARS = 220;

function parseDate(str: string | undefined): string {
  if (!str) return new Date().toISOString();
  try {
    return new Date(str).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractText(el: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = el.match(re);
  return m?.[1]?.trim();
}

function extractCdata(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function extractAttr(el: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]+${attr}="([^"]*)"`, 'i');
  return el.match(re)?.[1];
}

function parseRssItems(xml: string, feedUrl: string): FeedItem[] {
  const items: FeedItem[] = [];
  const source = (() => {
    const m = xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const raw = m?.[1]?.trim() ?? '';
    return extractCdata(raw) || raw || new URL(feedUrl).hostname;
  })();

  // Match <item> or <entry> blocks
  const itemPattern = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];

    // Title
    const titleRaw = extractText(block, 'title');
    const title = extractCdata(titleRaw) ?? titleRaw ?? '';
    const titleClean = htmlToText(title).trim();

    // Link (RSS <link> or Atom <link href="...">)
    const linkTag = block.match(/<link[^>]+href="([^"]+)"/i)?.[1] ??
      extractText(block, 'link');
    const url = sanitizeUrl(linkTag?.trim());

    // Published date
    const pubDate =
      extractText(block, 'pubDate') ??
      extractText(block, 'published') ??
      extractText(block, 'updated') ??
      extractText(block, 'dc:date');
    const publishedAt = parseDate(pubDate);

    // Description / summary
    const summaryRaw =
      extractText(block, 'description') ??
      extractText(block, 'summary') ??
      extractText(block, 'content') ??
      extractText(block, 'content:encoded') ?? '';
    const summaryClean = truncate(
      htmlToText(extractCdata(summaryRaw) ?? summaryRaw),
      MAX_SUMMARY_CHARS
    );

    // GUID / ID for dedupe
    const guid =
      extractText(block, 'guid') ??
      extractText(block, 'id') ??
      url ?? `${feedUrl}:${publishedAt}:${titleClean}`;

    // Media image (enclosure or media:content)
    const enclosureUrl = extractAttr(block, 'enclosure', 'url');
    const mediaContentUrl = extractAttr(block, 'media:content', 'url');
    const imageUrl = enclosureUrl || mediaContentUrl;

    // Author
    const authorRaw =
      extractText(block, 'author') ??
      extractText(block, 'dc:creator') ??
      source;
    const authorName = htmlToText(extractCdata(authorRaw) ?? authorRaw ?? '').trim() || source;

    if (!titleClean && !summaryClean) continue;

    items.push({
      id: `rss:${Buffer.from(guid).toString('base64url').slice(0, 40)}`,
      source,
      sourceType: 'news',
      providerId: 'rss',
      title: titleClean || undefined,
      text: summaryClean,
      url,
      author: { name: authorName },
      media: imageUrl
        ? [{ url: imageUrl, type: 'image' }]
        : [],
      publishedAt,
      tags: [],
    });
  }

  return items;
}

export class RSSProvider implements Provider {
  readonly id = 'rss';
  readonly type = 'news' as const;
  readonly supportsThemes = 'all' as const;
  readonly requiresConfig = false;

  async fetch(req: FeedRequest): Promise<ProviderFetchResult> {
    const profile = getTheme(req.theme);
    const feedUrls = profile.rssFeeds;
    const limit = req.limit ?? 40;

    const results = await Promise.allSettled(
      feedUrls.map(async (feedUrl) => {
        const res = await sharedFetch(feedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        return parseRssItems(xml, feedUrl);
      })
    );

    const items: FeedItem[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') items.push(...r.value);
    }

    // Dedupe by id
    const seen = new Set<string>();
    const deduped = items.filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });

    return {
      items: deduped.slice(0, limit * 2),
    };
  }
}
