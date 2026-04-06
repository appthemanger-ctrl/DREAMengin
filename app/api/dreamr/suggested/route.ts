/**
 * GET /api/dreamr/suggested
 *
 * Returns two kinds of suggestions, both powered by the DreamR algorithm:
 *
 *  ?type=content  — posts from creators the caller does NOT yet follow,
 *                   scored and ranked by the humanistic algorithm.
 *                   These appear woven into the feed as "you might love this".
 *
 *  ?type=creators — profiles of creators the caller does NOT yet follow,
 *                   ranked by how actively they create on dreamengin
 *                   (post count + recency of last post, never follower count).
 *                   These appear as "connect with" cards in the feed.
 *
 * Query params:
 *   type   — 'content' | 'creators'  (default 'content')
 *   limit  — results to return       (default 5, max 10)
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rankFeed, type ScoredPost } from '@/lib/dreamr/dreamrAlgorithm';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type  = searchParams.get('type') ?? 'content';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 10);

  const db = supabase as any;

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

  // ── Suggested CONTENT ─────────────────────────────────────────────────────
  if (type === 'content') {
    const { data: rows } = await db
      .from('app_posts')
      .select('id, content, media_url, created_at, views_count, likes_count, comments_count, user_id, profiles!inner(handle, display_name, avatar_url)')
      .eq('visibility', 'public')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .order('views_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(60);

    const posts: ScoredPost[] = (rows ?? []).map((r: any) => ({
      id:             r.id,
      content:        r.content ?? '',
      media_url:      r.media_url ?? null,
      created_at:     r.created_at,
      views_count:    r.views_count    ?? 0,
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
    // Find active creators not yet followed: those with recent public posts
    const { data: rows } = await db
      .from('app_posts')
      .select('user_id, created_at, profiles!inner(id, handle, display_name, avatar_url, bio)')
      .eq('visibility', 'public')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Deduplicate by user_id, keep the most recent post per creator.
    // Rank creators by: recency of latest post + post count (activity score).
    const creatorMap = new Map<string, {
      id: string;
      handle: string;
      display_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      post_count: number;
      latest_post_at: string;
    }>();

    for (const row of rows as any[]) {
      const uid = row.user_id;
      const p   = row.profiles ?? {};
      if (!creatorMap.has(uid)) {
        creatorMap.set(uid, {
          id:             p.id ?? uid,
          handle:         p.handle ?? '',
          display_name:   p.display_name ?? null,
          avatar_url:     p.avatar_url   ?? null,
          bio:            p.bio          ?? null,
          post_count:     1,
          latest_post_at: row.created_at,
        });
      } else {
        const entry = creatorMap.get(uid)!;
        entry.post_count++;
        if (row.created_at > entry.latest_post_at) {
          entry.latest_post_at = row.created_at;
        }
      }
    }

    // Sort by activity: recent activity + post count
    const creators = [...creatorMap.values()]
      .sort((a, b) => {
        const recencyA = (Date.now() - new Date(a.latest_post_at).getTime()) / 3_600_000;
        const recencyB = (Date.now() - new Date(b.latest_post_at).getTime()) / 3_600_000;
        // Activity score: post_count / sqrt(age_hours) — rewards consistent creators, not spammers
        const scoreA = a.post_count / Math.sqrt(recencyA + 1);
        const scoreB = b.post_count / Math.sqrt(recencyB + 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return NextResponse.json({ suggestions: creators }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
