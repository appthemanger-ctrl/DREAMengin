import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Search users and posts
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const type = searchParams.get('type') || 'all'; // all | users | posts
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  if (!q) {
    return NextResponse.json({ users: [], posts: [] });
  }

  const results: { users: unknown[]; posts: unknown[] } = {
    users: [],
    posts: [],
  };

  // Search users by handle or display_name
  if (type === 'all' || type === 'users') {
    const pattern = `%${q}%`;
    const { data: users } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url, bio')
      .or(`handle.ilike.${pattern},display_name.ilike.${pattern}`)
      .limit(limit);

    results.users = users || [];
  }

  // Search posts by content
  if (type === 'all' || type === 'posts') {
    const { data: posts } = await supabase
      .from('app_posts')
      .select(
        `
        id, content, visibility, media_json, created_at,
        profiles!inner(id, handle, display_name, avatar_url)
      `
      )
      .eq('visibility', 'public')
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    results.posts = posts || [];
  }

  return NextResponse.json(results);
}
