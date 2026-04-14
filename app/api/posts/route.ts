import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { scanContent } from '@/lib/child-safety/childSafetyDetector';
import { scanMediaUrlsForChildSafety } from '@/lib/child-safety/scanMediaUrls';
import { reportChildSafetyIncident } from '@/lib/child-safety/ncmecReporter';
import { getPrimaryPostMediaUrl } from '@/lib/media/postMedia';
import { createHash } from 'crypto';

function normalizePostMedia<T extends Record<string, any>>(post: T): T & { media_url: string | null } {
  return {
    ...post,
    media_url: getPrimaryPostMediaUrl(post),
  };
}

// GET - Fetch posts for feed
// Query params:
//   feed   — 'following' to show only posts from users the caller follows
//             (hard cap: last 500 posts across all followed users)
//   sort   — 'trending' to order by likes_count DESC (fallback: created_at DESC)
//   limit  — number of posts to return (default 20, max 500 for following, max 50 otherwise)
//   offset — pagination offset
export async function GET(req: NextRequest) {
  const supabase = (await createServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const feed   = searchParams.get('feed');   // 'following' | null
  const sort   = searchParams.get('sort');   // 'trending'  | null

  // ── Following feed: restrict to users the caller follows ─────────────────
  // Hard limit: last 500 posts total across all followed users (spec §1).
  if (feed === 'following') {
    const requestedLimit = parseInt(searchParams.get('limit') ?? '20', 10);
    const limit  = Math.min(requestedLimit, 500); // hard cap per spec
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Get the list of user IDs the caller follows
    const { data: followRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followedIds: string[] = (followRows ?? []).map(
      (r: { following_id: string }) => r.following_id,
    );
    // Always include the caller's own posts
    followedIds.push(user.id);

    // Resolve close-friends list so we can filter visibility correctly.
    const { data: cfRows } = await (supabase as any)
      .from('close_friends')
      .select('user_id')
      .eq('friend_id', user.id);
    const closeFriendPosters = new Set<string>(
      (cfRows ?? []).map((r: { user_id: string }) => r.user_id),
    );

    const { data: rawPosts, error } = await (supabase as any)
      .from('app_posts')
      .select('*, profiles!inner(id, handle, display_name, avatar_url)')
      .in('user_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(500) // always fetch at most 500 regardless of requested page size
      .range(offset, offset + 499);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Filter out close_friends posts where the viewer is not in the poster's list.
    const posts = (rawPosts ?? [])
      .filter((p: any) => {
        if (p.post_visibility === 'close_friends') {
          return closeFriendPosters.has(p.user_id) || p.user_id === user.id;
        }
        return true;
      })
      .slice(0, limit);

    return NextResponse.json({ posts: posts.map((post: any) => normalizePostMedia(post)), total_cap: 500 });
  }

  // ── Trending feed: order by likes_count DESC, then recent ─────────────────
  if (sort === 'trending') {
    const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const { data: posts, error } = await supabase
      .from('app_posts')
      .select('*, profiles!inner(id, handle, display_name, avatar_url)')
      .or(`visibility.eq.public,user_id.eq.${user.id}`)
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: (posts ?? []).map((post: any) => normalizePostMedia(post)) });
  }

  // ── Default feed: public posts ordered by recency ─────────────────────────
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 50);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const { data: posts, error } = await supabase
    .from('app_posts')
    .select('*, profiles!inner(id, handle, display_name, avatar_url)')
    .or(`visibility.eq.public,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: (posts ?? []).map((post: any) => normalizePostMedia(post)) });
}

// POST - Create a new post
export async function POST(req: NextRequest) {
  const supabase = (await createServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { content, visibility = 'public', media_urls = [], post_visibility = 'public', original_post_id } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // ── Rate limiting (spec §4) ───────────────────────────────────────────────
  // Close-friends posts: 50 per 5 minutes.
  // Public posts: 10 per 5 minutes.
  const isCloseFriendsPost = post_visibility === 'close_friends';
  const rateLimit = isCloseFriendsPost ? 50 : 10;
  const windowMs = 5 * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { count: recentCount, error: rateError } = await (supabase as any)
    .from('app_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('post_visibility', post_visibility)
    .gte('created_at', windowStart);

  if (!rateError && typeof recentCount === 'number' && recentCount >= rateLimit) {
    return NextResponse.json(
      { error: "You're posting too fast. Wait a moment." },
      { status: 429 },
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── TheBoogieMan child safety scan (zero-tolerance) ──────────────────────
  const childSafetyResult = scanContent({ text: content });
  if (childSafetyResult.flagged) {
    const contentHash = createHash('sha256').update(content).digest('hex');
    // Fire-and-forget report — do not await to avoid blocking the rejection
    reportChildSafetyIncident({
      reportedUserId: user.id,
      ruleCode: childSafetyResult.rule_code!,
      detectionResult: childSafetyResult,
      surface: 'post',
      contentRef: `draft:${contentHash.slice(0, 16)}`,
      contentHash,
    }).catch((err) => console.error('[child-safety] post report error:', err));

    return NextResponse.json(
      { error: 'Content violates our child safety policy and has been blocked.' },
      { status: 451 },
    );
  }

  // ── TheBoogieMan media image scan (LLM + hash) — real-time ───────────────
  // Scans each image attached to the post before it is written to the DB.
  // Graceful degradation: if Groq is not configured or fetch fails, scan
  // returns CLEAN (skipped) so the post is never blocked by transient errors.
  if (Array.isArray(media_urls) && media_urls.length > 0) {
    const mediaSafetyResult = await scanMediaUrlsForChildSafety({
      urls: media_urls,
      supabase,
    });
    if (mediaSafetyResult.flagged) {
      reportChildSafetyIncident({
        reportedUserId: user.id,
        ruleCode: mediaSafetyResult.rule_code!,
        detectionResult: mediaSafetyResult,
        surface: 'post',
        contentRef: `media:${Array.isArray(media_urls) ? String(media_urls.length) : '?'}_files`,
      }).catch((err) => console.error('[child-safety] post media report error:', err));

      return NextResponse.json(
        { error: 'Attached media violates our child safety policy and has been blocked.' },
        { status: 451 },
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { data: post, error } = await supabase
    .from('app_posts')
    .insert({
      user_id: user.id,
      content: content.trim(),
      visibility,
      media_urls,
      post_visibility,
      ...(original_post_id ? { original_post_id } : {}),
    })
    .select(`
      *,
      profiles!inner(id, handle, display_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also create a feed item for the user
   
  await (supabase as any).from('feed_items').insert({
    user_id: user.id,
    type: 'post',
    content: { text: content.trim(), post_id: post.id },
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ post }, { status: 201 });
}
