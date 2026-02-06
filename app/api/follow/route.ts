import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { FollowWithFollowerProfile, FollowWithFollowingProfile } from '@/types/supabase-joins';

// GET - Check follow status or get followers/following
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('target_id');
  const type = searchParams.get('type'); // 'followers' | 'following' | 'check'

  if (type === 'check' && targetId) {
    // Check if current user follows target
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetId)
      .single();

    return NextResponse.json({ isFollowing: !!follow });
  }

  const userId = targetId || user.id;

  if (type === 'followers') {
    const { data: followers, error } = await supabase
      .from('follows')
      .select(`
        follower:profiles!follower_id(id, handle, display_name, avatar_url)
      `)
      .returns<FollowWithFollowerProfile[]>()
      .eq('following_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ followers: (followers ?? []).map((f: FollowWithFollowerProfile) => f.follower) });
  }

  if (type === 'following') {
    const { data: following, error } = await supabase
      .from('follows')
      .select(`
        following:profiles!following_id(id, handle, display_name, avatar_url)
      `)
      .returns<FollowWithFollowingProfile[]>()
      .eq('follower_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ following: (following ?? []).map((f: FollowWithFollowingProfile) => f.following) });
  }

  // Get counts
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return NextResponse.json({
    followers_count: followersCount || 0,
    following_count: followingCount || 0,
  });
}

// POST - Follow a user
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { target_id } = body;

  if (!target_id) {
    return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
  }

  if (target_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', target_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already following' }, { status: 400 });
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: target_id,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: target_id,
    type: 'follow',
    message: 'Someone started following you',
    data: { follower_id: user.id },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE - Unfollow a user
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('target_id');

  if (!targetId) {
    return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}