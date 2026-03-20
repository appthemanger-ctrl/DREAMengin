// app/api/admin/observability/route.ts
//
// Admin-only endpoint that returns the current telemetry snapshot and
// correlation result from the IDARi observability collector.
//
// Security:
//   - Requires an active Supabase session.
//   - Requires the user to be an admin or owner (same gate as /api/ai/idari).
//   - IDARI_PASSWORD must be set in the environment.
//
// Intended usage: IDariPanel polls this endpoint to display the live
// observability dashboard in the admin UI.

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/ai/triad';
import { getSnapshot, getBufferStats } from '@/lib/observability/collector';
import { correlate } from '@/lib/observability/correlator';
import { inferRootCause } from '@/lib/observability/rootCauseAnalyzer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Service availability guard — matches /api/ai/idari
  if (!process.env.IDARI_PASSWORD) {
    return jsonApiError(
      503,
      'SERVICE_UNAVAILABLE',
      'IDARi observability is not configured. IDARI_PASSWORD must be set.',
    );
  }

  // Auth check
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in to access observability data.');
  }

  // Admin/owner gate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isOwner = isOwnerEmail(user.email);
  const dbRole = (roleData as { role?: string } | null)?.role;
  const isAdmin = isOwner || dbRole === 'admin';

  if (!isAdmin) {
    return jsonApiError(403, 'FORBIDDEN', 'Observability data is admin-only.');
  }

  // Parse optional window_ms query param (default: 5 minutes)
  const url = new URL(req.url);
  const rawWindow = url.searchParams.get('window_ms');
  const windowMs = rawWindow
    ? Math.min(Math.max(parseInt(rawWindow, 10), 60_000), 60 * 60 * 1000)
    : 5 * 60 * 1000;

  const snapshot = getSnapshot(windowMs);
  const correlation = correlate(snapshot);
  const root_cause = inferRootCause(correlation.anomalies, snapshot);
  const buffer_stats = getBufferStats();

  return NextResponse.json(
    {
      snapshot,
      correlation,
      root_cause,
      buffer_stats,
      window_ms: windowMs,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
