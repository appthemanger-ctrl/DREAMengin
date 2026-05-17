/**
 * lib/connectors/deliveryStrategy.ts
 *
 * Strategy matrix: how each DREAMengin connector receives updates.
 *
 * Delivery methods:
 *   webhook       → provider pushes events to DREAMengin in real-time
 *   poll          → DREAMengin polls the provider API on a cron schedule
 *   webhook+poll  → webhooks for real-time delivery + cron poll as fallback/catch-up
 *   unsupported   → no programmatic delivery is technically available
 *
 * Used by:
 *   - app/api/connectors/cron/route.ts           (cron fallback dispatcher)
 *   - app/api/connectors/webhooks/[provider]/    (webhook receiver gate)
 *   - tests/connector-delivery.test.ts
 *
 * Pure module — no side effects, no server-only, no DB/network calls.
 * Safe to import in tests.
 */

export type DeliveryMethod = 'webhook' | 'poll' | 'webhook+poll' | 'unsupported';

export interface ConnectorDeliveryStrategy {
  /** Provider id matching ConnectorDef.id */
  provider: string;
  /**
   * Primary delivery method for this provider.
   */
  delivery: DeliveryMethod;
  /**
   * True if this provider supports a webhook subscription verification flow
   * (YouTube WebSub GET challenge, or Meta hub.mode=subscribe GET challenge).
   * When true, GET /api/connectors/webhooks/{provider} will respond to the
   * verification handshake.
   */
  webhookVerifiable: boolean;
  /**
   * Human-readable note about delivery constraints or trade-offs.
   */
  note?: string;
}

/**
 * Canonical delivery strategy matrix for all known DREAMengin connectors.
 *
 * Truthfulness rules:
 *   - A connector with delivery:'webhook' means the provider supports push;
 *     it does NOT mean DREAMengin has completed full WebSub/webhook ingestion.
 *   - A connector with delivery:'poll' means cron polling is the only reliable path.
 *   - webhook+poll means both are used: real-time push for new items +
 *     cron catch-up for gaps/reliability.
 */
export const DELIVERY_STRATEGY_MATRIX: ReadonlyArray<ConnectorDeliveryStrategy> = [
  {
    provider: 'youtube',
    delivery: 'webhook+poll',
    webhookVerifiable: true,
    note:
      'YouTube Data API v3 supports WebSub (PubSubHubbub) for new uploads from ' +
      'subscribed channels. Cron poll covers watch-history/watch-later playlists ' +
      'which are not push-deliverable.',
  },
  {
    provider: 'instagram',
    delivery: 'webhook+poll',
    webhookVerifiable: true,
    note:
      'Meta Webhooks can deliver new-media events for connected accounts. ' +
      'Cron polling via Instagram Basic Display API is the reliable fallback. ' +
      'Only own-media is accessible — no follower feed is available via any ' +
      'official API for third-party apps.',
  },
  {
    provider: 'mastodon',
    delivery: 'poll',
    webhookVerifiable: false,
    note:
      'Mastodon streaming WebSocket requires a persistent connection which is ' +
      'impractical for serverless. Cron polling the home timeline is the ' +
      'recommended approach.',
  },
  {
    provider: 'bluesky',
    delivery: 'poll',
    webhookVerifiable: false,
    note:
      'AT Protocol Firehose requires a persistent connection. Cron polling the ' +
      "user's timeline via app.bsky.feed.getTimeline is the recommended approach.",
  },
  {
    provider: 'github',
    delivery: 'webhook+poll',
    webhookVerifiable: false,
    note:
      'GitHub webhooks are per-repo/org and require admin configuration per ' +
      'repository. Cron polling the user events API is the general fallback ' +
      'for all users without repo-level webhook setup.',
  },
  {
    provider: 'reddit',
    delivery: 'poll',
    webhookVerifiable: false,
    note:
      'Reddit API does not support push delivery. Cron polling the home feed ' +
      'is the only supported approach.',
  },
  {
    provider: 'nostr',
    delivery: 'poll',
    webhookVerifiable: false,
    note:
      'Nostr uses relay subscriptions, which require a persistent WebSocket. ' +
      'Cron-triggered relay queries are the serverless-compatible approach.',
  },
  {
    provider: 'twitter',
    delivery: 'poll',
    webhookVerifiable: false,
    note:
      'X/Twitter Account Activity API (push) requires Elevated+ API access. ' +
      'Public-profile RSS polling via Nitter is the available fallback.',
  },
  {
    provider: 'facebook',
    delivery: 'poll',
    webhookVerifiable: false,
    note:
      'Facebook webhooks require app review and page admin access. ' +
      'Public Page RSS polling is the practical fallback.',
  },
  {
    provider: 'spotify',
    delivery: 'poll',
    webhookVerifiable: false,
    note: 'Spotify has no push delivery for recently-played. Cron polling only.',
  },
];

// ── Query helpers ─────────────────────────────────────────────────────────────

/**
 * Look up the delivery strategy for a provider.
 * Returns undefined if the provider is not in the matrix.
 */
export function getDeliveryStrategy(provider: string): ConnectorDeliveryStrategy | undefined {
  return DELIVERY_STRATEGY_MATRIX.find((s: Record<string, unknown>) => s.provider === provider);
}

/**
 * Returns true if the provider has any webhook-based delivery
 * (either 'webhook' or 'webhook+poll').
 */
export function supportsWebhook(provider: string): boolean {
  const s = getDeliveryStrategy(provider);
  return s?.delivery === 'webhook' || s?.delivery === 'webhook+poll';
}

/**
 * Returns true if the provider supports poll-based delivery
 * (either 'poll' or 'webhook+poll').
 */
export function supportsPoll(provider: string): boolean {
  const s = getDeliveryStrategy(provider);
  return s?.delivery === 'poll' || s?.delivery === 'webhook+poll';
}

/**
 * Returns true if the provider supports a webhook verification
 * challenge (YouTube WebSub or Meta hub.mode=subscribe handshake).
 */
export function supportsWebhookVerification(provider: string): boolean {
  return getDeliveryStrategy(provider)?.webhookVerifiable ?? false;
}

/**
 * All provider ids that appear in the delivery strategy matrix.
 */
export function knownDeliveryProviders(): string[] {
  return DELIVERY_STRATEGY_MATRIX.map((s: Record<string, unknown>) => s.provider);
}