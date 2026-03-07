// app/api/marketplace/route.ts
// DreamMarketplace API — GET (browse) + POST (list an item).
//
// Security: AXIOM 4 — all writes are authenticated; price stored as
//   integer cents to avoid float rounding; is_published = false by default
//   so items only surface after admin review (LAW.md §2: nothing public by default).
// RLS: marketplace_items table RLS ensures sellers can only write their own rows
//   and only published rows (or their own) are readable.

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ── GET /api/marketplace?category=<category> ─────────────────────────
// Returns all published marketplace items, optionally filtered by category.
// Joins with profiles to surface seller handle + display name.
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let query = supabase
    .from('marketplace_items')
    .select(`
      id,
      title,
      description,
      category,
      price_cents,
      preview_url,
      tags,
      created_at,
      seller_id,
      profiles!marketplace_items_seller_id_fkey(
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(60);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data: items, error } = await query;

  if (error) {
    // Surface a clean error — never leak internal DB messages to client
    console.error('[marketplace GET]', error.message);
    return NextResponse.json({ error: 'Failed to fetch listings.' }, { status: 500 });
  }

  return NextResponse.json({ items: items ?? [] });
}

// ── POST /api/marketplace ─────────────────────────────────────────────
// Auth-gated. Inserts a new marketplace_item for the current user.
// is_published is always false — admin publishes after review.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Axiom 4 — all writes authenticated
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { title, description, category, price, tags } = body as {
    title?: string;
    description?: string;
    category?: string;
    price?: number | string;
    tags?: string;
  };

  // ── Input validation (server-side, Axiom 4) ──
  const trimmedTitle = (title ?? '').trim();
  if (!trimmedTitle || trimmedTitle.length === 0) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }
  if (trimmedTitle.length > 120) {
    return NextResponse.json({ error: 'Title must be 120 characters or fewer.' }, { status: 400 });
  }

  const VALID_CATEGORIES = ['widget', 'theme', 'connector', 'music'];
  const normalizedCategory = (category ?? '').toLowerCase().trim();
  if (!VALID_CATEGORIES.includes(normalizedCategory)) {
    return NextResponse.json(
      { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.` },
      { status: 400 },
    );
  }

  // Price: accept dollars as a float, store as integer cents.
  // 0 = free. Negative values are rejected.
  const priceFloat = parseFloat(String(price ?? 0));
  if (isNaN(priceFloat) || priceFloat < 0) {
    return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
  }
  const priceCents = Math.round(priceFloat * 100);

  // Tags: comma-separated string → trimmed string array, max 10 tags, 40 chars each
  const parsedTags = typeof tags === 'string'
    ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10)
    : [];
  if (parsedTags.some((t) => t.length > 40)) {
    return NextResponse.json({ error: 'Each tag must be 40 characters or fewer.' }, { status: 400 });
  }

  const { data: item, error: insertError } = await supabase
    .from('marketplace_items')
    .insert({
      seller_id:    user.id,
      title:        trimmedTitle,
      description:  description?.trim() || null,
      category:     normalizedCategory,
      price_cents:  priceCents,
      tags:         parsedTags,
      is_published: false, // always starts unpublished (LAW.md §2)
    })
    .select('id, title, category, price_cents, is_published, created_at')
    .single();

  if (insertError) {
    console.error('[marketplace POST]', insertError.message);
    return NextResponse.json({ error: 'Failed to create listing.' }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
