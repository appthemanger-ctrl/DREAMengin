/**
 * app/api/connectors/status/route.ts
 *
 * GET /api/connectors/status
 *
 * Returns the real connector statuses for the authenticated user from the
 * connector_accounts table. Never returns token_blob.
 *
 * Used by ConnectorsClient on mount to show real connected/disconnected state
 * instead of the registry defaultStatus values.
 *
 * Security (AXIOM 4 — Security by Default):
 *   - Requires authenticated user via supabase.auth.getUser()
 *   - RLS on connector_accounts enforces user_id = auth.uid() at DB layer
 *   - Returns 401 for unauthenticated requests
 *   - token_blob is never selected
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ConnectorStatus } from '@/lib/connectors/connectorRegistry';

export const dynamic = 'force-dynamic';

export interface ConnectorStatusEntry {
  status: ConnectorStatus;
  last_synced_at: string | null;
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, statuses: {} }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from('connector_accounts')
    .select('provider, status, last_synced_at')   // NEVER select token_blob
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ ok: false, statuses: {} }, { status: 500 });
  }

  const statuses: Record<string, ConnectorStatusEntry> = {};
  for (const row of (data ?? []) as Array<{ provider: string; status: ConnectorStatus; last_synced_at: string | null }>) {
    statuses[row.provider] = {
      status: row.status,
      last_synced_at: row.last_synced_at ?? null,
    };
  }

  return NextResponse.json({ ok: true, statuses });
}
