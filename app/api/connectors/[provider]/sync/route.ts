/**
 * app/api/connectors/[provider]/sync/route.ts
 *
 * Phase 5 — POST /api/connectors/{provider}/sync
 *
 * Fetches feed items from the provider, normalises them, deduplicates,
 * and stores in public.feed_items.
 *
 * Updates connector_accounts.last_synced_at and last_sync_count on success.
 *
 * Never returns token_blob to the client.
 * All syncing is user-triggered — no background cron.
 *
 * AXIOM 4 — Security by Default: provider tokens never leave the server.
 * ARCHITECTURE.md §3 — Logic layer (lib/connectors) handles provider calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { mastodonSync } from '@/lib/connectors/providers/mastodon';
import { blueskySync } from '@/lib/connectors/providers/bluesky';
import { githubSync } from '@/lib/connectors/providers/github';
import { redditSync } from '@/lib/connectors/providers/reddit';
import { nostrSync } from '@/lib/connectors/providers/nostr';
import { youtubeSync } from '@/lib/connectors/providers/youtube';
import { instagramSync } from '@/lib/connectors/providers/instagram';
import { mediumSync } from '@/lib/connectors/providers/medium';
import { devtoSync } from '@/lib/connectors/providers/devto';
import { substackSync } from '@/lib/connectors/providers/substack';
import { hackernewsSync } from '@/lib/connectors/providers/hackernews';
import { podcastSync } from '@/lib/connectors/providers/podcast';
import { twitterSync } from '@/lib/connectors/providers/twitter';
import { facebookSync } from '@/lib/connectors/providers/facebook';
import { pinterestSync } from '@/lib/connectors/providers/pinterest';
import { tumblrSync } from '@/lib/connectors/providers/tumblr';
import { tiktokSync } from '@/lib/connectors/providers/tiktok';
import { deduplicateFeedItems } from '@/lib/connectors/normalise';
import type { ConnectorSyncResponse, UnifiedFeedItem } from '@/types/connector';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse<ConnectorSyncResponse>> {
  const { provider } = await params;
  const supabase = await createServerClient();
   
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, fetched: 0, stored: 0, last_synced_at: '', error: 'Unauthorised' },
      { status: 401 },
    );
  }

  // Fetch stored credentials (token_blob — server-side only)
  // db is cast to `any` because connector_accounts is a new table not in the generated Supabase types.
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

  const creds = account.token_blob as Record<string, unknown>;
  let items: UnifiedFeedItem[] = [];
  let syncError: string | null = null;

  try {
    switch (provider) {
      case 'mastodon':
        items = await mastodonSync({
          instance_url: String(creds.instance_url ?? ''),
          access_token: String(creds.access_token ?? ''),
        });
        break;
      case 'bluesky':
        items = await blueskySync({
          handle: String(creds.handle ?? ''),
          app_password: String(creds.app_password ?? ''),
        });
        break;
      case 'github':
        items = await githubSync({ access_token: String(creds.access_token ?? '') });
        break;
      case 'reddit':
        items = await redditSync({ access_token: String(creds.access_token ?? '') });
        break;
      case 'nostr': {
        const relayRaw = creds.relays;
        const relays = Array.isArray(relayRaw)
          ? relayRaw.map(String)
          : String(relayRaw ?? '').split(',').map((r: string) => r.trim()).filter(Boolean);
        items = await nostrSync({ pubkey: String(creds.pubkey ?? ''), relays });
        break;
      }
      case 'youtube':
        items = await youtubeSync({
          access_token: String(creds.access_token ?? ''),
          api_key: creds.api_key ? String(creds.api_key) : undefined,
        });
        break;
      case 'instagram':
        items = await instagramSync({
          access_token: String(creds.access_token ?? ''),
        });
        break;
      case 'medium':
        items = await mediumSync({ username: String(creds.username ?? '') });
        break;
      case 'devto':
        items = await devtoSync({ username: String(creds.username ?? '') });
        break;
      case 'substack':
        items = await substackSync({ publication: String(creds.publication ?? '') });
        break;
      case 'hackernews':
        items = await hackernewsSync({
          feed_type: (String(creds.feed_type ?? 'best') as 'best' | 'newest' | 'ask' | 'show' | 'jobs'),
          username: creds.username ? String(creds.username) : undefined,
        });
        break;
      case 'podcast':
        items = await podcastSync({ feed_url: String(creds.feed_url ?? '') });
        break;
      case 'twitter':
        items = await twitterSync({
          username: String(creds.username ?? ''),
          nitter_instance: creds.nitter_instance ? String(creds.nitter_instance) : undefined,
        });
        break;
      case 'facebook':
        items = await facebookSync({ page: String(creds.page ?? '') });
        break;
      case 'pinterest':
        items = await pinterestSync({
          username: String(creds.username ?? ''),
          board: creds.board ? String(creds.board) : undefined,
        });
        break;
      case 'tumblr':
        items = await tumblrSync({ username: String(creds.username ?? '') });
        break;
      case 'tiktok':
        items = await tiktokSync({
          username: String(creds.username ?? ''),
          rsshub_instance: creds.rsshub_instance ? String(creds.rsshub_instance) : undefined,
        });
        break;
      default:
        return NextResponse.json(
          { ok: false, fetched: 0, stored: 0, last_synced_at: '', error: `Provider "${provider}" sync not supported.` },
          { status: 400 },
        );
    }
  } catch (err) {
    syncError = err instanceof Error ? err.message : String(err);
    // Update status to needs_reauth if it looks like an auth error
    const isAuthError = syncError.includes('401') || syncError.includes('unauthori') || syncError.includes('token');
    if (isAuthError) {
      await db
        .from('connector_accounts')
        .update({ status: 'needs_reauth', last_error: syncError, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('provider', provider);
    }
    return NextResponse.json({
      ok: false, fetched: 0, stored: 0, last_synced_at: '', error: syncError,
    }, { status: 502 });
  }

  // Dedup in-memory before insert
  const deduped = deduplicateFeedItems(items);
  const now = new Date().toISOString();

  // Upsert into feed_items — on conflict (user_id, provider, external_id) do nothing
  let stored = 0;
  if (deduped.length > 0) {
    const rows = deduped.map((item) => ({
      user_id: user.id,
      provider: item.provider,
      external_id: item.external_id,
      payload: item,
      published_at: item.published_at || null,
    }));

    // feed_items uses a different schema than the generated type (user_id, provider, external_id, payload).
    // Using db (as any) to bypass generated type mismatch for the new feed item columns.
    const { error: upsertError, count } = await db
      .from('feed_items')
      .upsert(rows, { onConflict: 'user_id,provider,external_id', ignoreDuplicates: true, count: 'exact' });

    if (upsertError) {
      return NextResponse.json(
        { ok: false, fetched: deduped.length, stored: 0, last_synced_at: now, error: upsertError.message },
        { status: 500 },
      );
    }
    stored = count ?? deduped.length;
  }

  // Update connector account sync metadata
  await db
    .from('connector_accounts')
    .update({
      last_synced_at: now,
      last_sync_count: deduped.length,
      last_error: null,
      updated_at: now,
    })
    .eq('user_id', user.id)
    .eq('provider', provider);

  return NextResponse.json({
    ok: true,
    fetched: deduped.length,
    stored,
    last_synced_at: now,
  });
}
