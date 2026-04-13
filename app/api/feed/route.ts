// app/api/feed/route.ts
// Phase 8 §A — Unified HomeDream feed resolver.
// Phase 9 — Updated to use Activity-First Protocol visibility score ranking
//
// Merges two source streams:
//   1. feed_items  — connector-synced items (Mastodon, Bluesky, GitHub,
//                    Reddit, Nostr, Spotify, YouTube, etc.)
//   2. app_posts   — platform posts from accounts the user follows +
//                    the user's own public posts
//
// Privacy (AXIOM 5 / SECURITY.md):
//   feed_items are user-scoped via RLS (only owner can read their items).
//   app_posts are filtered to public posts from followed users + own posts.
//   No cross-user data leakage is possible through this route.
//
// Architecture: docs/ARCHITECTURE.md §3 — all feed data from Supabase.
//               No static arrays. No mock content.
//
// Query params:
//   limit    — max items to return (default: 30, max: 100)
//   before   — ISO timestamp cursor for pagination
//   provider — filter connector items to a specific provider
//   sort     — "recent" (default) | "activity" (Phase 9: by visibility_score)

import { NextRequest, NextResponse } from 'next/server';
import { getPrimaryPostMediaUrl } from '@/lib/media/postMedia';
import { createServerClient } from '@/lib/supabase/server';
import { sortByVisibilityScore } from '@/lib/activity/visibility-score';


// Unified feed item shape returned by this route.
export interface UnifiedFeedEntry {
  id: string;
  source: 'connector' | 'post' | 'system';
  provider?: string;          // connector provider id (mastodon, github, etc.)
  author_handle?: string;
  author_name?: string;
  author_avatar?: string | null;
  content_text?: string;
  content_html?: string;
  media?: Array<{ url: string; type: 'image' | 'video' | 'audio' }>;
  permalink?: string;
  published_at: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;        // Phase 9: View count (primary metric)
  visibility_score?: number;   // Phase 9: For activity-based ranking
  // original payload preserved for connector items
  raw?: Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '30', 10), 100);
  const before   = searchParams.get('before');   // ISO date cursor
  const provider = searchParams.get('provider'); // optional provider filter
  const sort     = searchParams.get('sort') ?? 'recent';

  const entries: UnifiedFeedEntry[] = [];

  // ── Stream 1: feed_items (connector-synced content) ──────────────────────
  {
     
    const db = supabase as any;
    let q = db
      .from('feed_items')
      .select('id, provider, payload, published_at, created_at')
      .eq('user_id', user.id)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (before) q = q.lt('published_at', before);
    if (provider) q = q.eq('provider', provider);

    const { data: items } = await q;

    if (items) {
      for (const item of items) {
        const p = (item.payload ?? {}) as Record<string, unknown>;
        entries.push({
          id:           item.id,
          source:       'connector',
          provider:     item.provider,
          author_handle: p.author_handle as string | undefined,
          author_name:   p.author_name   as string | undefined,
          author_avatar: p.author_avatar as string | null | undefined,
          content_text:  p.content_text  as string | undefined,
          content_html:  p.content_html  as string | undefined,
          media:         (p.media as UnifiedFeedEntry['media']) ?? [],
          permalink:     p.permalink     as string | undefined,
          published_at:  (item.published_at ?? item.created_at) as string,
          created_at:    item.created_at as string,
          raw:           p,
        });
      }
    }
  }

  // ── Stream 2: app_posts (public posts from followed users + own posts) ─────
  {
    // Collect followed user IDs
     
    const db = supabase as any;
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followedIds = (follows ?? []).map((f: { following_id: string }) => f.following_id);
    const authorIds   = [user.id, ...followedIds];

    let q = db
        .from('app_posts')
        .select(
          'id, content, visibility, media_url, media_urls, media_json, created_at, likes_count, comments_count, ' +
          'profiles!inner(handle, display_name, avatar_url)'
        )
      .in('user_id', authorIds)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) q = q.lt('created_at', before);
    if (sort === 'trending') q = q.order('likes_count', { ascending: false });

    const { data: posts } = await q;

    if (posts) {
      for (const post of posts) {

        const p = post as any;
        const profile = p.profiles ?? {};

        // Phase 9: Get view count for this post
        const { count: viewCount } = await supabase
          .from('views')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', p.id)
          .eq('verified', true);

        entries.push({
          id:            p.id,
          source:        'post',
          provider:      'dreamengin',
          author_handle: profile.handle,
          author_name:   profile.display_name ?? profile.handle,
          author_avatar: profile.avatar_url ?? null,
          content_text:  p.content,
          media:         getPrimaryPostMediaUrl(p) ? [{ url: getPrimaryPostMediaUrl(p)!, type: 'image' }] : [],
          published_at:  p.created_at,
          created_at:    p.created_at,
          likes_count:   p.likes_count ?? 0,
          comments_count: p.comments_count ?? 0,
          views_count:   viewCount ?? 0,  // Phase 9: Views are the primary metric
        });
      }
    }
  }

  // ── Merge + sort ──────────────────────────────────────────────────────────
  // Phase 9: Activity-First Protocol — sort by visibility_score when sort=activity
  if (sort === 'activity') {
    // Use visibility score algorithm (AQS-based ranking)
    const rankedEntries = await sortByVisibilityScore(entries);
    const page = rankedEntries.slice(0, limit);

    return NextResponse.json(
      { feed: page, count: page.length },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Legacy sorting (for backward compatibility)
  entries.sort((a, b) => {
    if (sort === 'trending') {
      // trending: posts with most likes first, then by date
      const aLikes = a.likes_count ?? 0;
      const bLikes = b.likes_count ?? 0;
      if (bLikes !== aLikes) return bLikes - aLikes;
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  const page = entries.slice(0, limit);

  return NextResponse.json(
    { feed: page, count: page.length },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
