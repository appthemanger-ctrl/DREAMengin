#!/usr/bin/env node
/**
 * scripts/update-embed-feed.mjs
 *
 * GitHub Actions embed-feed update script for DREAMengin.
 *
 * Fetches the latest YouTube videos (and optionally Instagram posts) using
 * server-side API keys, applies an algorithm filter, then writes baked
 * embed-code output to public/feeds/embed-feed.json.
 *
 * The workflow (update-embed-feed.yml) commits the result back to the repo so
 * the site always serves fresh embeds without a live API call on every request.
 *
 * Algorithm filters (configurable via env vars or CLI flags):
 *   FEED_MIN_VIEW_COUNT  — skip videos with fewer views than this (default: 0)
 *   FEED_REQUIRED_TAGS   — comma-separated tags; a video must match at least one
 *                          (default: empty — no tag filter)
 *   FEED_MAX_ITEMS       — maximum embed items to keep (default: 20)
 *   FEED_SOURCES         — comma-separated: youtube,instagram (default: youtube)
 *   YOUTUBE_API_KEY      — YouTube Data API v3 key (required for YouTube source)
 *   INSTAGRAM_ACCESS_TOKEN — Instagram Basic Display API token (optional)
 *
 * Architecture justification: render-on-demand / static bake pattern from
 * docs/ARCHITECTURE.md §10 — heavy API work happens in CI, not on each request.
 *
 * Performance impact: reduces per-request latency; eliminates live social API
 * calls from the production runtime.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT   = join(__dirname, '..');
const OUTPUT_PATH = join(REPO_ROOT, 'public', 'feeds', 'embed-feed.json');

// ── Config from environment / CLI ─────────────────────────────────────────────

const MIN_VIEW_COUNT   = parseInt(process.env.FEED_MIN_VIEW_COUNT  ?? '0',  10);
const MAX_ITEMS        = parseInt(process.env.FEED_MAX_ITEMS        ?? '20', 10);
const REQUIRED_TAGS    = (process.env.FEED_REQUIRED_TAGS ?? '')
  .split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
const SOURCES          = (process.env.FEED_SOURCES ?? 'youtube')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const YOUTUBE_API_KEY  = process.env.YOUTUBE_API_KEY  ?? '';
const IG_ACCESS_TOKEN  = process.env.INSTAGRAM_ACCESS_TOKEN ?? '';

const YT_API = 'https://www.googleapis.com/youtube/v3';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A single embed item — provider-agnostic shape written to embed-feed.json.
 * @property {string}   id          — stable external ID (videoId, media id, …)
 * @property {string}   provider    — 'youtube' | 'instagram'
 * @property {string}   title       — human-readable title / caption
 * @property {string}   permalink   — link to original post
 * @property {string}   published_at — ISO timestamp
 * @property {number}   view_count  — platform view / play count (0 if unavailable)
 * @property {string[]} tags        — normalised lower-case tags / hashtags
 * @property {string}   embed_html  — ready-to-use iframe / blockquote embed code
 * @property {string}   thumbnail_url — preview image URL (may be empty)
 * @property {string}   channel_title — author / channel name
 */

// ── YouTube ───────────────────────────────────────────────────────────────────

/**
 * Fetches up to `maxResults` videos from the YouTube Data API v3.
 * Uses the mostPopular chart (public data — no OAuth required).
 * Also fetches the `statistics` part so we can apply the view-count filter.
 */
