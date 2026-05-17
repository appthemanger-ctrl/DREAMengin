/**
 * lib/connectors/webhookVerification.ts
 *
 * Pure helper functions for:
 *   1. Webhook subscription verification challenge responses
 *      - YouTube WebSub (PubSubHubbub) hub.challenge
 *      - Meta/Instagram hub.mode=subscribe hub.challenge
 *   2. Cron endpoint authorisation check
 *
 * No network calls, no DB calls, no server-only import.
 * Safe to import and test in vitest.
 *
 * AXIOM 4 — Security by Default: empty verify tokens are rejected and
 * configured tokens are compared directly against provider challenge input.
 */

// -- YouTube WebSub ------------------------------------------------------------

/**
 * Extract the hub.challenge for a YouTube WebSub verification request.
 *
 * YouTube sends:
 *   GET ?hub.mode=(subscribe|unsubscribe)
 *       &hub.topic=https://www.youtube.com/xml/feeds/videos.xml?channel_id=...
 *       &hub.challenge=<opaque>
 *       &hub.lease_seconds=<n>
 *
 * The endpoint must echo back hub.challenge as text/plain with HTTP 200
 * to confirm the subscription.
 *
 * @returns hub.challenge string to echo, or null if not a valid WebSub verification.
 */
export function extractYouTubeWebSubChallenge(params: URLSearchParams: string | null) {
  const mode = params.get('hub.mode');
  const challenge = params.get('hub.challenge');
  if ((mode === 'subscribe' || mode === 'unsubscribe') && challenge) {
    return challenge;
  }
  return null;
}

// -- Meta / Instagram Webhooks -------------------------------------------------

/**
 * Extract the hub.challenge for a Meta webhook verification request.
 *
 * Meta sends:
 *   GET ?hub.mode=subscribe
 *       &hub.verify_token=<your-configured-token>
 *       &hub.challenge=<opaque>
 *
 * The endpoint must verify hub.verify_token matches the configured
 * WEBHOOK_VERIFY_TOKEN env var, then echo hub.challenge as text/plain.
 *
 * @param params        - URLSearchParams from the incoming GET request
 * @param expectedToken - The value to match hub.verify_token against
 *                        (from process.env.WEBHOOK_VERIFY_TOKEN)
 * @returns hub.challenge string if verification passes, or null on mismatch.
 */
export function extractMetaWebhookChallenge(
  params: URLSearchParams,
  expectedToken: string,
): string | null {
  const configuredToken = expectedToken.trim();
  if (!configuredToken) {
    return null;
  }

  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');
  if (mode === 'subscribe' && token === configuredToken && challenge) {
    return challenge;
  }
  return null;
}

// -- Cron authorisation --------------------------------------------------------

/**
 * Determine whether a cron request is authorised.
 *
 * Security rules (safe defaults):
 *   - If CRON_SECRET is set:
 *       Require `Authorization: Bearer <CRON_SECRET>` header.
 *       Missing or wrong header → deny.
 *   - If CRON_SECRET is NOT set AND NODE_ENV === 'production':
 *       Deny — no open cron endpoints in production.
 *   - If CRON_SECRET is NOT set AND NODE_ENV !== 'production':
 *       Allow — developer convenience for local testing.
 *
 * Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` on
 * scheduled cron invocations when CRON_SECRET is configured as an env var.
 *
 * @param authHeader - Value of the `Authorization` request header, or null.
 * @param cronSecret - Value of process.env.CRON_SECRET (or undefined).
 * @param nodeEnv    - Value of process.env.NODE_ENV (or undefined).
 */
export function isCronAuthorised(
  authHeader: string | null,
  cronSecret: string | undefined,
  nodeEnv: string | undefined,
): boolean {
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  // No secret configured: allow only outside production
  return nodeEnv !== 'production';
}
