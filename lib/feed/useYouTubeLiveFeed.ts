'use client';

/**
 * lib/feed/useYouTubeLiveFeed.ts
 *
 * Sliding-window YouTube live feed for the HomeFeed.
 *
 * Behaviour:
 *  - On mount: fetches 7 videos from each of 3 curated queries in parallel
 *    ('weed', 'world news', 'neil degrasse tyson'), interleaves and deduplicates
 *    them, then caps to 20 items.
 *  - Every 15 seconds (auto, always on): rotates to the next query, fetches up
 *    to 3 new videos, prepends the first unseen one, and drops the oldest item
 *    to keep the list at ≤ 20.
 *  - refresh() triggers an immediate fetch cycle outside the normal schedule.
 *  - nextRefreshIn counts down 15 → 0, resetting after each refresh.
 *
 * Architecture:
 *  - lib/ layer only — no DB calls; YouTube API proxied through
 *    /api/youtube/live-feed so the API key stays server-side.
 *  - Returns FeedPost[] matching the connector item contract already used by
 *    HomeFeed so YouTube cards render with zero additional template code.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FeedPost } from '@/lib/feed/useLiveFeed';
import type { UnifiedFeedItem } from '@/types/connector';
import { ALL_TOPICS, DEFAULT_TOPIC_IDS, loadActiveTopicIds, topicIdsToQueries } from '@/lib/feed/feedTopics';

// ── Constants ─────────────────────────────────────────────────────────────────

const FEED_MAX = 30;
const REFRESH_INTERVAL_DEFAULT_S = 15;
const REFRESH_INTERVAL_ALL_S = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a UnifiedFeedItem (YouTube) → FeedPost so HomeFeed can render it. */
function ytItemToFeedPost(item: UnifiedFeedItem): FeedPost {
  const thumbnail =
    item.media.length > 0
      ? (item.media[0].thumbnail_url ?? item.media[0].url ?? null)
      : null;

  return {
    id: `yt:${item.external_id}`,
    content: item.content_text,
    visibility: 'public',
    media_url: thumbnail,
    created_at: item.published_at,
    profiles: {
      handle: item.author_handle,
      display_name: item.author_name,
      avatar_url: null,
    },
    likes_count: 0,
    comments_count: 0,
    source: 'connector',
    provider: 'youtube',
    permalink: item.permalink,
  };
}

async function fetchYtQuery(
  query: string,
  max: number,
  signal?: AbortSignal,
): Promise<UnifiedFeedItem[]> {
  try {
    const url = `/api/youtube/live-feed?query=${encodeURIComponent(query)}&max=${max}`;
    const res = await fetch(url, signal ? { signal } : {});
    if (!res.ok) return [];
    const data = await res.json() as { ok: boolean; items?: UnifiedFeedItem[] };
    return data.ok ? (data.items ?? []) : [];
  } catch {
    return [];
  }
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseYouTubeLiveFeedReturn {
  ytPosts: FeedPost[];
  isRefreshing: boolean;
  nextRefreshIn: number;
  refresh: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useYouTubeLiveFeed(): UseYouTubeLiveFeedReturn {
  const [ytPosts, setYtPosts] = useState<FeedPost[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Read active topic queries from localStorage on mount; re-read on each cycle
  // so settings changes propagate without a full page reload.
  const getQueries = useCallback((): string[] => {
    const ids = loadActiveTopicIds();
    const queries = topicIdsToQueries(ids);
    return queries.length > 0 ? queries : topicIdsToQueries(DEFAULT_TOPIC_IDS);
  }, []);

  const getRefreshInterval = useCallback((): number => {
    const ids = loadActiveTopicIds();
    return ids.length >= ALL_TOPICS.length ? REFRESH_INTERVAL_ALL_S : REFRESH_INTERVAL_DEFAULT_S;
  }, []);

  const queryIndexRef = useRef(0);
  const seenIdsRef    = useRef<Set<string>>(new Set());
  const refreshingRef = useRef(false);
  const mountedRef    = useRef(true);

  // ── Initial load: all active queries in parallel ──────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    const ctrl = new AbortController();

    async function init() {
      setIsRefreshing(true);
      try {
        const queries = getQueries();
        const results = await Promise.all(
          queries.map((q) => fetchYtQuery(q, 7, ctrl.signal)),
        );
        if (!mountedRef.current) return;

        // Interleave: take 1 from each batch in turn so all queries appear early
        const interleaved: UnifiedFeedItem[] = [];
        const maxLen = Math.max(...results.map((r) => r.length));
        for (let i = 0; i < maxLen; i++) {
          for (const batch of results) {
            if (i < batch.length) interleaved.push(batch[i]!);
          }
        }

        // Deduplicate and cap
        const posts: FeedPost[] = [];
        const seen = new Set<string>();
        for (const item of interleaved) {
          if (seen.has(item.external_id)) continue;
          seen.add(item.external_id);
          seenIdsRef.current.add(item.external_id);
          posts.push(ytItemToFeedPost(item));
          if (posts.length >= FEED_MAX) break;
        }

        setYtPosts(posts);
      } catch {
        // Graceful degradation — no API key or network error
      } finally {
        if (mountedRef.current) setIsRefreshing(false);
      }
    }

    void init();
    return () => {
      mountedRef.current = false;
      ctrl.abort();
    };
  }, [getQueries]);

  // ── Slide in one new item, drop the oldest ────────────────────────────────

  const slideOne = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    if (mountedRef.current) setIsRefreshing(true);

    try {
      const queries = getQueries();
      const query = queries[queryIndexRef.current % queries.length]!;
      queryIndexRef.current += 1;

      const items = await fetchYtQuery(query, 3);

      // Find the first video we haven't shown yet
      const newItem = items.find((it) => !seenIdsRef.current.has(it.external_id));
      if (!newItem) return;

      seenIdsRef.current.add(newItem.external_id);
      const newPost = ytItemToFeedPost(newItem);

      if (mountedRef.current) {
        setYtPosts((prev) => {
          const next = [newPost, ...prev];
          if (next.length > FEED_MAX) {
            // Drop oldest and un-mark it so it can re-appear later
            const dropped = next[next.length - 1];
            next.splice(next.length - 1, 1);
            if (dropped) seenIdsRef.current.delete(dropped.id.slice(3)); // strip 'yt:' prefix
          }
          return next;
        });
      }
    } catch {
      // Silent
    } finally {
      refreshingRef.current = false;
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, [getQueries]);

  // ── Auto-refresh: interval depends on how many topics are active ──────────

  useEffect(() => {
    const intervalMs = getRefreshInterval() * 1_000;
    const timer = setInterval(() => { void slideOne(); }, intervalMs);
    return () => clearInterval(timer);
  }, [slideOne, getRefreshInterval]);

  return {
    ytPosts,
    isRefreshing,
    nextRefreshIn: getRefreshInterval(),
    refresh: () => { void slideOne(); },
  };
}
