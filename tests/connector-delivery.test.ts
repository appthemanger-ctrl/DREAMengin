/**
 * tests/connector-delivery.test.ts
 *
 * Unit tests for the generalised webhooks + cron fallback strategy layer.
 *
 * Coverage:
 *   A. deliveryStrategy — matrix correctness, query helpers
 *   B. webhookVerification — YouTube WebSub challenge extraction
 *   C. webhookVerification — Meta webhook challenge extraction + token gate
 *   D. webhookVerification — isCronAuthorised security rules
 *
 * No network calls, no DB calls, no server-only imports — pure unit tests.
 * AGENTS.md §5 — pnpm exec vitest run
 */

import { describe, it, expect } from 'vitest';
import {
  DELIVERY_STRATEGY_MATRIX,
  getDeliveryStrategy,
  supportsWebhook,
  supportsPoll,
  supportsWebhookVerification,
  knownDeliveryProviders,
} from '@/lib/connectors/deliveryStrategy';
import {
  extractYouTubeWebSubChallenge,
  extractMetaWebhookChallenge,
  isCronAuthorised,
} from '@/lib/connectors/webhookVerification';

// -- A. deliveryStrategy -------------------------------------------------------

describe('DELIVERY_STRATEGY_MATRIX', () => {
  it('has at least 7 entries covering all Tier-1 sync providers', () => {
    expect(DELIVERY_STRATEGY_MATRIX.length).toBeGreaterThanOrEqual(7);
  });

  it('contains entries for all Tier-1 providers that have sync', () => {
    const providers = knownDeliveryProviders();
    expect(providers).toContain('mastodon');
    expect(providers).toContain('bluesky');
    expect(providers).toContain('github');
    expect(providers).toContain('reddit');
    expect(providers).toContain('nostr');
    expect(providers).toContain('youtube');
    expect(providers).toContain('instagram');
  });

  it('every entry has a non-empty provider and delivery', () => {
    for (const entry of DELIVERY_STRATEGY_MATRIX) {
      expect(entry.provider).toBeTruthy();
      expect(['webhook', 'poll', 'webhook+poll', 'unsupported']).toContain(entry.delivery);
    }
  });
});

describe('getDeliveryStrategy', () => {
  it('returns the strategy for a known provider', () => {
    const s = getDeliveryStrategy('youtube');
    expect(s).toBeDefined();
    expect(s!.provider).toBe('youtube');
    expect(s!.delivery).toBe('webhook+poll');
  });

  it('returns undefined for an unknown provider', () => {
    expect(getDeliveryStrategy('nonexistent')).toBeUndefined();
  });
});

describe('supportsWebhook', () => {
  it('returns true for youtube (webhook+poll)', () => {
    expect(supportsWebhook('youtube')).toBe(true);
  });

  it('returns true for instagram (webhook+poll)', () => {
    expect(supportsWebhook('instagram')).toBe(true);
  });

  it('returns true for github (webhook+poll)', () => {
    expect(supportsWebhook('github')).toBe(true);
  });

  it('returns false for mastodon (poll only)', () => {
    expect(supportsWebhook('mastodon')).toBe(false);
  });

  it('returns false for bluesky (poll only)', () => {
    expect(supportsWebhook('bluesky')).toBe(false);
  });

  it('returns false for reddit (poll only)', () => {
    expect(supportsWebhook('reddit')).toBe(false);
  });

  it('returns false for nostr (poll only)', () => {
    expect(supportsWebhook('nostr')).toBe(false);
  });

  it('returns false for unknown provider', () => {
    expect(supportsWebhook('unknown_provider')).toBe(false);
  });
});

describe('supportsPoll', () => {
  it('returns true for youtube (webhook+poll includes poll)', () => {
    expect(supportsPoll('youtube')).toBe(true);
  });

  it('returns true for mastodon (poll)', () => {
    expect(supportsPoll('mastodon')).toBe(true);
  });

  it('returns true for bluesky (poll)', () => {
    expect(supportsPoll('bluesky')).toBe(true);
  });

  it('returns true for nostr (poll)', () => {
    expect(supportsPoll('nostr')).toBe(true);
  });

  it('returns false for unknown provider', () => {
    expect(supportsPoll('noprovider')).toBe(false);
  });
});

describe('supportsWebhookVerification', () => {
  it('returns true for youtube', () => {
    expect(supportsWebhookVerification('youtube')).toBe(true);
  });

  it('returns true for instagram', () => {
    expect(supportsWebhookVerification('instagram')).toBe(true);
  });

  it('returns false for mastodon', () => {
    expect(supportsWebhookVerification('mastodon')).toBe(false);
  });

  it('returns false for github (webhook+poll but not verifiable via GET challenge)', () => {
    expect(supportsWebhookVerification('github')).toBe(false);
  });

  it('returns false for unknown provider', () => {
    expect(supportsWebhookVerification('unknown')).toBe(false);
  });
});

describe('knownDeliveryProviders', () => {
  it('returns an array of strings', () => {
    const providers = knownDeliveryProviders();
    expect(Array.isArray(providers)).toBe(true);
    providers.forEach((p) => expect(typeof p).toBe('string'));
  });

  it('has no duplicates', () => {
    const providers = knownDeliveryProviders();
    expect(new Set(providers).size).toBe(providers.length);
  });
});

