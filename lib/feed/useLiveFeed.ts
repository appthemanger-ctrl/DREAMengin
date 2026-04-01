/**
 * lib/feed/useLiveFeed.ts
 *
 * Live HomeDream feed hook.
 *
 * Subscribes to two Supabase Realtime channels:
 *   1. `homedream-posts:{userId}` — INSERT + UPDATE on app_posts (visibility=public)
 *   2. `homedream-items:{userId}` — INSERT on feed_items (user_id=eq.{userId})
 *
 * New posts from OTHER users are queued (not auto-prepended) so the user
 * doesn't lose their scroll position. A "N new posts" tap-to-show banner
 * signals them. Own posts are prepended immediately (matches the optimistic
 * composer flow so dedup is seamless). Connector items are queued.
 *
 * Like/unlike counts propagate via UPDATE events without any re-fetch.
 *
 * Architecture:
 *   - lib/ Logic layer per GENERATION_LAW §3.1
 *   - Same Realtime pattern as useDreamDMMessages (lib/dreamdm/)
 *   - docs/ARCHITECTURE.md §10 — no JS timers; events drive everything
 *   - docs/AXIOMS.md Axiom 5 — feed_items scoped to user_id via RLS
 *
 * Performance:
 *   - INSERT handler does one single-row SELECT to hydrate the profile join.
 *   - UPDATE handler is zero-fetch: updates in place from the payload.
 *   - Both channels are torn down cleanly on unmount.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

// ── Public types ───────────────────────────────────────────────────────────────

/** Unified feed post shape used by HomeFeed and the realtime hook. */
export interface FeedPost {
  id: string;
  content: string;
  visibility: string;
  media_url?: string | null;
  created_at: string;
  profiles: {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  /** 'post' = platform post | 'connector' = external feed item | 'share' = reshared content */
  source?: 'post' | 'connector' | 'share';
  /** Connector provider id (mastodon, github, bluesky, …) */
  provider?: string;
  /** Original post URL for connector items (mastodon, youtube, …) */
  permalink?: string;
}

export interface UseLiveFeedReturn {
  /** Visible feed posts, newest-first */
  posts: FeedPost[];
  /** How many new posts are queued behind the banner */
  newCount: number;
  /** Prepend queued posts — call when user taps the banner */
  flushNew: () => void;
  /** true when the Realtime channel reports SUBSCRIBED */
  isLive: boolean;
  /** Replace the entire post list (used by tab switches) */
  replacePosts: (next: FeedPost[]) => void;
  /** Prepend a single post (used by the composer for its own optimistic post) */
  prependPost: (post: FeedPost) => void;
  /** Patch a post in place (likes_count, comments_count, etc.) */
  updatePost: (id: string, changes: Partial<FeedPost>) => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useLiveFeed(userId: string, initialPosts: FeedPost[]): UseLiveFeedReturn {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  // Posts from other users held in a queue until the user taps the banner
  const [queued, setQueued] = useState<FeedPost[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Keep a stable ref to the channel so we can tear it down cleanly
  const postsChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const itemsChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // ── Stable callbacks ────────────────────────────────────────────────────────

  const flushNew = useCallback(() => {
    setQueued((prev) => {
      if (prev.length === 0) return prev;
      setPosts((cur) => {
        // Merge queued items in, deduplicating against current feed
        const ids = new Set(cur.map((p) => p.id));
        const fresh = prev.filter((p) => !ids.has(p.id));
        return [...fresh, ...cur];
      });
      return [];
    });
  }, []);

  const replacePosts = useCallback((next: FeedPost[]) => {
    setPosts(next);
    setQueued([]);
  }, []);

  const prependPost = useCallback((post: FeedPost) => {
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      return [post, ...prev];
    });
  }, []);

  const updatePost = useCallback((id: string, changes: Partial<FeedPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  }, []);

  // ── Realtime subscriptions ─────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // ── Channel 1: app_posts (public posts from any user) ──────────────────
    const postsChannel = supabase
      .channel(`homedream-posts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_posts',
          // Filter to public posts only — private posts never surface here
          filter: 'visibility=eq.public',
        },
        async (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          const raw = payload.new as Record<string, unknown>;
          const postId  = raw.id       as string;
          const authorId = (raw.user_id ?? raw.author_id) as string;

          // Hydrate the profile join with a single-row fetch
          // (the realtime payload does not include joined columns)
          const { data } = await supabase
            .from('app_posts')
            .select('id, content, visibility, media_url, created_at, likes_count, comments_count, profiles!inner(handle, display_name, avatar_url)')
            .eq('id', postId)
            .single();

          if (!data) return;
           
          const d = data as any;

          const newPost: FeedPost = {
            id:             d.id,
            content:        d.content        ?? '',
            visibility:     d.visibility     ?? 'public',
            media_url:      d.media_url      ?? null,
            created_at:     d.created_at,
            likes_count:    d.likes_count    ?? 0,
            comments_count: d.comments_count ?? 0,
            profiles: {
              handle:       d.profiles.handle,
              display_name: d.profiles.display_name ?? null,
              avatar_url:   d.profiles.avatar_url   ?? null,
            },
            source: 'post',
          };

          if (authorId === userId) {
            // Own post — prepend immediately (dedup with optimistic insert)
            setPosts((prev) => {
              if (prev.some((p) => p.id === postId)) return prev;
              return [newPost, ...prev];
            });
          } else {
            // Someone else's post — queue behind the banner
            setQueued((prev) => {
              if (prev.some((p) => p.id === postId)) return prev;
              return [newPost, ...prev];
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_posts',
        },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          const raw = payload.new as Record<string, unknown>;
          // Sync like/comment counts in place — zero re-fetch
          setPosts((prev) =>
            prev.map((p) =>
              p.id === raw.id
                ? {
                    ...p,
                    likes_count:    (raw.likes_count    as number | undefined) ?? p.likes_count,
                    comments_count: (raw.comments_count as number | undefined) ?? p.comments_count,
                  }
                : p,
            ),
          );
        },
      )
      .subscribe((status: string) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    postsChannelRef.current = postsChannel;

    // ── Channel 2: feed_items (connector-synced items for this user) ────────
    const itemsChannel = supabase
      .channel(`homedream-items:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_items',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          const raw = payload.new as Record<string, unknown>;
           
          const p = (raw.payload ?? {}) as Record<string, any>;

          const newEntry: FeedPost = {
            id:             raw.id         as string,
            content:        (p.content_text ?? p.title ?? '') as string,
            visibility:     'public',
            media_url:      Array.isArray(p.media) && p.media.length > 0
                              ? (p.media[0].url as string)
                              : null,
            created_at:     (raw.published_at ?? raw.created_at) as string,
            likes_count:    0,
            comments_count: 0,
            profiles: {
              handle:       (p.author_handle ?? raw.provider ?? 'feed') as string,
              display_name: (p.author_name   ?? raw.provider ?? null)   as string | null,
              avatar_url:   (p.author_avatar ?? null)                   as string | null,
            },
            source:   'connector',
            provider: raw.provider as string | undefined,
          };

          // Connector items always queue — they are from external services
          setQueued((prev) => {
            if (prev.some((q) => q.id === newEntry.id)) return prev;
            return [newEntry, ...prev];
          });
        },
      )
      .subscribe();

    itemsChannelRef.current = itemsChannel;

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(itemsChannel);
      postsChannelRef.current = null;
      itemsChannelRef.current = null;
      setIsLive(false);
    };
  }, [userId]);

  return {
    posts,
    newCount: queued.length,
    flushNew,
    isLive,
    replacePosts,
    prependPost,
    updatePost,
  };
}
