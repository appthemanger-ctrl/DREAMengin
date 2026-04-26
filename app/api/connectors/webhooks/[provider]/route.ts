/**
 * app/api/connectors/webhooks/[provider]/route.ts
 *
 * Generalised webhook receiver for all DREAMengin connectors.
 *
 * GET  — Webhook subscription verification (YouTube WebSub, Meta/Instagram)
 * POST — Webhook payload receipt (safe acknowledgement for all supported providers)
 *
 * Verification (GET):
 *   YouTube WebSub:  Responds to hub.mode=subscribe/unsubscribe with hub.challenge.
 *   Meta/Instagram:  Verifies hub.verify_token matches WEBHOOK_VERIFY_TOKEN env var,
 *                    then echoes hub.challenge.
 *   Other providers: Returns 400 — webhook verification not supported.
 *
 * Receipt (POST):
 *   All providers with supportsWebhook(provider) === true:
 *     Returns HTTP 200 to acknowledge receipt.
 *     Full provider-specific ingestion is a future slice — this route establishes
 *     the foundation and keeps the subscription active.
 *   Unsupported providers: Returns 400.
 *
 * AXIOM 4 — Security by Default:
 *   - Verify token is read from env, never from query params.
 *   - No provider secrets are logged.
 *   - Raw payload body is consumed but not processed in this slice.
 *
 * ARCHITECTURE.md §3 — Logic layer helpers are in lib/connectors/webhookVerification.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractYouTubeWebSubChallenge,
  extractMetaWebhookChallenge,
} from '@/lib/connectors/webhookVerification';
import {
  supportsWebhook,
  supportsWebhookVerification,
} from '@/lib/connectors/deliveryStrategy';

// ── GET — Subscription verification ──────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider } = await params;
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  // Guard: only providers that can be verified respond to this route.
  if (!supportsWebhookVerification(provider)) {
    return NextResponse.json(
      { error: `Webhook verification not supported for provider "${provider}".` },
      { status: 400 },
    );
  }

  // ── YouTube WebSub ──────────────────────────────────────────────────────
  if (provider === 'youtube') {
    const challenge = extractYouTubeWebSubChallenge(searchParams);
    if (!challenge) {
      return NextResponse.json(
        { error: 'Invalid YouTube WebSub verification request.' },
        { status: 400 },
      );
    }
    // Echo hub.challenge as plain text — required by WebSub spec.
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // ── Meta / Instagram ────────────────────────────────────────────────────
  if (provider === 'instagram') {
    const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN ?? '';
    if (!expectedToken) {
      // WEBHOOK_VERIFY_TOKEN not configured — cannot verify.
      return NextResponse.json(
        { error: 'WEBHOOK_VERIFY_TOKEN is not configured. Set it in environment variables.' },
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

  // Should not be reached given supportsWebhookVerification guard above,
  // but kept as a safe fallback.
  return NextResponse.json(
    { error: `Webhook verification not implemented for "${provider}".` },
    { status: 501 },
  );
}

// ── POST — Payload receipt ────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider } = await params;

  // Guard: only providers with any webhook delivery accept POST payloads.
  if (!supportsWebhook(provider)) {
    return NextResponse.json(
      { error: `Webhook delivery not supported for provider "${provider}".` },
      { status: 400 },
    );
  }

  // Consume the body to prevent connection issues on some platforms.
  // We do not process the payload in this slice — full ingestion is a future slice.
  // Reading as text (not JSON) is safest — avoids parse errors on XML payloads
  // (YouTube sends Atom XML) and malformed JSON.
  try {
    await req.text();
  } catch {
    // Silently ignore body read failures — acknowledge regardless.
  }

  // Acknowledge receipt. The provider will retry if we return non-2xx.
  // Full ingestion (parsing the payload and writing to feed_items) will be
  // added per-provider in subsequent slices.
  return NextResponse.json(
    { ok: true, provider, note: 'Received. Ingestion pending future implementation.' },
    { status: 200 },
  );
}
