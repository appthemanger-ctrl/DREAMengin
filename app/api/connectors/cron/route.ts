/**
 * app/api/connectors/cron/route.ts
 *
 * Cron fallback endpoint — reconciles all connected connector accounts
 * for every user, using the shared reconcile pipeline.
 *
 * Invoked by Vercel cron (configured in vercel.json) and can also be
 * triggered manually in development for testing.
 *
 * Security:
 *   - Requires `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 *   - In production without CRON_SECRET: always rejected (no open cron endpoints).
 *   - In non-production without CRON_SECRET: allowed for dev convenience.
 *
 * Uses the Supabase service-role client to bypass RLS and iterate all users.
 * token_blob is NEVER returned in the response.
 *
 * AXIOM 4 — Security by Default.
 * ARCHITECTURE.md §3 — Logic layer (lib/connectors) handles provider calls.
 */

import type { ReconcileResult } from '@/lib/connectors/reconcile';
import { reconcileConnector } from '@/lib/connectors/reconcile';
import { DISPATCH_SUPPORTED_PROVIDERS } from '@/lib/connectors/syncDispatch';
import { isCronAuthorised } from '@/lib/connectors/webhookVerification';
import { createServiceClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;

interface CronSummary {
  ok: boolean;
  batchSize: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{
    provider: string;
    ok: boolean;
    fetched: number;
    stored: number;
    error?: string;
  }>;
}

function getCronBatchSize(): number {
  const parsed = Number.parseInt(process.env.CONNECTOR_CRON_BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_BATCH_SIZE;
  return Math.min(Math.max(parsed, 1), MAX_BATCH_SIZE);
}

export async function GET(req: NextRequest): Promise<NextResponse<CronSummary | { error: string }>> {
  // ── Authorisation ────────────────────────────────────────────────────────
  if (
    !isCronAuthorised(
      req.headers.get('authorization'),
      process.env.CRON_SECRET,
      process.env.NODE_ENV,
    )
  ) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // ── Supabase service-role client (bypasses RLS) ──────────────────────────
  let db;
  try {
    db = await createServiceClient();
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Service client unavailable: ${msg}` }, { status: 503 });
  }

   
  const anyDb = db as SupabaseClient;

  // ── Fetch all connected accounts for supported providers ─────────────────
  const batchSize = getCronBatchSize();
  const { data: accounts, error: fetchError } = await anyDb
    .from('connector_accounts')
    .select('user_id, provider, token_blob')
    .eq('status', 'connected')
    .in('provider', [...DISPATCH_SUPPORTED_PROVIDERS])
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(batchSize);

  if (fetchError) {
    return NextResponse.json(
      { error: `Failed to fetch connector accounts: ${fetchError.message}` },
      { status: 500 },
    );
  }

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({
      ok: true,
      batchSize,
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    });
  }

  // ── Reconcile each account ───────────────────────────────────────────────
  // Process sequentially to avoid stampeding provider APIs.
  const results: ReconcileResult[] = [];
  for (const account of accounts) {
    const result = await reconcileConnector(
      db,
      account.user_id as string,
      account.provider as string,
      (account.token_blob ?? {}) as Record<string, unknown>,
    );
    results.push(result);
  }

  const succeeded = results.filter((r) => r.ok).length;

  return NextResponse.json({
    ok: true,
    batchSize,
    processed: results.length,
    succeeded,
    failed: results.length - succeeded,
    // Never include userId or token data in the output; only safe summary fields.
    results: results.map((r) => ({
      provider: r.provider,
      ok: r.ok,
      fetched: r.fetched,
      stored: r.stored,
      ...(r.error ? { error: r.error } : {}),
    })),
  });
}