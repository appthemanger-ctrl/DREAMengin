// app/api/blocks/route.ts
// Block / unblock users and retrieve the caller's block list.
// RLS on user_blocks enforces owner-only access at the DB layer.
// Constitution Art. I Rule 1 — privacy by default; blocks are private.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonApiError } from '@/lib/api/route';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BlockBodySchema = z.object({
  blocked_id: z.string().uuid(),
});

/** GET /api/blocks — return the caller's current block list */
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');

  const { data, error } = await supabase
    .from('user_blocks')
    .select('id, blocked_id, created_at')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return jsonApiError(500, 'DB_ERROR', error.message);
  return NextResponse.json({ blocks: data ?? [] });
}

/** POST /api/blocks — block a user */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');

  let body: unknown;
  try { body = await req.json(); } catch { return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.'); }

  const parsed = BlockBodySchema.safeParse(body);
  if (!parsed.success) return jsonApiError(400, 'VALIDATION_ERROR', 'blocked_id must be a valid UUID.');

  const { blocked_id } = parsed.data;
  if (blocked_id === user.id) return jsonApiError(400, 'SELF_BLOCK', 'You cannot block yourself.');

  const { data, error } = await supabase
    .from('user_blocks')
    .upsert(
      { blocker_id: user.id, blocked_id },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
    )
    .select('id, blocked_id, created_at')
    .single();

  if (error) return jsonApiError(500, 'DB_ERROR', error.message);
  return NextResponse.json({ ok: true, block: data }, { status: 201 });
}

/** DELETE /api/blocks?blocked_id=<uuid> — unblock a user */
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');

  const blocked_id = req.nextUrl.searchParams.get('blocked_id');
  if (!blocked_id || !/^[0-9a-f-]{36}$/.test(blocked_id)) {
    return jsonApiError(400, 'MISSING_PARAM', 'blocked_id query param is required and must be a valid UUID.');
  }

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blocked_id);

  if (error) return jsonApiError(500, 'DB_ERROR', error.message);
  return NextResponse.json({ ok: true });
}
