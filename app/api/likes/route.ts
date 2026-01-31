import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Note: This API supports liking various content types: posts, music, projects
// The likes are stored in a generic likes table with content_type and content_id

// GET - Check if user has liked content or get like count
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { searchParams } = new URL(req.url);
  const contentType = searchParams.get('content_type'); // 'post', 'music', 'project'
  const contentId = searchParams.get('content_id');

  if (!contentType || !contentId) {
    return NextResponse.json({ error: 'content_type and content_id required' }, { status: 400 });
  }

  // Get like count (works without auth)
  const { count: likeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  // Check if current user has liked (only if authenticated)
  let hasLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single();
    
    hasLiked = !!like;
  }

  return NextResponse.json({
    like_count: likeCount || 0,
    has_liked: hasLiked,
  });
}

// POST - Like content
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { content_type, content_id } = body;

  if (!content_type || !content_id) {
    return NextResponse.json({ error: 'content_type and content_id required' }, { status: 400 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already liked' }, { status: 400 });
  }

  // Create like
  const { error } = await supabase
    .from('likes')
    .insert({
      user_id: user.id,
      content_type,
      content_id,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update like count on the content table (optional RPC, ignore if it doesn't exist)
  if (content_type === 'post') {
    try {
      await supabase.rpc('increment_likes', { 
        table_name: 'app_posts', 
        row_id: content_id 
      });
    } catch {
      // Ignore if RPC doesn't exist, we'll use count query instead
    }
  }

  // Get new count
  const { count: newCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', content_type)
    .eq('content_id', content_id);

  return NextResponse.json({ 
    success: true, 
    like_count: newCount || 1,
    has_liked: true 
  }, { status: 201 });
}

// DELETE - Unlike content
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const contentType = searchParams.get('content_type');
  const contentId = searchParams.get('content_id');

  if (!contentType || !contentId) {
    return NextResponse.json({ error: 'content_type and content_id required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', user.id)
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get new count
  const { count: newCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  return NextResponse.json({ 
    success: true, 
    like_count: newCount || 0,
    has_liked: false 
  });
}
