// app/api/shared-dream/sessions/[id]/route.ts
// GET   — load session + members + recent activity
// PATCH — save merged engin state (called by useSharedDreamSession.flushBuffer)

import { NextRequest, NextResponse, connection } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeGetUser } from '@/lib/supabase/safeGetUser';
import { z } from 'zod';

const PatchSchema = z.object({
  engin_state: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  active_engins: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await params;
  const supabase = await createServerClient();
  const { user, error } = await safeGetUser(supabase);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: session, error: sessionError } = await supabase
    .from('shared_dream_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (sessionError || !session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: members } = await supabase
    .from('shared_dream_members')
    .select('user_id, role, joined_at, last_seen_at')
    .eq('session_id', id)
    .order('joined_at', { ascending: true });

  const { data: activity } = await supabase
    .from('shared_dream_activity')
    .select('id, user_id, kind, label, meta, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: false })
    .limit(30);

  // Touch membership last_seen_at
  await supabase
    .from('shared_dream_members')
    .upsert(
      { session_id: id, user_id: user.id, last_seen_at: new Date().toISOString() },
      { onConflict: 'session_id,user_id' },
    );

  return NextResponse.json({ session, members: members ?? [], activity: activity ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await params;
  const supabase = await createServerClient();
  const { user, error } = await safeGetUser(supabase);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Must be a member to write
  const { data: membership } = await supabase
    .from('shared_dream_members')
    .select('user_id')
    .eq('session_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const update: Record<string, unknown> = { last_active_at: new Date().toISOString() };
  if (parsed.data.engin_state !== undefined) update['engin_state'] = parsed.data.engin_state;
  if (parsed.data.active_engins !== undefined) update['active_engins'] = parsed.data.active_engins;

  const { error: updateError } = await supabase
    .from('shared_dream_sessions')
    .update(update)
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
