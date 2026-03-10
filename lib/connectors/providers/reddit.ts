/**
 * lib/connectors/providers/reddit.ts
 *
 * Phase 5 — Reddit provider (Tier 1)
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { access_token: string }
 *
 * OAuth2 flow: redirect user to Reddit authorisation, then exchange code
 * for an access_token. The connect API route handles the exchange.
 *
 * Required scopes: identity, read, mysubreddits, save
 *
 * No required environment variables for reading — optional client_id/secret
 * for OAuth (set as REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET in env).
 * If not configured, the connector shows 'needs_admin_setup'.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseReddit } from '@/lib/connectors/normalise';
import type { UnifiedFeedItem } from '@/types/connector';

const REDDIT_API = 'https://oauth.reddit.com';

export interface RedditCredentials {
  access_token: string;
}

interface RedditUser {
  name: string;
}

/**
 * Verify credentials by calling GET /api/v1/me
 * Returns the authenticated username on success.
 */
export async function redditVerify(creds: RedditCredentials): Promise<string> {
  const res = await fetch(`${REDDIT_API}/api/v1/me`, {
    headers: {
      Authorization: `Bearer ${creds.access_token}`,
      'User-Agent': 'DREAMengin/1.0',
    },
  });
  if (!res.ok) throw new Error(`Reddit verify failed: ${res.status} ${res.statusText}`);
  const user = await res.json() as RedditUser;
  return user.name;
}

/**
 * Fetch the user's home feed and return normalised items.
 * Calls GET /best or / (personalised frontpage when authenticated).
 */
export async function redditSync(creds: RedditCredentials): Promise<UnifiedFeedItem[]> {
  const res = await fetch(`${REDDIT_API}/?limit=40`, {
    headers: {
      Authorization: `Bearer ${creds.access_token}`,
      'User-Agent': 'DREAMengin/1.0',
    },
  });
  if (!res.ok) throw new Error(`Reddit sync failed: ${res.status} ${res.statusText}`);
  const listing = await res.json() as { data?: { children?: unknown[] } };
  const posts = listing.data?.children ?? [];
  return (posts as Parameters<typeof normaliseReddit>[0][]).map(normaliseReddit);
}

/**
 * Fetch the user's saved posts.
 */
export async function redditSyncSaved(creds: RedditCredentials): Promise<UnifiedFeedItem[]> {
  const username = await redditVerify(creds);
  const res = await fetch(`${REDDIT_API}/user/${username}/saved?limit=40`, {
    headers: {
      Authorization: `Bearer ${creds.access_token}`,
      'User-Agent': 'DREAMengin/1.0',
    },
  });
  if (!res.ok) throw new Error(`Reddit saved sync failed: ${res.status} ${res.statusText}`);
  const listing = await res.json() as { data?: { children?: unknown[] } };
  return (listing.data?.children ?? []).map((post) => normaliseReddit(post as Parameters<typeof normaliseReddit>[0]));
}

export function redditCredentialFields() {
  return [
    {
      key: 'access_token',
      label: 'Access Token',
      placeholder: 'Provided after authorising DREAMengin on Reddit',
      type: 'password' as const,
      hint: 'Click "Connect" to authorise DREAMengin with Reddit. Admin must configure REDDIT_CLIENT_ID first.',
    },
  ];
}
