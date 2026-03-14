import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch music releases
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const visibility = searchParams.get('visibility') || 'all';

  let query = supabase
    .from('music_releases')
    .select(`
      *,
      profiles!inner(id, handle, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (visibility === 'public') {
    query = query.eq('visibility', 'public');
  } else if (visibility === 'all') {
    query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
  }

  const { data: releases, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ releases });
}

// POST - Upload/create a music release
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, embed_url, visibility = 'public', genre, cover_url } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data: release, error } = await supabase
    .from('music_releases')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      embed_url: embed_url?.trim() || null,
      visibility,
      genre: genre?.trim() || null,
      cover_url: cover_url || null,
    })
    .select(`
      *,
      profiles!inner(id, handle, display_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create feed item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('feed_items').insert({
    user_id: user.id,
    type: 'music',
    content: { title: release.title, release_id: release.id },
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ release }, { status: 201 });
}

// DELETE - Remove a music release
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Release ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('music_releases')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
