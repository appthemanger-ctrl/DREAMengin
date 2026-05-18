// app/api/shared-dream/sessions/[id]/route.ts
// GET   — load session + members + recent activity (securely checked)
// PATCH — save merged engin state (called by useSharedDreamSession.flushBuffer)

import { NextRequest, NextResponse, connection } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeGetUser } from '@/lib/supabase/safeGetUser';
import { z } from 'zod';

// Escape hatch for missing database types to prevent "Type instantiation is excessively deep"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient;

interface SharedDreamSession {
  id: string;
  name: string;
  channel_id: string;
  owner_id: string;
  engin_state: Record<string, Record<string, unknown>>;
  active_engins: string[];
  session_count: number;
  last_active_at: string;
  created_at: string;
}

interface SupabaseRow<T> {
  data: T | null;
  error: { message: string } | null;
}

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
  const user = await safeGetUser(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use the casted client to bypass the TypeScript recursion issue
  const db = supabase as AnyClient;

  // 1. Auth Guard: Ensure the user is actually a member of this session
  const { data: membership, error: memberCheckError } = await db
    .from('shared_dream_members')
    .select('user_id')
    .eq('session_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberCheckError || !membership) {
    return NextResponse.json({ error: 'Forbidden: Not a member' }, { status: 403 });
  }

  // 2. Fetch primary session data
  const { data: session, error: sessionError }: SupabaseRow<SharedDreamSession> = await db
    .from('shared_dream_sessions')
    .select('id, name, channel_id, owner_id, engin_state, active_engins, session_count, last_active_at, created_at')
    .eq('id', id)
    .single();

  if (sessionError || !session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 3. Fetch related members and activity
  const { data: members } = await db
    .from('shared_dream_members')
    .select('user_id, role, joined_at, last_seen_at')
    .eq('session_id', id)
    .order('joined_at', { ascending: true });

  const { data: activity } = await db
    .from('shared_dream_activity')
    .select('id, user_id, kind, label, meta, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: false })
    .limit(30);

  // 4. Update user's last seen heartbeat safely using update (avoids upsert constraints)
  await db
    .from('shared_dream_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('session_id', id)
    .eq('user_id', user.id);

  return NextResponse.json({ session, members: members ?? [], activity: activity ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await params;
  const supabase = await createServerClient();
  const user = await safeGetUser(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = supabase as AnyClient;

  // Verify membership before allowing edits
  const { data: membership }: SupabaseRow<{ user_id: string }> = await db
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

  const { error: updateError }: SupabaseRow<never> = await db
    .from('shared_dream_sessions')
    .update(update)
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
