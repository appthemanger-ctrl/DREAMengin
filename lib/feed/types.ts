// ─── Feed Types ──────────────────────────────────────────────────────────────
// Normalized internal feed format. Every source (news, social, internal)
// maps to FeedItem. No raw external types leak past the provider layer.

export type SourceType = 'news' | 'social' | 'internal';

export type FeedTheme =
  | 'analytics'
  | 'brand'
  | 'games'
  | 'media-vault'
  | 'music'
  | 'play';

export interface FeedMediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'link';
  width?: number;
  height?: number;
  alt?: string;
}

export interface FeedAuthor {
  name: string;
  handle?: string;
  avatar?: string;
  profileUrl?: string;
}

/** Canonical normalized item returned by every provider. */
export interface FeedItem {
  /** Stable content-addressable id: `${providerId}:${externalId}` */
  id: string;
  /** Human-readable source name, e.g. "Hacker News", "mastodon.social" */
  source: string;
  sourceType: SourceType;
  /** Provider that produced this item */
  providerId: string;
  title?: string;
  text: string;
  /** Safe HTML (optional; only present when provider supplies it) */
  html?: string;
  /** Canonical external URL */
  url?: string;
  author: FeedAuthor;
  media: FeedMediaItem[];
  publishedAt: string; // ISO 8601
  tags: string[];
  /** Original external payload – only retained when debug mode is on */
  raw?: unknown;
}

// ─── Cursor / Pagination ─────────────────────────────────────────────────────

/** Per-provider opaque pagination token + overall watermark. */
export interface FeedCursor {
  /** Map of providerId → provider-specific next-page token */
  providerCursors: Record<string, string>;
  /** Oldest publishedAt in the current page (for TTL bucket keying) */
  lastSeenTimestamp: string;
}

// ─── Request ─────────────────────────────────────────────────────────────────

export interface FeedRequest {
  theme: FeedTheme;
  limit?: number;          // default 40
  cursor?: FeedCursor;
  userId?: string;
  locale?: string;
  safeMode?: boolean;
  /** Filter by source type (default: mixed) */
  sourceType?: SourceType | 'mixed';
  /** Reject items older than this many hours (default: 48) */
  maxAgeHours?: number;
}

// ─── Response ────────────────────────────────────────────────────────────────

export interface FeedPartialError {
  providerId: string;
  message: string;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: FeedCursor | null;
  /** Non-fatal per-provider failures (feed is still usable). */
  partialErrors: FeedPartialError[];
  /** ISO timestamp of when this response was assembled (may be cached) */
  assembledAt: string;
  fromCache: boolean;
}
