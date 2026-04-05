/**
 * GET    /api/close-friends          — list the caller's close friends
 * POST   /api/close-friends          — add a user to close friends (body: { friend_id })
 * DELETE /api/close-friends?friend_id — remove a user from close friends
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await (supabase as any)
    .from('close_friends')
    .select('friend_id, added_at, profiles!close_friends_friend_id_fkey(handle, display_name, avatar_url)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ close_friends: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { friend_id } = body ?? {};

  if (!friend_id || typeof friend_id !== 'string') {
    return NextResponse.json({ error: 'friend_id is required' }, { status: 400 });
  }

  if (friend_id === user.id) {
    return NextResponse.json({ error: 'Cannot add yourself to close friends' }, { status: 400 });
  }

  const { error } = await (supabase as any)
    .from('close_friends')
    .upsert({ user_id: user.id, friend_id, added_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, added: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const friend_id = searchParams.get('friend_id');

  if (!friend_id) {
    return NextResponse.json({ error: 'friend_id query param required' }, { status: 400 });
  }

  const { error } = await (supabase as any)
    .from('close_friends')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', friend_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, removed: true });
}
