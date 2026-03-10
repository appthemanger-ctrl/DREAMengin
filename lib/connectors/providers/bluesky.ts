/**
 * lib/connectors/providers/bluesky.ts
 *
 * Phase 5 — Bluesky (AT Protocol) provider (Tier 1)
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { handle: string, app_password: string }
 *
 * App passwords are created at: https://bsky.app → Settings → App Passwords
 * They are NOT the user's main password.
 *
 * No environment variables required — user provides their own app password.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseBluesky } from '@/lib/connectors/normalise';
import type { UnifiedFeedItem } from '@/types/connector';

const BSKY_PDS = 'https://bsky.social';

export interface BlueskyCredentials {
  handle: string;
  app_password: string;
}

interface BlueskySession {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
}

/**
 * Create a session using the AT Protocol createSession XRPC.
 * Returns the session object including accessJwt.
 */
async function createSession(creds: BlueskyCredentials): Promise<BlueskySession> {
  const res = await fetch(`${BSKY_PDS}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: creds.handle, password: creds.app_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Bluesky auth failed: ${(err as { message?: string }).message ?? `${res.status} ${res.statusText}`}`,
    );
  }
  return res.json() as Promise<BlueskySession>;
}

/**
 * Verify credentials by creating a session.
 * Returns the user's handle on success.
 */
export async function blueskyVerify(creds: BlueskyCredentials): Promise<string> {
  const session = await createSession(creds);
  return session.handle;
}

/**
 * Fetch the home feed (following feed) and return normalised items.
 * Uses app.bsky.feed.getTimeline XRPC.
 */
export async function blueskySync(creds: BlueskyCredentials): Promise<UnifiedFeedItem[]> {
  const session = await createSession(creds);
  const res = await fetch(`${BSKY_PDS}/xrpc/app.bsky.feed.getTimeline?limit=40`, {
    headers: { Authorization: `Bearer ${session.accessJwt}` },
  });
  if (!res.ok) throw new Error(`Bluesky sync failed: ${res.status} ${res.statusText}`);
  const data = await res.json() as { feed?: unknown[] };
  return (data.feed ?? []).map((item) => normaliseBluesky(item as Parameters<typeof normaliseBluesky>[0]));
}

export function blueskyCredentialFields() {
  return [
    {
      key: 'handle',
      label: 'Bluesky Handle',
      placeholder: 'yourhandle.bsky.social',
      type: 'text' as const,
      hint: 'Your full Bluesky handle (e.g. alice.bsky.social).',
    },
    {
      key: 'app_password',
      label: 'App Password',
      placeholder: 'xxxx-xxxx-xxxx-xxxx',
      type: 'password' as const,
      hint: 'Create one at bsky.app → Settings → App Passwords. Do not use your main password.',
    },
  ];
}
