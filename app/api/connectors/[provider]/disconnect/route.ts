/**
 * app/api/connectors/[provider]/disconnect/route.ts
 *
 * DELETE /api/connectors/:provider/disconnect
 *
 * Removes a connector account for the authenticated user.
 * Clears the token_blob and sets status = 'disconnected' in connector_accounts.
 *
 * Security rules (AXIOM 4 — Security by Default, ARCHITECTURE.md §5):
 *   - Requires authenticated user via supabase.auth.getUser()
 *   - Only deletes the row where user_id matches the auth user — no admin bypass
 *   - token_blob is wiped server-side; never returned to client
 *   - Returns 204 No Content on success
 *   - Returns 404 if no connector account found for this user+provider combo
 *
 * LAW.md §3 — every visible action must do something real.
 * ACTION_AUDIT.md — was labelled 🟠 drifted (disconnect handler not confirmed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider } = await params;

  if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
    return NextResponse.json({ ok: false, error: 'Provider is required' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify the connector account exists for this user before attempting delete
  const { data: existing, error: fetchError } = await db
    .from('connector_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: 'Connector not found' }, { status: 404 });
  }

  // Hard delete — removes credentials and token_blob entirely.
  // Using both user_id + provider in the WHERE clause as belt-and-suspenders
  // so RLS + application code both enforce ownership.
  const { error: deleteError } = await db
    .from('connector_accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider);

  if (deleteError) {
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
  }

  // 204 No Content — successful disconnect
  return new NextResponse(null, { status: 204 });
}
