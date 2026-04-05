/**
 * GET /api/posts/profile/[userId]
 *
 * Profile feed — returns up to 50 posts for a given user profile (spec §2).
 *
 * Composition:
 *   1. Up to 25 saved posts (permanent, user-curated), ordered by save date DESC.
 *   2. Remaining slots (up to 50 - saved_count) filled with the user's most
 *      recent ephemeral posts, excluding any already present in the saved set.
 *
 * Visibility rules: if the requesting viewer is NOT in the profile owner's
 * close-friends list, close_friends posts are hidden.
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Determine if viewer is in subject's close-friends list ────────────────
  const isOwner = user.id === userId;
  let isCloseFriend = false;

  if (!isOwner) {
    const { data: cfRow } = await (supabase as any)
      .from('close_friends')
      .select('user_id')
      .eq('user_id', userId)
      .eq('friend_id', user.id)
      .maybeSingle();
    isCloseFriend = !!cfRow;
  }

  // ── Fetch saved posts (up to 25) ──────────────────────────────────────────
  const { data: savedRows } = await (supabase as any)
    .from('saved_posts')
    .select('post_id, saved_at, app_posts!inner(*, profiles!inner(id, handle, display_name, avatar_url))')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .limit(25);

  const savedSet = new Set<string>();
  const savedPosts: unknown[] = [];

  for (const row of savedRows ?? []) {
    const post = row.app_posts as any;
    if (!post) continue;
    // Apply visibility filter
    if (post.post_visibility === 'close_friends' && !isOwner && !isCloseFriend) continue;
    savedSet.add(post.id);
    savedPosts.push({ ...post, is_saved: true });
  }

  // ── Fill remaining slots with ephemeral posts ─────────────────────────────
  const ephemeralSlots = Math.max(0, 50 - savedPosts.length);
  let ephemeralPosts: unknown[] = [];

  if (ephemeralSlots > 0) {
    const { data: ephemeralRows } = await (supabase as any)
      .from('app_posts')
      .select('*, profiles!inner(id, handle, display_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(ephemeralSlots + savedSet.size); // over-fetch to account for exclusions

    for (const post of ephemeralRows ?? []) {
      if (savedSet.has(post.id)) continue;
      if (post.post_visibility === 'close_friends' && !isOwner && !isCloseFriend) continue;
      ephemeralPosts.push({ ...post, is_saved: false });
      if (ephemeralPosts.length >= ephemeralSlots) break;
    }
  }

  const posts = [...savedPosts, ...ephemeralPosts];

  return NextResponse.json({ posts, saved_count: savedPosts.length });
}
