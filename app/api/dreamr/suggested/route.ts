/**
 * GET /api/dreamr/suggested
 *
 * Returns two kinds of suggestions, both powered by the DreamR algorithm:
 *
 *  ?type=content  — posts from creators the caller does NOT yet follow,
 *                   scored and ranked by the humanistic algorithm. The full
 *                   transparency payload (dreamr_signals, dominant_signal,
 *                   dreamr_reason, view_velocity) is included on every post.
 *
 *  ?type=creators — profiles of creators the caller does NOT yet follow,
 *                   ranked by the *quality* of their recent work — i.e. the
 *                   average DreamR score of their last few public posts —
 *                   tempered by recency. We never use follower count.
 *
 * Query params:
 *   type   — 'content' | 'creators'  (default 'content')
 *   limit  — results to return       (default 5, max 10)
 *
 * Visibility:
 *   close_friends posts are filtered out using the same helper as the main
 *   feed route, so suggested-content can never leak past the poster's CF wall.
 */

import {
    rankFeed,
    scoreDreamRPost,
    type ScoredPost,
} from '@/app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm';
import {
    filterByCloseFriends,
    loadVisibilityCircle,
} from '@/lib/dreamr/closeFriendsVisibility';
import { getPrimaryPostMediaUrl } from '@/lib/media/postMedia';
import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type  = searchParams.get('type') ?? 'content';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 10);

  const db = supabase as SupabaseClient;

  // ── Who does the user already follow? ────────────────────────────────────
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followedIds: string[] = (follows ?? []).map(
    (f: { following_id: string }) => f.following_id,
  );
  // Always exclude self
  const excludeIds = [...followedIds, user.id];
  const circle = await loadVisibilityCircle(user.id);

  // ── Suggested CONTENT ─────────────────────────────────────────────────────
  if (type === 'content') {
    // NOTE: DB column is `view_count` (singular); algorithm field is `views_count`.
    const { data: rows } = await db
      .from('app_posts')
      .select('id, user_id, content, post_visibility, media_url, media_urls, media_json, created_at, view_count, likes_count, comments_count, profiles!inner(handle, display_name, avatar_url)')
      .eq('visibility', 'public')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(60);

    const visible = filterByCloseFriends((rows ?? []) as Record<string, unknown>[], user.id, circle);

    const posts: ScoredPost[] = visible.map((r: any) => ({
      id:             r.id,
      content:        r.content ?? '',
      media_url:      getPrimaryPostMediaUrl(r as Record<string, unknown>),
      created_at:     r.created_at,
      views_count:    r.view_count     ?? 0,
      likes_count:    r.likes_count    ?? 0,
      comments_count: r.comments_count ?? 0,
      source:         'post',
      provider:       'dreamengin',
      profiles: {
        handle:       r.profiles?.handle       ?? '',
        display_name: r.profiles?.display_name ?? null,
        avatar_url:   r.profiles?.avatar_url   ?? null,
      },
    }));

    const ranked = rankFeed(posts).slice(0, limit);
    return NextResponse.json({ suggestions: ranked }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // ── Suggested CREATORS ────────────────────────────────────────────────────
  if (type === 'creators') {
    // Pull a wider pool of recent public posts so we can score the body of
    // each creator's recent work, not just count them. We need content +
    // media so the DreamR algorithm has the same inputs it uses on the feed.
    const { data: rows } = await db
      .from('app_posts')
      .select('id, user_id, content, post_visibility, media_url, media_urls, media_json, created_at, view_count, likes_count, comments_count, profiles!inner(id, handle, display_name, avatar_url, bio)')
      .eq('visibility', 'public')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(200);

    const visible = filterByCloseFriends((rows ?? []) as Record<string, unknown>[], user.id, circle);

    if (visible.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    interface CreatorAgg {
      id: string;
      handle: string;
      display_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      post_count: number;
      latest_post_at: string;
      score_sum: number;
      score_n: number;
      best_reason: string;
    }

    const creatorMap = new Map<string, CreatorAgg>();

    // Cap per-creator scoring work at 5 most-recent posts so the algorithm
    // measures *current* output, not a long tail. Posts arrive newest-first
    // already, so we just count.
    const SCORE_PER_CREATOR_CAP = 5;
    const scoredCount = new Map<string, number>();

    for (const row of visible as Record<string, unknown>[]) {
      const uid = row.user_id;
      const p   = row.profiles ?? {};

      let entry = creatorMap.get(uid);
      if (!entry) {
        entry = {
          id:             p.id ?? uid,
          handle:         p.handle ?? '',
          display_name:   p.display_name ?? null,
          avatar_url:     p.avatar_url   ?? null,
          bio:            p.bio          ?? null,
          post_count:     0,
          latest_post_at: row.created_at,
          score_sum:      0,
          score_n:        0,
          best_reason:    '',
        };
        creatorMap.set(uid, entry);
      }
      entry.post_count++;
      if (row.created_at > entry.latest_post_at) entry.latest_post_at = row.created_at;

      const used = scoredCount.get(uid) ?? 0;
      if (used < SCORE_PER_CREATOR_CAP) {
        const scored = scoreDreamRPost({
          id:             row.id,
          content:        row.content ?? '',
          media_url:      getPrimaryPostMediaUrl(row as Record<string, unknown>),
          created_at:     row.created_at,
          views_count:    row.view_count     ?? 0,
          likes_count:    row.likes_count    ?? 0,
          comments_count: row.comments_count ?? 0,
          source:         'post',
          provider:       'dreamengin',
          profiles:       { handle: entry.handle, display_name: entry.display_name, avatar_url: entry.avatar_url },
        });
        entry.score_sum += scored.score;
        entry.score_n   += 1;
        if (used === 0) entry.best_reason = scored.reason; // newest-post reason
        scoredCount.set(uid, used + 1);
      }
    }

    // Activity-tempered quality ranking:
    //   creator_score = avgDreamR * recencyBoost * activityBoost
    //   recencyBoost  = 1 / (1 + age_hours/72)   — half-life ≈ 3 days
    //   activityBoost = sqrt(min(post_count, 10)) / sqrt(10)  — modest
    // Quality dominates; recency and activity are tie-breakers.
    const ranked = [...creatorMap.values()]
      .map((c) => {
        const ageHours = (Date.now() - new Date(c.latest_post_at).getTime()) / 3_600_000;
        const recencyBoost  = 1 / (1 + ageHours / 72);
        const activityBoost = Math.sqrt(Math.min(c.post_count, 10)) / Math.sqrt(10);
        const avgQuality    = c.score_n > 0 ? c.score_sum / c.score_n : 0;
        const creatorScore  = avgQuality * recencyBoost * (0.5 + 0.5 * activityBoost);
        return {
          id:             c.id,
          handle:         c.handle,
          display_name:   c.display_name,
          avatar_url:     c.avatar_url,
          bio:            c.bio,
          post_count:     c.post_count,
          /** Average DreamR score over the creator's last few posts (0-100). */
          avg_dreamr_score: Math.round(avgQuality * 10) / 10,
          /** Composite suggested-creator rank (not surfaced to UI by default). */
          creator_score:    Math.round(creatorScore * 10) / 10,
          /** Dominant signal of their newest post — small UX hint. */
          dreamr_reason:    c.best_reason,
        };
      })
      .sort((a, b) => b.creator_score - a.creator_score)
      .slice(0, limit);

    return NextResponse.json({ suggestions: ranked }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
