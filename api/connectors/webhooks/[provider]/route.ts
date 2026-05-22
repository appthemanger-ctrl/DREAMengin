/**
 * app/api/connectors/webhooks/[provider]/route.ts
 *
 * Generalised webhook receiver for all DREAMengin connectors.
 *
 * GET  — Webhook subscription verification (YouTube WebSub, Meta/Instagram)
 * POST — Webhook payload ingestion (YouTube Atom XML, Instagram JSON)
 *
 * Verification (GET):
 *   YouTube WebSub:  Responds to hub.mode=subscribe/unsubscribe with hub.challenge.
 *   Meta/Instagram:  Verifies hub.verify_token matches WEBHOOK_VERIFY_TOKEN env var,
 *                    then echoes hub.challenge.
 *   Other providers: Returns 400 — webhook verification not supported.
 *
 * Ingestion (POST):
 *   YouTube: Parses Atom XML notification, looks up the connected user by channel ID,
 *            upserts a feed_item row.
 *   Instagram: Parses Meta webhook JSON, looks up the connected user by Instagram
 *              account ID, upserts feed_item rows for each media change event.
 *   Unsupported providers: Returns 400.
 *
 * AXIOM 4 — Security by Default:
 *   - Verify token is read from env, never from query params.
 *   - Instagram payloads verified via X-Hub-Signature-256 HMAC.
 *   - Service-role client used for DB writes — RLS bypassed intentionally
 *     because webhooks arrive without a user session.
 *   - No provider secrets are logged.
 *
 * ARCHITECTURE.md §3 — Logic layer helpers are in lib/connectors/webhookVerification.ts
 */

import {
    supportsWebhook,
    supportsWebhookVerification,
} from '@/lib/connectors/deliveryStrategy';
import {
    extractMetaWebhookChallenge,
    extractYouTubeWebSubChallenge,
} from '@/lib/connectors/webhookVerification';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Service-role client (bypasses RLS for server-side webhook writes) ─────────

function createServiceClient( ){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── YouTube Atom XML parser ────────────────────────────────────────────────────

interface YouTubeWebhookEntry {
  videoId: string;
  channelId: string;
  title: string;
  link: string;
  published: string;
  authorName: string;
}

function parseYouTubeAtom(xml: string): YouTubeWebhookEntry | null {
  const get = (tag: string) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 's'));
    return m ? m[1].trim() : '';
  };
  const getAttr = (tag: string, attr: string) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 's'));
    return m ? m[1] : '';
  };

  // YouTube WebSub Atom: <yt:videoId>, <yt:channelId>, <title>, <link href>, <published>
  const videoId = get('yt:videoId');
  const channelId = get('yt:channelId');
  const title = get('title');
  const link = getAttr('link', 'href');
  const published = get('published') || new Date().toISOString();
  const authorName = get('name');

  if (!videoId || !channelId) return null;
  return { videoId, channelId, title, link, published, authorName };
}

// ── Instagram webhook payload types ──────────────────────────────────────────

interface InstagramChange {
  field: string;
  value: {
    media_id?: string;
    video_id?: string;
    id?: string;
    verb?: string;
    permalink_url?: string;
    caption?: string;
    timestamp?: number;
  };
}

interface InstagramWebhookEntry {
  id: string;            // Instagram account ID
  time: number;
  changes: InstagramChange[];
}

interface InstagramWebhookPayload {
  object: string;
  entry: InstagramWebhookEntry[];
}

// ── HMAC verification for Meta/Instagram ─────────────────────────────────────

async function verifyInstagramSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expected = signatureHeader.slice('sha256='.length);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const actual = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return actual === expected;
}

// ── GET — Subscription verification ──────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider } = await params;
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  if (!supportsWebhookVerification(provider)) {
    return NextResponse.json(
      { error: `Webhook verification not supported for provider "${provider}".` },
      { status: 400 },
    );
  }

  if (provider === 'youtube') {
    const challenge = extractYouTubeWebSubChallenge(searchParams);
    if (!challenge) {
      return NextResponse.json(
        { error: 'Invalid YouTube WebSub verification request.' },
        { status: 400 },
      );
    }
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (provider === 'instagram') {
    const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN ?? '';
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'WEBHOOK_VERIFY_TOKEN is not configured.' },
        { status: 500 },
      );
    }
    const challenge = extractMetaWebhookChallenge(searchParams, expectedToken);
    if (!challenge) {
      return NextResponse.json(
        { error: 'Meta webhook verification failed. Check hub.verify_token.' },
        { status: 403 },
      );
    }
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json(
    { error: `Webhook verification not implemented for "${provider}".` },
    { status: 501 },
  );
}

