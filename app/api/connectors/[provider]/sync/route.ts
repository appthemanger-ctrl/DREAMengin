/**
 * app/api/connectors/[provider]/sync/route.ts
 *
 * Phase 5 — POST /api/connectors/{provider}/sync
 *
 * User-triggered sync: authenticates the requesting user, fetches the stored
 * connector credentials, and delegates the full sync pipeline to
 * lib/connectors/reconcile.ts (shared with the cron fallback route).
 *
 * Supported providers: mastodon, bluesky, github, reddit, nostr, youtube, instagram.
 * Instagram syncs own-media only (Basic Display API) — no follower feed.
 *
 * Never returns token_blob to the client.
 *
 * AXIOM 4 — Security by Default: provider tokens never leave the server.
 * ARCHITECTURE.md §3 — Logic layer (lib/connectors) handles provider calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { reconcileConnector } from '@/lib/connectors/reconcile';
import { DISPATCH_SUPPORTED_PROVIDERS } from '@/lib/connectors/syncDispatch';
import type { ConnectorSyncResponse } from '@/types/connector';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse<ConnectorSyncResponse>> {
  const { provider } = await params;
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, fetched: 0, stored: 0, last_synced_at: '', error: 'Unauthorised' },
      { status: 401 },
    );
  }

  // Guard: provider must be in the dispatch set before hitting the DB.
  if (!(DISPATCH_SUPPORTED_PROVIDERS as readonly string[]).includes(provider)) {
    return NextResponse.json(
      { ok: false, fetched: 0, stored: 0, last_synced_at: '', error: `Provider "${provider}" sync not supported.` },
      { status: 400 },
    );
  }

  // Fetch stored credentials (token_blob — server-side only).
  // db cast to `any` because connector_accounts is not in the generated Supabase types.
  const { data: account, error: fetchError } = await db
    .from('connector_accounts')
    .select('status, token_blob')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .maybeSingle();

  if (fetchError || !account) {
    return NextResponse.json({
      ok: false, fetched: 0, stored: 0, last_synced_at: '',
      error: 'Connector not found. Connect first.',
    }, { status: 404 });
  }

  if (account.status !== 'connected') {
    return NextResponse.json({
      ok: false, fetched: 0, stored: 0, last_synced_at: '',
      error: `Connector status is "${account.status}". Please reconnect.`,
    }, { status: 409 });
  }

  // Delegate the full fetch → dedup → upsert pipeline to the shared reconcile module.
  const result = await reconcileConnector(
    db,
    user.id,
    provider,
    account.token_blob as Record<string, unknown>,
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, fetched: result.fetched, stored: result.stored, last_synced_at: result.last_synced_at, error: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    fetched: result.fetched,
    stored: result.stored,
    last_synced_at: result.last_synced_at,
  });
}
