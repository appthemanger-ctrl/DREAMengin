import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/scheduled-posts
 *
 * CRUD for the ContentScheduler surface.
 *
 * Architecture justification:
 *   docs/AXIOMS.md §3 — every visible action must do something real.
 *   ContentScheduler previously had a "Schedule" button with no handler.
 *   This route backs real creation, listing, updating, and deletion of
 *   scheduled posts.
 *
 *   docs/LAW.md §2 — nothing is public by default.
 *   All rows are private to the authenticated owner (enforced by RLS +
 *   server-side auth check).
 *
 * GET    ?limit=&offset=  — list the caller's scheduled posts
 * POST                    — create a new scheduled post
 * PUT                     — update an existing scheduled post (body: {id, ...fields})
 * DELETE ?id=             — delete one scheduled post
 *
 * Note: `scheduled_posts` exists in migration 20260320000000_scheduled_posts.sql
 * but may not yet appear in the generated SupabaseClient types. We cast to `any`
 * (same pattern used in messages/route.ts and others) until the type snapshot
 * is regenerated.
 */

 
type AnyClient = any;

// ---------------------------------------------------------------------------
// GET — list scheduled posts
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const { data, error } = await (supabase as AnyClient)
    .from('scheduled_posts')
    .select('id, title, content, scheduled_for, status, platforms, created_at, updated_at')
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

// ---------------------------------------------------------------------------
// POST — create a scheduled post
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { title = '', content, scheduled_for, platforms = [] } = body;

  if (!content || String(content).trim().length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }
  if (!scheduled_for) {
    return NextResponse.json({ error: 'scheduled_for is required' }, { status: 400 });
  }

  const { data, error } = await (supabase as AnyClient)
    .from('scheduled_posts')
    .insert({
      user_id:       user.id,
      title:         String(title).trim(),
      content:       String(content).trim(),
      scheduled_for: String(scheduled_for),
      platforms:     Array.isArray(platforms) ? platforms : [],
      status:        'scheduled',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}

// ---------------------------------------------------------------------------
// PUT — update an existing scheduled post
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Only allow safe fields to be updated
  const allowed: Record<string, unknown> = {};
  if (rest.title         !== undefined) allowed.title         = String(rest.title).trim();
  if (rest.content       !== undefined) allowed.content       = String(rest.content).trim();
  if (rest.scheduled_for !== undefined) allowed.scheduled_for = String(rest.scheduled_for);
  if (rest.platforms     !== undefined) allowed.platforms     = Array.isArray(rest.platforms) ? rest.platforms : [];
  if (rest.status        !== undefined) allowed.status        = rest.status;

  const { data, error } = await (supabase as AnyClient)
    .from('scheduled_posts')
    .update(allowed)
    .eq('id', String(id))
    .eq('user_id', user.id)      // RLS double-guard
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

// ---------------------------------------------------------------------------
// DELETE — remove a scheduled post
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await (supabase as AnyClient)
    .from('scheduled_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);   // RLS double-guard

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

