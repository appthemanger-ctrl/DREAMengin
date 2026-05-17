// app/api/journey/route.ts
// Journey Trail API — private, owner-only reads and writes.
//
// Architecture:
//   docs/LAW.md §2 — nothing public by default.
//   docs/AXIOMS.md §4 — security by default (fail-closed on auth failure).
//   docs/ARCHITECTURE.md §10 — render on demand, not real-time push.
//
// Endpoints:
//   GET  /api/journey               → list the authenticated user's journey dots (newest first)
//   GET  /api/journey?kind=X&check=1 → existence check for deduplication
//   GET  /api/journey?limit=N       → cap results (default 100, max 200)
//   POST /api/journey               → insert a new journey dot (owner-only via RLS)

import type { Json } from '@/types/supabase';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';


// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kind  = searchParams.get('kind');
  const check = searchParams.get('check') === '1';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 200);

  // Existence check — used by hasJourneyDot() to avoid duplicate first-ever dots
  if (check && kind) {
    let countQuery = supabase
      .from('journey_dots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kind', kind);

    // When a surface is specified, scope the check to kind+surface together.
    // This enables per-surface deduplication of the same kind (e.g. surface_first_entry).
    const surface = searchParams.get('surface');
    if (surface) countQuery = countQuery.eq('surface', surface);

    const { count } = await countQuery;
    return NextResponse.json({ exists: (count ?? 0) > 0 });
  }

  // Build query — owner-filtered at query level (defense-in-depth alongside RLS)
  let query = supabase
    .from('journey_dots')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (kind) query = query.eq('kind', kind);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ dots: data ?? [] });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Required-field validation
  if (!body.kind || typeof body.kind !== 'string') {
    return NextResponse.json({ error: 'kind is required and must be a string' }, { status: 400 });
  }
  if (!body.label || typeof body.label !== 'string') {
    return NextResponse.json({ error: 'label is required and must be a string' }, { status: 400 });
  }

  // Validate significance range if provided
  const sig = body.significance !== undefined ? Number(body.significance) : 0.5;
  if (isNaN(sig) || sig < 0 || sig > 1) {
    return NextResponse.json({ error: 'significance must be a number between 0 and 1' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('journey_dots')
    .insert({
      user_id:      user.id,
      kind:         body.kind,
      surface:      typeof body.surface === 'string' ? body.surface : '',
      label:        body.label,
      significance: sig,
      domain_color: typeof body.domain_color === 'string' ? body.domain_color : '#c8981a',
      metadata:     (typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {}) as Json,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ dot: data }, { status: 201 });
}
