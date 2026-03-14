import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch merch items
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get('seller_id');
  const category = searchParams.get('category');

  let query = supabase
    .from('merch')
    .select(`
      *,
      profiles!inner(id, handle, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (sellerId) {
    query = query.eq('user_id', sellerId);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: items, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items });
}

// POST - Create a merch listing
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, price, stock, image_url, category } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!price || price <= 0) {
    return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
  }

  const { data: item, error } = await supabase
    .from('merch')
    .insert({
      user_id: user.id,
      name: title.trim(),
      description: description?.trim() || null,
      price: parseFloat(price),
      image_url: image_url || null,
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
    type: 'merch',
    content: { title: item.name, item_id: item.id, price: item.price },
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ item }, { status: 201 });
}

// PUT - Update a merch listing
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, description, price, image_url } = body;

  if (!id) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updatePayload.name = title.trim();
  if (description !== undefined) updatePayload.description = description?.trim();
  if (price !== undefined) updatePayload.price = parseFloat(price);
  if (image_url !== undefined) updatePayload.image_url = image_url;

  const { data: item, error } = await supabase
    .from('merch')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item });
}

// DELETE - Remove a merch listing
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('merch')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
