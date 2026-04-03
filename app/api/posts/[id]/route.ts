/**
 * app/api/posts/[id]/route.ts
 *
 * DELETE /api/posts/:id
 *
 * Deletes a post row from the `app_posts` table.
 *
 * Security rules (AXIOM 4 — Security by Default, ARCHITECTURE.md §5):
 *   - Requires authenticated user via supabase.auth.getUser()
 *   - Verifies ownership: post.user_id === auth user id before deleting
 *   - Returns 204 No Content on success
 *   - Returns 404 if post not found or not owned by caller
 *   - Never leaks other users' post data in error responses
 *
 * LAW.md §3 — every visible action must do something real.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';


export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch post to verify ownership — never trust client-supplied user_id
   
  const db = supabase as any;
  const { data: post, error: fetchError } = await db
    .from('app_posts')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !post) {
    // Return 404 regardless of whether the post exists but belongs to another
    // user — avoids leaking existence of private posts.
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (post.user_id !== user.id) {
    // Ownership check — caller does not own this post
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const { error: deleteError } = await db
    .from('app_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // belt-and-suspenders: DB-level ownership guard

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 204 No Content — successful delete with no body
  return new NextResponse(null, { status: 204 });
}
