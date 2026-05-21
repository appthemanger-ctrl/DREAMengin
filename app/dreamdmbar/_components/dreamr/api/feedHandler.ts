/**
 * app/dreamdmbar/_components/dreamr/api/feedHandler.ts
 *
 * Shared DreamR feed handler logic.
 *
 * This module is the single source of truth for the DreamR feed query,
 * visibility filter, deduplication, and ranking pipeline. It is consumed
 * by the live Next.js API route:
 *
 *   app/api/dreamr/feed/route.ts  ← GET /api/dreamr/feed  (the only live route)
 *
 * ⚠️  This file is intentionally placed under _components/ so Next.js does NOT
 * serve it as an API route. The `_` prefix is a Next.js convention for private
 * folders that are excluded from the routing system.
 *
 * History: this file was previously a duplicate `route.ts` that was identical
 * to the live route but unreachable because of the `_` prefix. It has been
 * converted into a proper shared module that the live route imports from.
 *
 * GET /api/dreamr/feed
 *
 * Query params:
 *   limit    — posts to return (default 20, max 40)
 *   offset   — legacy pagination offset (used only when `before` is absent)
 *   before   — ISO timestamp cursor; returns posts strictly older than it
 *   seen     — comma-separated ids the client has already rendered;
 *              dropped from the pool *before* ranking so pages don't
 *              double-count and the ranker has a clean window
 *
 * Response:
 *   { posts: ScoredPost[], count: number, nextCursor: string | null }
 *
 * Each returned post carries the full DreamR transparency payload:
 *   • dreamr_score    — composite 0-100
 *   • dreamr_signals  — per-signal 0-1 breakdown
 *   • dominant_signal — which signal led to its rank
 *   • dreamr_reason   — short human phrasing of dominant_signal
 *   • view_velocity   — public views per hour since posted
 *   • torridity_rank, originality_mass — torridity-ledger weights
 *
 * Visibility:
 *   Public posts always pass through. `post_visibility = 'close_friends'`
 *   posts pass only when the viewer is on the poster's CF list, or owns
 *   the post. The CF circle is fetched best-effort via the service role;
 *   when unavailable the filter degrades to "public + own" which is the
 *   conservative correct behaviour.
 *
 * The algorithm guarantees creator diversity: the same handle never appears
 * in consecutive slots, so the feed always feels like a wide open stage
 * where everyone gets their moment.
 */

import {
    filterByCloseFriends,
    loadVisibilityCircle,
} from '@/lib/dreamr/closeFriendsVisibility';
import { deriveNextCursor, parseFeedParams } from '@/lib/dreamr/feedCursor';
import { getPrimaryPostMediaUrl } from '@/lib/media/postMedia';
import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rankFeed, type ScoredPost } from '../algorithms/dreamrAlgorithm';

/**
 * Core DreamR feed handler — shared between the live route and any future
 * internal callers (e.g. server actions, edge middleware). Import this function
 * from `app/api/dreamr/feed/route.ts` and export it as `GET`.
 */
export async function dreamrFeedHandler(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const params = parseFeedParams(searchParams);

  const db = supabase as SupabaseClient;

  // ── Fetch a wider pool so the algorithm has material to work with ────────
  // NOTE: the DB column on app_posts is `view_count` (singular), maintained by
  // /api/posts/[id]/view on every verified view. The algorithm interface field
  // is `views_count` (plural). We map DB → algorithm below.
  //
  // Pagination: prefer the stable `before` cursor (created_at < cursor) so
  // pages don't drift when new posts arrive between requests. Fall back to
  // the legacy numeric offset for backward compatibility with callers that
  // haven't migrated yet (the in-tree `dreamrfeed.tsx` is one of them).
  let query = db
    .from('app_posts')
    .select(
      'id, user_id, content, visibility, post_visibility, media_url, media_urls, media_json, created_at, view_count, likes_count, comments_count, profiles!inner(handle, display_name, avatar_url)'
    )
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (params.before) {
    query = query.lt('created_at', params.before).limit(params.fetchLimit);
  } else {
    query = query.range(params.offset, params.offset + params.fetchLimit - 1);
  }

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fetched = (rows ?? []) as any[];

  // ── Visibility filter: drop close-friends posts the viewer cannot see ────
  const circle = await loadVisibilityCircle(user.id);
  const visible = filterByCloseFriends(fetched as any, user.id, circle);

  // ── Dedupe ids the client has already seen *before* ranking ──────────────
  const fresh =
    params.seen.size > 0
      ? visible.filter((r) => !params.seen.has((r as Record<string, unknown>).id as string))
      : visible;

  const posts: ScoredPost[] = fresh.map((r: any) => ({
    id: r.id,
    content: r.content ?? '',
    media_url: getPrimaryPostMediaUrl(r as any),
    created_at: r.created_at,
    views_count: r.view_count ?? 0,
    likes_count: r.likes_count ?? 0,
    comments_count: r.comments_count ?? 0,
    source: 'post',
    provider: 'dreamengin',
    profiles: {
      handle: r.profiles?.handle ?? '',
      display_name: r.profiles?.display_name ?? null,
      avatar_url: r.profiles?.avatar_url ?? null,
    },
  }));

  // ── Rank with the DreamR algorithm ───────────────────────────────────────
  const ranked = rankFeed(posts).slice(0, params.limit);
  const nextCursor = deriveNextCursor(ranked, fetched.length, params.fetchLimit);

  return NextResponse.json(
    { posts: ranked, count: ranked.length, nextCursor },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}