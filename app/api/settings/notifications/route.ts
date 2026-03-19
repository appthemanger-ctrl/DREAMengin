/**
 * app/api/settings/notifications/route.ts
 *
 * GET  /api/settings/notifications  — Returns the authenticated user's notification settings
 * POST /api/settings/notifications  — Upserts notification settings into the settings table
 *
 * Data is stored in the JSONB `data` column under the `notifications` key in
 * the existing `settings` table (initial schema migration, user_id PK + RLS).
 *
 * Security (AXIOM 4):
 *   - auth.uid() = user_id enforced by RLS on the settings table
 *   - Requires authenticated user; returns 401 otherwise
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
  const notifications = (data?.data as any)?.notifications ?? null;
  return NextResponse.json({ ok: true, notifications });
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
  const db2 = supabase as any;

  // Fetch existing settings first to merge
  const { data: existing } = await db2
    .from('settings')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentData = (existing?.data ?? {}) as Record<string, any>;
  const merged = { ...currentData, notifications: body };

  const { error: upsertError } = await db2
    .from('settings')
    .upsert({ user_id: user.id, data: merged }, { onConflict: 'user_id' });

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
