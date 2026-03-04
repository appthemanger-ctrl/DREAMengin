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
      profiles!inner(id, handle, display_name, avatar_url)
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
  const { content, visibility = 'public', media_urls = [] } = body;
  const normalizedContent = typeof content === 'string' ? content.trim() : '';
  const normalizedMediaUrls = Array.isArray(media_urls)
    ? media_urls
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
    : [];

  if (normalizedMediaUrls.some((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol !== 'https:' && parsed.protocol !== 'http:';
    } catch {
      return true;
    }
  })) {
    return NextResponse.json({ error: 'Invalid media URL format' }, { status: 400 });
  }

  if (!normalizedContent && normalizedMediaUrls.length === 0) {
    return NextResponse.json({ error: 'Content or media is required' }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from('app_posts')
    .insert({
      user_id: user.id,
      content: normalizedContent,
      visibility,
      media_urls: normalizedMediaUrls,
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
  await supabase.from('feed_items').insert({
    user_id: user.id,
    type: 'post',
    content: { text: normalizedContent, post_id: post.id },
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ post }, { status: 201 });
}
