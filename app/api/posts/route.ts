import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch posts for feed
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Fetch posts from users the current user follows + their own posts
  const { data: posts, error } = await supabase
    .from('app_posts')
    .select(`
      *,
      profiles(id, handle, display_name, avatar_url)
    `)
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
  const { content, visibility = 'public' } = body;
  const media_json = body.media_json ?? body.media_urls ?? null;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from('app_posts')
    .insert({
      user_id: user.id,
      content: content.trim(),
      visibility,
      media_json,
    })
    .select(`
      *,
      profiles(id, handle, display_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also create a feed item for the user
  await supabase.from('feed_items').insert({
    user_id: user.id,
    type: 'post',
    content: { text: content.trim(), post_id: post.id },
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ post }, { status: 201 });
}
