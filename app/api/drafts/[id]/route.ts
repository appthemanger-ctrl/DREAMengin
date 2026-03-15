/**
 * app/api/drafts/[id]/route.ts
 *
 * DELETE /api/drafts/:id   — delete a single draft by id
 * PATCH  /api/drafts/:id   — update an existing draft (content, scheduled_at, etc.)
 *
 * Security rules (AXIOM 4 — Security by Default, ARCHITECTURE.md §5):
 *   - Requires authenticated user via supabase.auth.getUser()
 *   - Verifies ownership: draft.user_id === auth user id before delete/update
 *   - Returns 404 for not-found OR not-owned rows (avoid leaking existence)
 *
 * LAW.md §3 — every visible action must do something real.
 * ACTION_AUDIT.md — was labelled 🟡 fake-wired (no backend for drafts).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ── Validation ───────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  'post', 'video', 'story', 'thread',
  'caption', 'tweet_thread', 'bio', 'script',
] as const;

const PatchDraftSchema = z.object({
  content: z.string().min(1).max(10_000).optional(),
  content_type: z.enum(CONTENT_TYPES).optional(),
  title: z.string().max(200).nullable().optional(),
  scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
}).strict();

// ── DELETE /api/drafts/:id ───────────────────────────────────────────────────

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify ownership before deleting
  const { data: draft, error: fetchError } = await db
    .from('content_drafts')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !draft || draft.user_id !== user.id) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  const { error: deleteError } = await db
    .from('content_drafts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // belt-and-suspenders

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

// ── PATCH /api/drafts/:id ────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const parseResult = PatchDraftSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify ownership before updating
  const { data: existing, error: fetchError } = await db
    .from('content_drafts')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  const updates = {
    ...parseResult.data,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await db
    .from('content_drafts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, content, content_type, title, scheduled_at, created_at, updated_at')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ draft: updated });
}
