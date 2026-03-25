import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scanContent } from '@/lib/child-safety/childSafetyDetector';
import { reportChildSafetyIncident } from '@/lib/child-safety/ncmecReporter';
import { createHash } from 'crypto';

const PostCommentSchema = z.object({
  post_id: z.string().uuid({ message: 'post_id must be a valid UUID' }),
  content: z
    .string()
    .min(1, { message: 'Comment cannot be empty' })
    .max(1000, { message: 'Comment must be 1000 characters or fewer' }),
});

const DeleteCommentSchema = z.object({
  comment_id: z.string().uuid({ message: 'comment_id must be a valid UUID' }),
});

// GET /api/comments?post_id=<uuid>
// Returns comments for a post joined with profile display_name + avatar_url, ordered ASC
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('post_id');

  if (!postId) {
    return NextResponse.json({ data: null, error: 'post_id is required' }, { status: 400 });
  }

  const uuidCheck = z.string().uuid();
  const parsed = uuidCheck.safeParse(postId);
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'post_id must be a valid UUID' }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Fetch comments for the post ordered by created_at ASC
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (commentsError) {
    return NextResponse.json({ data: null, error: commentsError.message }, { status: 500 });
  }

  if (!comments || comments.length === 0) {
    return NextResponse.json({ data: [], error: null });
  }

  // Fetch profile data for all comment authors in one query
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, handle')
    .in('id', userIds);

  const profilesMap = Object.fromEntries(
    (profiles || []).map((p) => [p.id, p])
  );

  // Merge profile data into each comment
  const enriched = comments.map((c) => ({
    ...c,
    profile: profilesMap[c.user_id] ?? null,
  }));

  return NextResponse.json({ data: enriched, error: null });
}

// POST /api/comments
// Body: { post_id, content } — auth required
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PostCommentSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    return NextResponse.json({ data: null, error: message }, { status: 422 });
  }

  const { post_id, content } = parsed.data;

  // ── TheBoogieMan child safety scan (zero-tolerance) ──────────────────────
  const childSafetyResult = scanContent({ text: content });
  if (childSafetyResult.flagged) {
    const contentHash = createHash('sha256').update(content).digest('hex');
    reportChildSafetyIncident({
      reportedUserId: user.id,
      ruleCode: childSafetyResult.rule_code!,
      detectionResult: childSafetyResult,
      surface: 'comment',
      contentRef: `post:${post_id}:draft:${contentHash.slice(0, 16)}`,
      contentHash,
    }).catch((err) => console.error('[child-safety] comment report error:', err));

    return NextResponse.json(
      { data: null, error: 'Comment violates our child safety policy and has been blocked.' },
      { status: 451 },
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ post_id, user_id: user.id, content })
    .select('id, post_id, user_id, content, created_at')
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  // Enrich with profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, handle')
    .eq('id', user.id)
    .single();

  return NextResponse.json(
    { data: { ...comment, profile: profile ?? null }, error: null },
    { status: 201 }
  );
}

// DELETE /api/comments
// Body: { comment_id } — auth required; user can only delete own comments
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = DeleteCommentSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ');
    return NextResponse.json({ data: null, error: message }, { status: 422 });
  }

  const { comment_id } = parsed.data;

  // RLS enforces user_id = auth.uid() for delete, but we also check explicitly
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', comment_id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true }, error: null });
}
