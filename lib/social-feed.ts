/**
 * lib/social-feed.ts
 *
 * Lightweight social feed aggregator for DREAMengin Dream Windows.
 *
 * Fetches and normalises public RSS / Atom feeds from four social sources
 * (Instagram, X / Twitter, TikTok, YouTube) into a flat SocialFeedItem[]
 * ready for rendering in a social_feed Dream Window.
 *
 * Rules:
 *  - Pure parser layer — no DB calls, no React imports
 *  - Server-safe (uses `rss-parser`)
 *  - Gracefully handles missing / malformed fields
 *
 * ARCHITECTURE.md §3 — Logic layer (lib/)
 */

import Parser from "rss-parser";

// ── Types ─────────────────────────────────────────────────────────────────

export type SocialSource = "instagram" | "x" | "tiktok" | "youtube";

export type SocialFeedItem = {
  id: string;
  source: SocialSource;
  title: string;
  link: string;
  image: string | null;
  author: string | null;
  pubDate: string | null;
  isoDate: string | null;
  description: string | null;
};

// ── Parser singleton ──────────────────────────────────────────────────────

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      ["description", "description"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

// ── HTML helpers ──────────────────────────────────────────────────────────

export function stripHtml(input?: string | null) {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ── Image extraction ──────────────────────────────────────────────────────

export function extractFirstImage(item: any): string | null {
  // 1) enclosure
  if (item.enclosure?.url) return item.enclosure.url;

  // 2) media:content
  if (Array.isArray(item.mediaContent)) {
    const mediaUrl = item.mediaContent.find((x: any) => x?.$?.url)?.$?.url;
    if (mediaUrl) return mediaUrl;
  }

  // 3) media:thumbnail
  if (Array.isArray(item.mediaThumbnail)) {
    const thumbUrl = item.mediaThumbnail.find((x: any) => x?.$?.url)?.$?.url;
    if (thumbUrl) return thumbUrl;
  }

  // 4) image inside html description/content
  const html =
    item["content:encoded"] ||
    item.contentEncoded ||
    item.content ||
    item.description ||
    "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];

  return null;
}

// ── Feed fetcher ──────────────────────────────────────────────────────────

/**
 * Fetches a public RSS / Atom feed and returns normalised SocialFeedItems.
 *
 * @param feedUrl - Full public RSS / Atom URL to fetch
 * @param source  - Which social source this feed belongs to
 * @param limit   - Maximum number of items to return (default 25)
 */
export async function fetchSocialFeed(
  feedUrl: string,
  source: SocialSource,
  limit = 25,
): Promise<SocialFeedItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const items = (feed.items ?? []).slice(0, limit);

  return items.map((raw) => {
    const a = raw as any;
    return {
      id: raw.guid ?? a.id ?? raw.link ?? String(Math.random()),
      source,
      title: raw.title ?? "",
      link: raw.link ?? feedUrl,
      image: extractFirstImage(a),
      author: raw.creator ?? a.author ?? feed.title ?? null,
      pubDate: raw.pubDate ?? null,
      isoDate: raw.isoDate ?? null,
      description:
        stripHtml(
          a.contentEncoded ??
            a["content:encoded"] ??
            raw.content ??
            a.description,
        ) || null,
    };
  });
}
