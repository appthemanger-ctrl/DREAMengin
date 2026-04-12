/**
 * GET /api/dreamr/feed
 *
 * DreamR-scored feed. Fetches public posts, scores every one with the
 * DreamR humanistic algorithm, and returns them ranked so that creativity,
 * originality, and artistry lead — not follower counts or raw engagement.
 *
 * Query params:
 *   limit  — posts to return (default 20, max 40)
 *   offset — pagination offset
 *
 * The algorithm guarantees creator diversity: the same handle never appears
 * in consecutive slots, so the feed always feels like a wide open stage
 * where everyone gets their moment.
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rankFeed, type ScoredPost } from '@/dreamdmbar/homedream/dreamr/algorithms/dreamrAlgorithm';
import { getPrimaryPostMediaUrl } from '@/lib/media/postMedia';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 40);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const db = supabase as any;

  // ── Fetch a wider pool so the algorithm has material to work with ────────
  // We fetch 3× the requested limit so scoring/ranking has real choices.
  const fetchLimit = Math.min(limit * 3, 120);

  const { data: rows, error } = await db
    .from('app_posts')
    .select('id, content, visibility, media_url, media_urls, media_json, created_at, likes_count, comments_count, profiles!inner(handle, display_name, avatar_url)')
    .eq('visibility', 'public')
    .order('views_count', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + fetchLimit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posts: ScoredPost[] = (rows ?? []).map((r: any) => ({
    id:            r.id,
    content:       r.content ?? '',
    media_url:     getPrimaryPostMediaUrl(r),
    created_at:    r.created_at,
    views_count:   r.views_count   ?? 0,
    likes_count:   r.likes_count   ?? 0,
    comments_count: r.comments_count ?? 0,
    source:        'post',
    provider:      'dreamengin',
    profiles: {
      handle:       r.profiles?.handle       ?? '',
      display_name: r.profiles?.display_name ?? null,
      avatar_url:   r.profiles?.avatar_url   ?? null,
    },
  }));

  // ── Rank with the DreamR algorithm ───────────────────────────────────────
  const ranked = rankFeed(posts).slice(0, limit);

  return NextResponse.json(
    { posts: ranked, count: ranked.length },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
