/**
 * lib/connectors/syncDispatch.ts
 *
 * Shared provider dispatch — single source of truth for mapping a
 * provider name + token_blob into a list of UnifiedFeedItems.
 *
 * Used by:
 *   - lib/connectors/reconcile.ts                (underlying engine)
 *   - app/api/connectors/[provider]/sync/route.ts (user-triggered, via reconcile)
 *   - app/api/connectors/cron/route.ts            (cron fallback, via reconcile)
 *
 * Never imported from client-side code (token_blob is server-only).
 *
 * AXIOM 4 — Security by Default: token_blob credentials never leave the server.
 * ARCHITECTURE.md §3 — Logic layer (lib/connectors).
 */

import 'server-only';

import { mastodonSync } from '@/lib/connectors/providers/mastodon';
import { blueskySync } from '@/lib/connectors/providers/bluesky';
import { githubSync } from '@/lib/connectors/providers/github';
import { redditSync } from '@/lib/connectors/providers/reddit';
import { nostrSync } from '@/lib/connectors/providers/nostr';
import { youtubeSync } from '@/lib/connectors/providers/youtube';
import { instagramSync } from '@/lib/connectors/providers/instagram';
import type { UnifiedFeedItem } from '@/types/connector';

/**
 * The set of provider ids that dispatchSync handles.
 * Must remain a superset of what the sync route and cron route support.
 *
 * Instagram is included because instagramSync fetches the authenticated user's
 * own media via the Basic Display API. This is NOT a follower/home feed —
 * that remains unsupported via any official Instagram API for third-party apps.
 */
export const DISPATCH_SUPPORTED_PROVIDERS = [
  'mastodon',
  'bluesky',
  'github',
  'reddit',
  'nostr',
  'youtube',
  'instagram',
] as const;

export type DispatchSupportedProvider = (typeof DISPATCH_SUPPORTED_PROVIDERS)[number];

/** Thrown when dispatchSync is called with an unrecognised provider. */
export class UnsupportedProviderError extends Error {
  constructor(provider: string) {
    super(`Provider "${provider}" sync not supported.`);
    this.name = 'UnsupportedProviderError';
  }
}

/**
 * Dispatch a sync for a provider given its stored token_blob credentials.
 *
 * @param provider - The provider id (must be in DISPATCH_SUPPORTED_PROVIDERS)
 * @param creds    - The token_blob from connector_accounts (server-side only)
 * @returns        - Array of normalised UnifiedFeedItems
 * @throws {UnsupportedProviderError} - if provider is not in the dispatch set
 * @throws {Error}                    - on provider API failure (auth, network, etc.)
 */
export async function dispatchSync(
  provider: string,
  creds: Record<string, unknown>,
): Promise<UnifiedFeedItem[]> {
  switch (provider) {
    case 'mastodon':
      return mastodonSync({
        instance_url: String(creds.instance_url ?? ''),
        access_token: String(creds.access_token ?? ''),
      });

    case 'bluesky':
      return blueskySync({
        handle: String(creds.handle ?? ''),
        app_password: String(creds.app_password ?? ''),
      });

    case 'github':
      return githubSync({ access_token: String(creds.access_token ?? '') });

    case 'reddit':
      return redditSync({ access_token: String(creds.access_token ?? '') });

    case 'nostr': {
      const relayRaw = creds.relays;
      const relays = Array.isArray(relayRaw)
        ? relayRaw.map(String).map((r) => r.trim()).filter(Boolean)
        : String(relayRaw ?? '').split(',').map((r) => r.trim()).filter(Boolean);
      return nostrSync({ pubkey: String(creds.pubkey ?? ''), relays });
    }

    case 'youtube':
      return youtubeSync({ access_token: String(creds.access_token ?? '') });

    case 'instagram':
      // Only fetches the authenticated user's own media (photos/videos/reels).
      // Not a follower feed — Meta does not expose that to third-party apps.
      return instagramSync({ access_token: String(creds.access_token ?? '') });

    default:
      throw new UnsupportedProviderError(provider);
  }
}