// -- B. YouTube WebSub challenge extraction ------------------------------------

describe('extractYouTubeWebSubChallenge', () => {
  it('returns challenge for hub.mode=subscribe', () => {
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.topic': 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC123',
      'hub.challenge': 'abc123xyz',
      'hub.lease_seconds': '86400',
    });
    expect(extractYouTubeWebSubChallenge(params)).toBe('abc123xyz');
  });

  it('returns challenge for hub.mode=unsubscribe', () => {
    const params = new URLSearchParams({
      'hub.mode': 'unsubscribe',
      'hub.challenge': 'unsubchallenge',
    });
    expect(extractYouTubeWebSubChallenge(params)).toBe('unsubchallenge');
  });

  it('returns null when hub.mode is missing', () => {
    const params = new URLSearchParams({ 'hub.challenge': 'abc' });
    expect(extractYouTubeWebSubChallenge(params)).toBeNull();
  });

  it('returns null when hub.challenge is missing', () => {
    const params = new URLSearchParams({ 'hub.mode': 'subscribe' });
    expect(extractYouTubeWebSubChallenge(params)).toBeNull();
  });

  it('returns null when hub.mode is an unrecognised value', () => {
    const params = new URLSearchParams({
      'hub.mode': 'denied',
      'hub.challenge': 'abc',
    });
    expect(extractYouTubeWebSubChallenge(params)).toBeNull();
  });

  it('returns null for empty params', () => {
    expect(extractYouTubeWebSubChallenge(new URLSearchParams())).toBeNull();
  });
});

// -- C. Meta webhook challenge extraction --------------------------------------

describe('extractMetaWebhookChallenge', () => {
  const EXPECTED = 'my-secret-verify-token';

  it('returns challenge when all params match', () => {
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': EXPECTED,
      'hub.challenge': 'meta-challenge-42',
    });
    expect(extractMetaWebhookChallenge(params, EXPECTED)).toBe('meta-challenge-42');
  });

  it('returns null when verify_token does not match', () => {
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'meta-challenge-42',
    });
    expect(extractMetaWebhookChallenge(params, EXPECTED)).toBeNull();
  });

  it('returns null when hub.mode is not subscribe', () => {
    const params = new URLSearchParams({
      'hub.mode': 'unsubscribe',
      'hub.verify_token': EXPECTED,
      'hub.challenge': 'meta-challenge-42',
    });
    expect(extractMetaWebhookChallenge(params, EXPECTED)).toBeNull();
  });

  it('returns null when hub.challenge is missing', () => {
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': EXPECTED,
    });
    expect(extractMetaWebhookChallenge(params, EXPECTED)).toBeNull();
  });

  it('returns null when expectedToken is empty string', () => {
    // Empty expectedToken means env var is not configured — should not verify.
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': '',
      'hub.challenge': 'challenge',
    });
    expect(extractMetaWebhookChallenge(params, '')).toBeNull();
  });

  it('returns null when expectedToken is whitespace only', () => {
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': '',
      'hub.challenge': 'challenge',
    });
    expect(extractMetaWebhookChallenge(params, '   ')).toBeNull();
  });

  it('returns null for empty params', () => {
    expect(extractMetaWebhookChallenge(new URLSearchParams(), EXPECTED)).toBeNull();
  });
});

// -- D. isCronAuthorised -------------------------------------------------------

describe('isCronAuthorised', () => {
  it('allows when secret matches Authorization header', () => {
    expect(isCronAuthorised('Bearer my-cron-secret', 'my-cron-secret', 'production')).toBe(true);
  });

  it('denies when secret is set but header is wrong', () => {
    expect(isCronAuthorised('Bearer wrong', 'my-cron-secret', 'production')).toBe(false);
  });

  it('denies when secret is set but header is missing', () => {
    expect(isCronAuthorised(null, 'my-cron-secret', 'production')).toBe(false);
  });

  it('denies when secret is set and header has wrong prefix', () => {
    expect(isCronAuthorised('Basic my-cron-secret', 'my-cron-secret', 'production')).toBe(false);
  });

  it('denies in production when no secret is configured', () => {
    expect(isCronAuthorised(null, undefined, 'production')).toBe(false);
  });

  it('denies in production when secret is empty string and no header', () => {
    // Empty string is falsy — same branch as undefined
    expect(isCronAuthorised(null, '', 'production')).toBe(false);
  });

  it('allows in development when no secret is configured', () => {
    expect(isCronAuthorised(null, undefined, 'development')).toBe(true);
  });

  it('allows in test env when no secret is configured', () => {
    expect(isCronAuthorised(null, undefined, 'test')).toBe(true);
  });

  it('allows in dev even with a header present', () => {
    expect(isCronAuthorised('Bearer anything', undefined, 'development')).toBe(true);
  });

  it('when secret is set in dev, still requires correct header', () => {
    expect(isCronAuthorised('Bearer correct', 'correct', 'development')).toBe(true);
    expect(isCronAuthorised('Bearer wrong', 'correct', 'development')).toBe(false);
  });
});
