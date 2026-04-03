// app/api/settings/feed/route.ts
// Phase 8 §A — Feed preference settings persisted to the database.
//
// GET  /api/settings/feed  — Returns the authenticated user's feed preferences
// POST /api/settings/feed  — Upserts feed preferences into profiles.feed_preferences
//
// Architecture: docs/ARCHITECTURE.md §3 — user settings live in Supabase.
// Privacy (AXIOM 5): feed_preferences is user-scoped; RLS prevents cross-user reads.
//
// Preferences shape:
//   {
//     showDreamenginUpdates?: boolean,
//     autoRefresh?: boolean,
//     showEmptyStateGuides?: boolean,
//     enabledProviders?: string[],   -- connector provider IDs to show in feed
//     sortOrder?: "recent" | "trending"
//   }

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';


export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('feed_preferences')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

   
  const prefs = ((data as any)?.feed_preferences as Record<string, unknown>) ?? {};
  return NextResponse.json({ ok: true, preferences: prefs });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: 'Preferences must be a JSON object' }, { status: 400 });
  }

  // Allowlist: only persist known preference keys
  const allowed = new Set([
    'showDreamenginUpdates',
    'autoRefresh',
    'showEmptyStateGuides',
    'enabledProviders',
    'sortOrder',
  ]);
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (allowed.has(k)) safe[k] = v;
  }

   
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ feed_preferences: safe })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, preferences: safe });
}
