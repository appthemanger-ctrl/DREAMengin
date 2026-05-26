/**
 * lib/social/useSocialData.ts
 *
 * React hook for aggregated decentralized social feed data.
 *
 * Fetches from the backend social aggregator service (Mastodon, Nostr,
 * Bluesky) and merges with the DREAMengin-native feed so components get
 * a unified, consistently typed post list they can render without caring
 * about the origin platform.
 *
 * Architecture notes (AGENTS.md engine law):
 *   – State flows one way: fetch → normalise → hook state → component.
 *   – Each platform fetch is a separate settled promise so one failure
 *     never blocks the others.
 *   – The hook is SSR-safe: it performs no fetches on the server.
 */

'use client';

import type { NormalizedPost } from '@/lib/social/normalizers';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SocialPlatformFilter = 'all' | 'mastodon' | 'nostr' | 'bluesky';

export interface SocialDataState {
  posts: NormalizedPost[];
  isLoading: boolean;
  error: string | null;
  /** Platform → post count breakdown for the current window */
  breakdown: Record<SocialPlatformFilter, number>;
  /** ISO timestamp of the last successful fetch */
  lastFetchedAt: string | null;
  /** Trigger a manual refresh */
  refresh: () => void;
  /** Filter to a single platform (sets `platform` and re-fetches) */
  setPlatform: (platform: SocialPlatformFilter) => void;
  currentPlatform: SocialPlatformFilter;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api/social';
const DEFAULT_LIMIT = 30;
const POLL_INTERVAL_MS = 60_000; // refresh every 60 s in the background

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchPlatformFeed(
  platform: SocialPlatformFilter,
  limit: number
): Promise<NormalizedPost[]> {
  const url =
    platform === 'all'
      ? `${BACKEND_BASE}/feed?limit=${limit}`
      : `${BACKEND_BASE}/feed/${platform}?limit=${limit}`;

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`${platform} feed fetch failed (${res.status})`);

  const raw = (await res.json()) as unknown[];

  // Normalise the backend's raw posts (mastodon/nostr/bluesky shape) into the
  // NormalizedPost interface. The backend already returns a partially normalised
  // shape from its aggregators; we cast + fill defaults here.
  return (raw as unknown[]).map((rawItem: unknown): NormalizedPost => {
  const item = rawItem as Record<string, unknown>;
  return ({
    id: String((item as Record<string, unknown>).id ?? crypto.randomUUID()),
    source:
      (item.platform as NormalizedPost['source']) ??
      deriveSource(String((item as Record<string, unknown>).id ?? '')),
    provider: String((item as Record<string, unknown>).platform ?? 'unknown'),
    content: stripHtml(String((item as Record<string, unknown>).content ?? '')),
    author: (() => {
      const a = (item.author ?? {}) as Record<string, unknown>;
      return {
        handle: String(a.handle ?? a.acct ?? 'unknown'),
        displayName: (a.displayName ?? a.display_name ?? null) as string | null,
        avatarUrl: (a.avatar ?? null) as string | null,
      };
    })(),
    mediaUrl: (item.mediaUrl ?? item.media_url ?? null) as string | null,
    permalink: (item.originalUrl ?? item.url ?? null) as string | null,
    createdAt:
      item.timestamp instanceof Date
        ? (item.timestamp as Date).toISOString()
        : String(item.timestamp ?? item.created_at ?? new Date().toISOString()),
    visibility: 'public',
  });
});
}

/** Derive source from an id string prefixed by platform name */
function deriveSource(id: string): NormalizedPost['source'] {
  if (id.startsWith('mastodon_')) return 'mastodon';
  if (id.startsWith('nostr_')) return 'nostr';
  if (id.startsWith('bluesky_')) return 'bluesky';
  return 'connector';
}

/** Strip basic HTML tags from Mastodon status content */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function countByPlatform(
  posts: NormalizedPost[]
): Record<SocialPlatformFilter, number> {
  return posts.reduce(
    (acc, p) => {
      const src = p.source as SocialPlatformFilter;
      acc[src] = (acc[src] ?? 0) + 1;
      return acc;
    },
    { all: posts.length, mastodon: 0, nostr: 0, bluesky: 0 } as Record<
      SocialPlatformFilter,
      number
    >
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Aggregated decentralized social feed hook.
 *
 * @example
 * ```tsx
 * const { posts, isLoading, setPlatform } = useSocialData();
 * ```
 */
export function useSocialData(
  initialPlatform: SocialPlatformFilter = 'all',
  limit: number = DEFAULT_LIMIT
): SocialDataState {
  const [platform, setPlatformState] =
    useState<SocialPlatformFilter>(initialPlatform);
  const [posts, setPosts] = useState<NormalizedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<Record<SocialPlatformFilter, number>>(
    { all: 0, mastodon: 0, nostr: 0, bluesky: 0 }
  );

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const load = useCallback(
    async (currentPlatform: SocialPlatformFilter) => {
      setIsLoading(true);
      setError(null);
      try {
        const fetched = await fetchPlatformFeed(currentPlatform, limit);
        if (!isMounted.current) return;
        setPosts(fetched);
        setBreakdown(countByPlatform(fetched));
        setLastFetchedAt(new Date().toISOString());
      } catch (err: any) {
        if (!isMounted.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load social feed');
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    },
    [limit]
  );

  // Initial load + platform change
  useEffect(() => {
    void load(platform);
  }, [platform, load]);

  // Background polling
  useEffect(() => {
    pollRef.current = setInterval(() => void load(platform), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [platform, load]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(() => void load(platform), [platform, load]);

  const setPlatform = useCallback((next: SocialPlatformFilter) => {
    setPlatformState(next);
  }, []);

  return {
    posts,
    isLoading,
    error,
    breakdown,
    lastFetchedAt,
    refresh,
    setPlatform,
    currentPlatform: platform,
  };
}