async function fetchYouTubeVideos(apiKey, maxResults = 50) {
  const url =
    `${YT_API}/videos` +
    `?part=snippet,statistics` +
    `&chart=mostPopular` +
    `&maxResults=${maxResults}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.items ?? [];
}

/** Maps a raw YouTube video object → EmbedItem. */
function normaliseYouTubeItem(item) {
  const id          = item.id ?? '';
  const snippet     = item.snippet ?? {};
  const statistics  = item.statistics ?? {};
  const viewCount   = parseInt(statistics.viewCount ?? '0', 10);
  const tags        = (snippet.tags ?? []).map(t => t.toLowerCase());
  const title       = snippet.title ?? '';
  const channelTitle = snippet.channelTitle ?? '';
  const publishedAt  = snippet.publishedAt ?? new Date().toISOString();
  const thumbnail    = snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? '';
  const permalink    = `https://www.youtube.com/watch?v=${id}`;

  const embedHtml =
    `<iframe width="560" height="315" ` +
    `src="https://www.youtube.com/embed/${id}" ` +
    `title="${title.replace(/"/g, '&quot;')}" ` +
    `frameborder="0" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
    `referrerpolicy="strict-origin-when-cross-origin" ` +
    `allowfullscreen></iframe>`;

  return {
    id,
    provider: 'youtube',
    title,
    permalink,
    published_at: publishedAt,
    view_count: viewCount,
    tags,
    embed_html: embedHtml,
    thumbnail_url: thumbnail,
    channel_title: channelTitle,
  };
}

// ── Instagram ─────────────────────────────────────────────────────────────────

/**
 * Fetches the user's recent media from the Instagram Basic Display API.
 * Requires a valid user access token.
 * Returns an empty array when no token is configured.
 */
async function fetchInstagramPosts(accessToken, maxItems = 20) {
  if (!accessToken) return [];

  const url =
    `https://graph.instagram.com/me/media` +
    `?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username` +
    `&limit=${maxItems}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Instagram API warning ${res.status}: ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return data.data ?? [];
}

/** Maps a raw Instagram media object → EmbedItem. */
function normaliseInstagramItem(item) {
  const id          = item.id ?? '';
  const caption     = item.caption ?? '';
  const permalink   = item.permalink ?? '';
  const publishedAt = item.timestamp ?? new Date().toISOString();
  const thumbnail   = item.thumbnail_url ?? item.media_url ?? '';

  // Extract hashtags from the caption
  const tags = (caption.match(/#\w+/g) ?? []).map(t => t.slice(1).toLowerCase());

  // Instagram oEmbed-style blockquote (works without extra API call)
  const embedHtml =
    `<blockquote class="instagram-media" ` +
    `data-instgrm-permalink="${permalink}" ` +
    `data-instgrm-version="14" ` +
    `style="max-width:540px;min-width:326px;width:99.375%;"></blockquote>` +
    `<script async src="//www.instagram.com/embed.js"></script>`;

  return {
    id,
    provider: 'instagram',
    title: caption.slice(0, 120),
    permalink,
    published_at: publishedAt,
    view_count: 0,        // Basic Display API does not expose view counts
    tags,
    embed_html: embedHtml,
    thumbnail_url: thumbnail,
    channel_title: item.username ?? '',
  };
}

// ── Algorithm filter ──────────────────────────────────────────────────────────

/**
 * Applies the configured algorithm filters to a list of embed items.
 *
 * Rules (all must pass):
 *   1. view_count >= MIN_VIEW_COUNT
 *   2. If REQUIRED_TAGS is non-empty, at least one tag must match
 */
function applyAlgorithm(items) {
  return items.filter(item => {
    if (item.view_count < MIN_VIEW_COUNT) return false;

    if (REQUIRED_TAGS.length > 0) {
      const hasTag = REQUIRED_TAGS.some(required =>
        item.tags.some(tag => tag.includes(required)) ||
        item.title.toLowerCase().includes(required),
      );
      if (!hasTag) return false;
    }

    return true;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('DREAMengin embed-feed updater');
  console.log(`Sources:         ${SOURCES.join(', ')}`);
  console.log(`Min view count:  ${MIN_VIEW_COUNT}`);
  console.log(`Required tags:   ${REQUIRED_TAGS.length ? REQUIRED_TAGS.join(', ') : '(none)'}`);
  console.log(`Max items:       ${MAX_ITEMS}`);
  console.log('');

  const raw = [];

  // YouTube
  if (SOURCES.includes('youtube')) {
    if (!YOUTUBE_API_KEY) {
      console.warn('⚠️  YOUTUBE_API_KEY is not set — skipping YouTube source.');
    } else {
      console.log('Fetching YouTube videos…');
      const ytRaw  = await fetchYouTubeVideos(YOUTUBE_API_KEY, Math.min(MAX_ITEMS * 3, 50));
      const ytItems = ytRaw.map(normaliseYouTubeItem);
      console.log(`  Fetched ${ytItems.length} YouTube items.`);
      raw.push(...ytItems);
    }
  }

  // Instagram
  if (SOURCES.includes('instagram')) {
    if (!IG_ACCESS_TOKEN) {
      console.warn('⚠️  INSTAGRAM_ACCESS_TOKEN is not set — skipping Instagram source.');
    } else {
      console.log('Fetching Instagram posts…');
      const igRaw   = await fetchInstagramPosts(IG_ACCESS_TOKEN, MAX_ITEMS * 2);
      const igItems = igRaw.map(normaliseInstagramItem);
      console.log(`  Fetched ${igItems.length} Instagram items.`);
      raw.push(...igItems);
    }
  }

  if (raw.length === 0) {
    console.warn('⚠️  No items fetched from any source. Writing empty feed.');
  }

  // Apply algorithm filters and cap
  const filtered = applyAlgorithm(raw)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, MAX_ITEMS);

  console.log(`\nAfter algorithm filter: ${filtered.length} / ${raw.length} items kept.`);

  // Build output
  const output = {
    generated_at: new Date().toISOString(),
    algorithm: {
      min_view_count: MIN_VIEW_COUNT,
      required_tags:  REQUIRED_TAGS,
      max_items:      MAX_ITEMS,
      sources:        SOURCES,
    },
    items: filtered,
  };

  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  // Write JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Wrote ${filtered.length} embed items → ${OUTPUT_PATH}`);

  // Print a summary of what was written
  if (filtered.length > 0) {
    console.log('\nEmbed feed preview (first 5 items):');
    filtered.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.provider}] ${item.title.slice(0, 70)}`);
      console.log(`      views: ${item.view_count.toLocaleString()} | tags: ${item.tags.slice(0, 3).join(', ')}`);
    });
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
