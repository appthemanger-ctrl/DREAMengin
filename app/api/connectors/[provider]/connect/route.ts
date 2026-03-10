/**
 * app/api/connectors/[provider]/connect/route.ts
 *
 * Phase 5 — POST /api/connectors/{provider}/connect
 *
 * Stores credentials for a connector and runs an immediate verify call.
 * Only sets status = 'connected' if verify succeeds.
 * Never returns token_blob to the client.
 *
 * AXIOM 4 — Security by Default: secrets stay server-side only.
 * AXIOM 5 — Privacy by Design: owner-only via RLS.
 * ARCHITECTURE.md §5 — Privacy and projection boundaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { mastodonVerify } from '@/lib/connectors/providers/mastodon';
import { blueskyVerify } from '@/lib/connectors/providers/bluesky';
import { githubVerify } from '@/lib/connectors/providers/github';
import { redditVerify } from '@/lib/connectors/providers/reddit';
import { nostrVerify } from '@/lib/connectors/providers/nostr';
import type { ConnectorConnectResponse } from '@/types/connector';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse<ConnectorConnectResponse>> {
  const { provider } = await params;
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Auth check — only authenticated users may connect
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, status: 'error', message: 'Unauthorised' }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json() as Record<string, string>;
  } catch {
    return NextResponse.json({ ok: false, status: 'error', message: 'Invalid JSON body' }, { status: 400 });
  }

  const credentials = (body as { credentials?: Record<string, string> }).credentials ?? (body as Record<string, string>);

  // ── Verify credentials with provider ───────────────────────────────────
  let verifiedAt: string | null = null;
  let lastError: string | null = null;
  let status: ConnectorConnectResponse['status'] = 'error';

  try {
    switch (provider) {
      case 'mastodon':
        await mastodonVerify({
          instance_url: credentials.instance_url ?? '',
          access_token: credentials.access_token ?? '',
        });
        break;
      case 'bluesky':
        await blueskyVerify({
          handle: credentials.handle ?? '',
          app_password: credentials.app_password ?? '',
        });
        break;
      case 'github':
        await githubVerify({ access_token: credentials.access_token ?? '' });
        break;
      case 'reddit':
        await redditVerify({ access_token: credentials.access_token ?? '' });
        break;
      case 'nostr': {
        const relays = (credentials.relays ?? '')
          .split(',')
          .map((r: string) => r.trim())
          .filter(Boolean);
        await nostrVerify({ pubkey: credentials.pubkey ?? '', relays });
        break;
      }
      default:
        return NextResponse.json(
          { ok: false, status: 'unsupported', message: `Provider "${provider}" is not supported for direct connection.` },
          { status: 400 },
        );
    }
    status = 'connected';
    verifiedAt = new Date().toISOString();
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    status = 'error';
  }

  // ── Upsert connector_accounts row ──────────────────────────────────────
  // token_blob stores credentials server-side only.
  // We never return token_blob in the response.
  // db is cast to `any` because connector_accounts is a new table not yet in the generated Supabase types.
  const { error: dbError } = await db
    .from('connector_accounts')
    .upsert(
      {
        user_id: user.id,
        provider,
        status,
        token_blob: status === 'connected' ? credentials : {},
        last_verified_at: verifiedAt,
        last_error: lastError,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    );

  if (dbError) {
    // DB error — return partial success (credentials verified but not saved)
    return NextResponse.json(
      {
        ok: false,
        status: 'error' as const,
        message: `Verified OK but failed to save: ${dbError.message}`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: status === 'connected',
    status,
    message: status === 'connected'
      ? `Connected to ${provider} successfully.`
      : lastError ?? 'Connection failed.',
  });
}
