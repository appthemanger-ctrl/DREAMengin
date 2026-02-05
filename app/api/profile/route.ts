import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch profile
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const userId = searchParams.get('user_id');

  let query = supabase.from('profiles').select('*');

  if (handle) {
    query = query.eq('handle', handle);
  } else if (userId) {
    query = query.eq('id', userId);
  } else if (user) {
    query = query.eq('id', user.id);
  } else {
    return NextResponse.json({ error: 'No profile identifier provided' }, { status: 400 });
  }

  const { data: profile, error } = await query.single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Get follower/following counts
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  // Check if current user follows this profile
  let isFollowing = false;
  if (user && profile.id !== user.id) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single();
    isFollowing = !!follow;
  }

  return NextResponse.json({
    profile: {
      ...profile,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_following: isFollowing,
      is_own_profile: user?.id === profile.id,
    },
  });
}

// PUT - Update profile
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { display_name, bio, avatar_url, banner_url, website, location } = body;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (display_name !== undefined) updateData.display_name = display_name?.trim();
  if (bio !== undefined) updateData.bio = bio?.trim();
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
  if (banner_url !== undefined) updateData.banner_url = banner_url;
  if (website !== undefined) updateData.website = website?.trim();
  if (location !== undefined) updateData.location = location?.trim();

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
