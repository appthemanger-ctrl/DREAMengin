/**
 * POST /api/posts/[id]/save
 * DELETE /api/posts/[id]/save
 *
 * Saves or unsaves a post to/from the calling user's profile (spec §2).
 *
 * FIFO queue: the user may have at most 25 saved posts.
 * When a 26th post is saved, the oldest saved post is automatically deleted
 * before inserting the new one.
 *
 * DELETE removes the post from saved_posts for this user.
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const MAX_SAVED_POSTS = 25;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = supabase as any;

  // Verify the post exists.
  const { data: post } = await db
    .from('app_posts')
    .select('id')
    .eq('id', postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Check if already saved.
  const { data: existing } = await db
    .from('saved_posts')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already_saved: true });
  }

  // ── FIFO: evict oldest if at capacity ─────────────────────────────────────
  const { count: savedCount } = await db
    .from('saved_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (typeof savedCount === 'number' && savedCount >= MAX_SAVED_POSTS) {
    // Find the oldest saved post and delete it.
    const { data: oldest } = await db
      .from('saved_posts')
      .select('id')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: true })
      .limit(1)
      .single();

    if (oldest) {
      await db.from('saved_posts').delete().eq('id', oldest.id);
    }
  }

  // ── Insert the new save ───────────────────────────────────────────────────
  const { error: insertErr } = await db
    .from('saved_posts')
    .insert({ user_id: user.id, post_id: postId, saved_at: new Date().toISOString() });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: true }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await (supabase as any)
    .from('saved_posts')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, unsaved: true });
}
