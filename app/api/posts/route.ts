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
  const { content = '', visibility = 'public', media_urls = [] } = body;

  // DB column is media_json (JSONB), not media_urls
  const media_json = media_urls.length > 0 ? media_urls : null;
  const trimmedContent = content.trim();

  if (!trimmedContent && !media_json) {
    return NextResponse.json({ error: 'Content or media is required' }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from('app_posts')
    .insert({
      user_id: user.id,
      content: trimmedContent,
      visibility,
      media_json,
    })
    .select(`
      *,
      profiles!inner(id, handle, display_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create a feed_items entry (schema: source TEXT, ts TIMESTAMPTZ, title, summary)
  await supabase.from('feed_items').insert({
    user_id: user.id,
    source: 'app_post',
    ts: new Date().toISOString(),
    title: trimmedContent.substring(0, 100) || 'Media post',
    summary: trimmedContent || undefined,
  });

  return NextResponse.json({ post }, { status: 201 });
}
