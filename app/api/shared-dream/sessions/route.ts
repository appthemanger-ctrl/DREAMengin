// app/api/shared-dream/sessions/route.ts
// GET  — list sessions the current user is a member of
// POST — create a new named session

import { NextRequest, NextResponse, connection } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeGetUser } from '@/lib/supabase/safeGetUser';
import { z } from 'zod';

// Escape hatch for missing database types to prevent "Type instantiation is excessively deep"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient;

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function GET(_req: NextRequest) {
  await connection();
  const supabase = await createServerClient();
  const user = await safeGetUser(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Cast client to bypass the TypeScript compiler infinite loop
  const db = supabase as AnyClient;

  const { data, error: dbError } = await db
    .from('shared_dream_sessions')
    .select(`
      id, name, channel_id, engin_state, active_engins,
      session_count, last_active_at, created_at,
      shared_dream_members!inner(user_id, role, last_seen_at)
    `)
    .eq('shared_dream_members.user_id', user.id)
    .order('last_active_at', { ascending: false })
    .limit(20);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(req: NextRequest) {
  await connection();
  const supabase = await createServerClient();
  const user = await safeGetUser(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const channelId = `shared-dream:${crypto.randomUUID()}`;

  // Cast client to bypass the TypeScript compiler infinite loop
  const db = supabase as AnyClient;

  const { data: session, error: insertError } = await db
    .from('shared_dream_sessions')
    .insert({
      name: parsed.data.name,
      channel_id: channelId,
      owner_id: user.id,
      engin_state: {},
      active_engins: [],
    })
    .select('id, name, channel_id, created_at')
    .single();

  if (insertError || !session) {
    return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 });
  }

  // Auto-join as host using the safe client
  await db.from('shared_dream_members').insert({
    session_id: session.id,
    user_id: user.id,
    role: 'host',
  });

  // Log creation activity using the safe client
  await db.from('shared_dream_activity').insert({
    session_id: session.id,
    user_id: user.id,
    kind: 'created',
    label: `Shared dream "${parsed.data.name}" created`,
  });

  return NextResponse.json({ session }, { status: 201 });
}
