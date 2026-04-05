/**
 * POST /api/posts/[id]/view
 *
 * Records a view event for a post, applying the full view-counting rules (spec §3):
 *
 *   - Find the root post (follow original_post_id chain).
 *   - Identify the sharer of the viewed instance (author_id of that post).
 *   - Determine if this is the sharer's FIRST share of this root post
 *     (earliest post by that sharer referencing this root).
 *
 *   Rules:
 *     a) Viewer is the original author  → no-op.
 *     b) Viewer is the sharer            → no-op.
 *     c) First share instance:
 *          → increment root.view_count, record in post_views (upsert).
 *     d) Subsequent share instance:
 *          → only increment/record if viewer has NEVER viewed this root before.
 *
 * This endpoint is idempotent — safe to call on every qualifying impression.
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

  // ── 1. Fetch the viewed post ──────────────────────────────────────────────
  const { data: viewedPost, error: postErr } = await db
    .from('app_posts')
    .select('id, user_id, original_post_id, view_count')
    .eq('id', postId)
    .single();

  if (postErr || !viewedPost) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // ── 2. Resolve root post ──────────────────────────────────────────────────
  // Follow the chain: if this post is itself a share, find the root.
  let rootPostId: string = viewedPost.original_post_id ?? viewedPost.id;

  if (viewedPost.original_post_id) {
    // Walk up one level; the schema stores the direct original, not necessarily root.
    // To be safe, keep walking while original_post_id exists (max depth guard).
    let current = viewedPost;
    let depth = 0;
    while (current.original_post_id && depth < 10) {
      const { data: parent } = await db
        .from('app_posts')
        .select('id, user_id, original_post_id')
        .eq('id', current.original_post_id)
        .single();
      if (!parent) break;
      current = parent;
      depth++;
    }
    rootPostId = current.id;
  }

  // ── 3. Fetch root post author ─────────────────────────────────────────────
  const { data: rootPost } = await db
    .from('app_posts')
    .select('id, user_id, view_count')
    .eq('id', rootPostId)
    .single();

  if (!rootPost) {
    return NextResponse.json({ error: 'Root post not found' }, { status: 404 });
  }

  const originalAuthorId: string = rootPost.user_id;
  const sharerId: string = viewedPost.user_id; // author of the viewed instance

  // ── 4. Viewer exclusions ──────────────────────────────────────────────────
  if (user.id === originalAuthorId || user.id === sharerId) {
    return NextResponse.json({ ok: true, counted: false, reason: 'excluded_viewer' });
  }

  // ── 5. Determine if this is the sharer's first share ─────────────────────
  // The sharer's first share is the oldest post they have referencing this root.
  let isFirstShare: boolean;

  if (viewedPost.id === rootPostId) {
    // Viewer is looking at the original post itself — treat as first share.
    isFirstShare = true;
  } else {
    const { data: sharerPosts } = await db
      .from('app_posts')
      .select('id, created_at')
      .eq('user_id', sharerId)
      .eq('original_post_id', rootPostId)
      .order('created_at', { ascending: true })
      .limit(1);

    const oldestShareId: string | null = sharerPosts?.[0]?.id ?? null;
    isFirstShare = oldestShareId === postId;
  }

  // ── 6. Apply counting rules ───────────────────────────────────────────────
  if (isFirstShare) {
    // Rule c: always counts for new viewers (already excluded author + sharer above).
    await db
      .from('app_posts')
      .update({ view_count: (rootPost.view_count ?? 0) + 1 })
      .eq('id', rootPostId);

    await db
      .from('post_views')
      .upsert({ root_post_id: rootPostId, viewer_id: user.id, viewed_at: new Date().toISOString() })
      .select();

    return NextResponse.json({ ok: true, counted: true });
  }

  // Rule d: subsequent share — only count if viewer has never seen this root.
  const { data: existingView } = await db
    .from('post_views')
    .select('viewer_id')
    .eq('root_post_id', rootPostId)
    .eq('viewer_id', user.id)
    .maybeSingle();

  if (existingView) {
    return NextResponse.json({ ok: true, counted: false, reason: 'already_seen' });
  }

  // New viewer on a subsequent share — count it.
  await db
    .from('app_posts')
    .update({ view_count: (rootPost.view_count ?? 0) + 1 })
    .eq('id', rootPostId);

  await db
    .from('post_views')
    .upsert({ root_post_id: rootPostId, viewer_id: user.id, viewed_at: new Date().toISOString() })
    .select();

  return NextResponse.json({ ok: true, counted: true });
}