// ── POST — Payload ingestion ──────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider } = await params;

  if (!supportsWebhook(provider)) {
    return NextResponse.json(
      { error: `Webhook delivery not supported for provider "${provider}".` },
      { status: 400 },
    );
  }

  const rawBody = await req.text().catch(() => '');

  // ── YouTube ingestion ──────────────────────────────────────────────────
  if (provider === 'youtube') {
    const entry = parseYouTubeAtom(rawBody);
    if (!entry) {
      // Not a video notification (e.g. deletion pings or malformed) — acknowledge silently.
      return NextResponse.json({ ok: true, provider, note: 'No actionable entry in payload.' });
    }

    const db = createServiceClient();
    if (!db) {
      return NextResponse.json({ ok: true, provider, note: 'DB not configured — acknowledged.' });
    }

    // Find the user whose YouTube connector account has this channelId in token_blob.
    const { data: accounts } = await db
      .from('connector_accounts')
      .select('user_id, token_blob')
      .eq('provider', 'youtube')
      .eq('status', 'connected');

    const matching = (accounts ?? []).filter((a: { token_blob: Record<string, unknown> }) => {
      const blob = a.token_blob as Record<string, unknown>;
      return blob.channel_id === entry.channelId || blob.channelId === entry.channelId;
    });

    if (matching.length === 0) {
      return NextResponse.json({ ok: true, provider, note: 'No connected user for this channel.' });
    }

    const now = new Date().toISOString();
    const inserts = matching.map((a: { user_id: string }) => ({
      user_id: a.user_id,
      provider: 'youtube',
      external_id: entry.videoId,
      payload: {
        provider: 'youtube',
        external_id: entry.videoId,
        author_handle: entry.channelId,
        author_name: entry.authorName || entry.channelId,
        content_text: entry.title,
        permalink: entry.link || `https://www.youtube.com/watch?v=${entry.videoId}`,
        published_at: entry.published,
        media: [],
        raw: { videoId: entry.videoId, channelId: entry.channelId, title: entry.title },
      },
      published_at: entry.published,
      created_at: now,
    }));

    const { error } = await db
      .from('feed_items')
      .upsert(inserts, { onConflict: 'user_id,provider,external_id', ignoreDuplicates: true });

    if (error) {
      console.error('[webhook:youtube] feed_items upsert error', { error: error.message });
    }

    return NextResponse.json({ ok: true, provider, ingested: inserts.length });
  }

  // ── Instagram ingestion ────────────────────────────────────────────────
  if (provider === 'instagram') {
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET ?? '';
    if (appSecret) {
      const sig = req.headers.get('x-hub-signature-256');
      const valid = await verifyInstagramSignature(rawBody, sig, appSecret);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid Instagram webhook signature.' }, { status: 403 });
      }
    }

    let payload: InstagramWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as InstagramWebhookPayload;
    } catch {
      return NextResponse.json({ ok: true, provider, note: 'Could not parse payload.' });
    }

    if (payload.object !== 'instagram' || !Array.isArray(payload.entry)) {
      return NextResponse.json({ ok: true, provider, note: 'Not an Instagram media webhook.' });
    }

    const db = createServiceClient();
    if (!db) {
      return NextResponse.json({ ok: true, provider, note: 'DB not configured — acknowledged.' });
    }

    let totalIngested = 0;

    for (const entry of payload.entry) {
      const instagramAccountId = String(entry.id);

      const { data: accounts } = await db
        .from('connector_accounts')
        .select('user_id, token_blob')
        .eq('provider', 'instagram')
        .eq('status', 'connected');

      const matching = (accounts ?? []).filter((a: { token_blob: Record<string, unknown> }) => {
        const blob = a.token_blob as Record<string, unknown>;
        return (
          String(blob.instagram_user_id ?? '') === instagramAccountId ||
          String(blob.user_id ?? '') === instagramAccountId ||
          String(blob.account_id ?? '') === instagramAccountId
        );
      });

      if (matching.length === 0) continue;

      const now = new Date().toISOString();
      const mediaChanges = (entry.changes ?? []).filter(
        (c: InstagramChange) => c.field === 'media' || c.field === 'mentions',
      );

      for (const change of mediaChanges) {
        const mediaId = String(
          change.value?.media_id ?? change.value?.video_id ?? change.value?.id ?? Date.now(),
        );
        const permalink = change.value?.permalink_url ?? `https://www.instagram.com/p/${mediaId}/`;
        const caption = change.value?.caption ?? '';
        const publishedAt = change.value?.timestamp
          ? new Date(change.value.timestamp * 1000).toISOString()
          : now;

        const inserts = matching.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          provider: 'instagram',
          external_id: mediaId,
          payload: {
            provider: 'instagram',
            external_id: mediaId,
            author_handle: instagramAccountId,
            author_name: instagramAccountId,
            content_text: caption,
            permalink,
            published_at: publishedAt,
            media: [],
            raw: change.value,
          },
          published_at: publishedAt,
          created_at: now,
        }));

        const { error } = await db
          .from('feed_items')
          .upsert(inserts, { onConflict: 'user_id,provider,external_id', ignoreDuplicates: true });

        if (error) {
          console.error('[webhook:instagram] feed_items upsert error', { error: error.message });
        } else {
          totalIngested += inserts.length;
        }
      }
    }

    return NextResponse.json({ ok: true, provider, ingested: totalIngested });
  }

  // Supported for delivery but no specific ingestion handler yet
  return NextResponse.json(
    { ok: true, provider, note: 'Received and acknowledged.' },
    { status: 200 },
  );
}