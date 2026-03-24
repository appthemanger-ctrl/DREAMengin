import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/favorites
 *
 * Save / unsave posts and other content.  Backed by the `favorites` table
 * (target_type = 'post', target_id = post UUID).
 *
 * Architecture justification:
 *   docs/AXIOMS.md §3 — every visible action must do something real.
 *   HomeFeed's Bookmark button previously had only local state (no backend).
 *   This route backs real persistence using the existing `favorites` table
 *   introduced in migration 20260307000000_readme_gaps.sql.
 *
 *   docs/LAW.md §2 — nothing is public by default.
 *   Favorites are private to the owning user (enforced by RLS + server auth).
 *
 * GET    ?target_type=post&target_id=  — check saved status
 * POST                                 — save an item  { target_type, target_id }
 * DELETE ?target_type=&target_id=      — unsave an item
 *
 * Note: `favorites` exists in migration 20260307000000_readme_gaps.sql but
 * may not yet appear in the generated SupabaseClient types. We cast to `any`
 * on these queries (same pattern used in messages/route.ts and others) until
 * the type snapshot is regenerated.
 */

// Helper to get a type-escaped handle on tables not yet in the generated schema
 
type AnyClient = any;

// ---------------------------------------------------------------------------
// GET — check whether an item is already saved
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const target_type = searchParams.get('target_type');
  const target_id   = searchParams.get('target_id');

  if (!target_type || !target_id) {
    return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
  }

  const { data } = await (supabase as AnyClient)
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .single();

  return NextResponse.json({ saved: !!data });
}

// ---------------------------------------------------------------------------
// POST — save an item
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { target_type, target_id } = body;

  if (!target_type || !target_id) {
    return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
  }

  // favorites has a UNIQUE constraint on (user_id, target_type, target_id)
  // so we use an insert; on unique-violation (23505) treat as success (idempotent).
  const { error } = await (supabase as AnyClient)
    .from('favorites')
    .insert({ user_id: user.id, target_type: String(target_type), target_id: String(target_id) });

  // 23505 = unique_violation — already saved, treat as success
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true }, { status: 201 });
}

// ---------------------------------------------------------------------------
// DELETE — unsave an item
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const target_type = searchParams.get('target_type');
  const target_id   = searchParams.get('target_id');

  if (!target_type || !target_id) {
    return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
  }

  const { error } = await (supabase as AnyClient)
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: false });
}

