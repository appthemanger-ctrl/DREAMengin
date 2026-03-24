import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch posts for feed
// Query params:
//   feed   — 'following' to show only posts from users the caller follows
//   sort   — 'trending' to order by likes_count DESC (fallback: created_at DESC)
//   limit  — number of posts to return (default 20, max 50)
//   offset — pagination offset
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20'), 50);
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const feed   = searchParams.get('feed');   // 'following' | null
  const sort   = searchParams.get('sort');   // 'trending'  | null

  // ── Following feed: restrict to users the caller follows ─────────────────
  if (feed === 'following') {
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

    const { data: posts, error } = await supabase
      .from('app_posts')
      .select('*, profiles!inner(id, handle, display_name, avatar_url)')
      .in('user_id', followedIds)
      .or(`visibility.eq.public,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts });
  }

  // ── Trending feed: order by likes_count DESC, then recent ─────────────────
  if (sort === 'trending') {
    const { data: posts, error } = await supabase
      .from('app_posts')
      .select('*, profiles!inner(id, handle, display_name, avatar_url)')
      .or(`visibility.eq.public,user_id.eq.${user.id}`)
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts });
  }

  // ── Default feed: public posts ordered by recency ─────────────────────────
  const { data: posts, error } = await supabase
    .from('app_posts')
    .select('*, profiles!inner(id, handle, display_name, avatar_url)')
    .or(`visibility.eq.public,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts });
}

// POST - Create a new post
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { content, visibility = 'public', media_urls = [] } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from('app_posts')
    .insert({
      user_id: user.id,
      content: content.trim(),
      visibility,
      media_urls,
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
