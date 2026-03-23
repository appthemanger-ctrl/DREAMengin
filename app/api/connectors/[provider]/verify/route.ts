/**
 * app/api/connectors/[provider]/verify/route.ts
 *
 * Phase 5 — GET /api/connectors/{provider}/verify
 *
 * Re-verifies stored credentials with the provider.
 * Updates last_verified_at and status in connector_accounts.
 * Caches result for 5 minutes — avoids excessive provider API calls.
 *
 * Never returns token_blob to the client.
 *
 * AXIOM 4 — Security by Default: secrets stay server-side only.
 * ARCHITECTURE.md §3 — Logic layer (lib/) handles provider calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { mastodonVerify } from '@/lib/connectors/providers/mastodon';
import { blueskyVerify } from '@/lib/connectors/providers/bluesky';
import { githubVerify } from '@/lib/connectors/providers/github';
import { redditVerify } from '@/lib/connectors/providers/reddit';
import { nostrVerify } from '@/lib/connectors/providers/nostr';
import { youtubeVerify } from '@/lib/connectors/providers/youtube';
import { instagramVerify } from '@/lib/connectors/providers/instagram';
import { mediumVerify } from '@/lib/connectors/providers/medium';
import { devtoVerify } from '@/lib/connectors/providers/devto';
import { substackVerify } from '@/lib/connectors/providers/substack';
import { hackernewsVerify } from '@/lib/connectors/providers/hackernews';
import { podcastVerify } from '@/lib/connectors/providers/podcast';
import { twitterVerify } from '@/lib/connectors/providers/twitter';
import { facebookVerify } from '@/lib/connectors/providers/facebook';
import { pinterestVerify } from '@/lib/connectors/providers/pinterest';
import { tumblrVerify } from '@/lib/connectors/providers/tumblr';
import { tiktokVerify } from '@/lib/connectors/providers/tiktok';
import type { ConnectorVerifyResponse } from '@/types/connector';

const VERIFY_CACHE_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse<ConnectorVerifyResponse>> {
  const { provider } = await params;
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, status: 'error', last_verified_at: null, error: 'Unauthorised' },
      { status: 401 },
    );
  }

  // Fetch stored account (including token_blob — server-side only)
  // db is cast to `any` because connector_accounts is a new table not in the generated Supabase types.
  const { data: account, error: fetchError } = await db
    .from('connector_accounts')
    .select('status, token_blob, last_verified_at, last_error')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .maybeSingle();

  if (fetchError || !account) {
    return NextResponse.json({
      ok: false,
      status: 'not_connected' as const,
      last_verified_at: null,
      error: 'No account found for this provider.',
    });
  }

  // Cache check — if verified recently, return cached status
  if (account.last_verified_at) {
    const age = Date.now() - new Date(account.last_verified_at as string).getTime();
    if (age < VERIFY_CACHE_MS && account.status === 'connected') {
      return NextResponse.json({
        ok: true,
        status: 'connected' as const,
        last_verified_at: account.last_verified_at as string,
      });
    }
  }

  const creds = account.token_blob as Record<string, unknown>;
  let newStatus: ConnectorVerifyResponse['status'] = 'error';
  let lastError: string | null = null;
  let verifiedAt: string | null = null;

  try {
    switch (provider) {
      case 'mastodon':
        await mastodonVerify({
          instance_url: String(creds.instance_url ?? ''),
          access_token: String(creds.access_token ?? ''),
        });
        break;
      case 'bluesky':
        await blueskyVerify({
          handle: String(creds.handle ?? ''),
          app_password: String(creds.app_password ?? ''),
        });
        break;
      case 'github':
        await githubVerify({ access_token: String(creds.access_token ?? '') });
        break;
      case 'reddit':
        await redditVerify({ access_token: String(creds.access_token ?? '') });
        break;
      case 'nostr': {
        const relayRaw = creds.relays;
        const relays = Array.isArray(relayRaw)
          ? relayRaw.map(String)
          : String(relayRaw ?? '').split(',').map((r: string) => r.trim()).filter(Boolean);
        await nostrVerify({ pubkey: String(creds.pubkey ?? ''), relays });
        break;
      }
      case 'youtube':
        await youtubeVerify({
          access_token: String(creds.access_token ?? ''),
          api_key: creds.api_key ? String(creds.api_key) : undefined,
        });
        break;
      case 'instagram':
        await instagramVerify({
          access_token: String(creds.access_token ?? ''),
        });
        break;
      case 'medium':
        await mediumVerify({ username: String(creds.username ?? '') });
        break;
      case 'devto':
        await devtoVerify({ username: String(creds.username ?? '') });
        break;
      case 'substack':
        await substackVerify({ publication: String(creds.publication ?? '') });
        break;
      case 'hackernews':
        await hackernewsVerify({
          feed_type: (String(creds.feed_type ?? 'best') as 'best' | 'newest' | 'ask' | 'show' | 'jobs'),
          username: creds.username ? String(creds.username) : undefined,
        });
        break;
      case 'podcast':
        await podcastVerify({ feed_url: String(creds.feed_url ?? '') });
        break;
      case 'twitter':
        await twitterVerify({
          username: String(creds.username ?? ''),
          nitter_instance: creds.nitter_instance ? String(creds.nitter_instance) : undefined,
        });
        break;
      case 'facebook':
        await facebookVerify({ page: String(creds.page ?? '') });
        break;
      case 'pinterest':
        await pinterestVerify({
          username: String(creds.username ?? ''),
          board: creds.board ? String(creds.board) : undefined,
        });
        break;
      case 'tumblr':
        await tumblrVerify({ username: String(creds.username ?? '') });
        break;
      case 'tiktok':
        await tiktokVerify({
          username: String(creds.username ?? ''),
          rsshub_instance: creds.rsshub_instance ? String(creds.rsshub_instance) : undefined,
        });
        break;
      default:
        newStatus = 'unsupported';
    }
    if (newStatus !== 'unsupported') {
      newStatus = 'connected';
      verifiedAt = new Date().toISOString();
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    newStatus = 'needs_reauth';
  }

  // Update status in DB
  await db
    .from('connector_accounts')
    .update({
      status: newStatus,
      last_verified_at: verifiedAt,
      last_error: lastError,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('provider', provider);

  return NextResponse.json({
    ok: newStatus === 'connected',
    status: newStatus,
    last_verified_at: verifiedAt,
    error: lastError ?? undefined,
  });
}
