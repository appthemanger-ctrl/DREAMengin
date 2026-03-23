/**
 * app/api/settings/appearance/route.ts
 *
 * GET  /api/settings/appearance  — Returns the authenticated user's appearance settings
 * POST /api/settings/appearance  — Upserts appearance settings into the settings table
 *
 * Data is stored in the JSONB `data` column under the `appearance` key in the
 * existing `settings` table (same pattern as /api/settings/privacy).
 *
 * Phase 8 §I Point 83: Appearance settings (theme, palette preferences) save to
 * the database and restore on session load.
 *
 * Security (AXIOM 4):
 *   - auth.uid() = user_id enforced by RLS on the settings table
 *   - Requires authenticated user; returns 401 otherwise
 *
 * Architecture: ARCHITECTURE.md §10 (App Router, Supabase SSR client).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from('settings')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appearance = (data?.data as any)?.appearance ?? null;
  return NextResponse.json({ ok: true, appearance });
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

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Invalid settings object' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Read existing settings first to merge (don't overwrite other keys like privacy)
  const { data: existing } = await db
    .from('settings')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingData = (existing?.data as any) ?? {};
  const merged = { ...existingData, appearance: body };

  const { error: upsertError } = await db
    .from('settings')
    .upsert(
      { user_id: user.id, data: merged },
      { onConflict: 'user_id' },
    );

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
