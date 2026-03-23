/**
 * lib/connectors/providers/instagram.ts
 *
 * Instagram connector for DREAMengin.
 *
 * Uses the Instagram Basic Display API to access a user's own media posts.
 * Requires an Instagram Basic Display app and a long-lived access token
 * obtained through the OAuth 2.0 redirect flow at:
 *   GET /api/connectors/instagram/oauth/start  → Instagram auth page
 *   GET /api/connectors/instagram/oauth/callback → exchange code + store token
 *
 * Environment variables required:
 *   INSTAGRAM_CLIENT_ID      — App ID from Meta developers console
 *   INSTAGRAM_CLIENT_SECRET  — App Secret (server-only, never exposed)
 *
 * No DB calls here. No React imports. Pure provider integration only.
 * AXIOM 4 — Security by Default: secrets stay server-side.
 * ARCHITECTURE.md §3 — Logic layer; no React imports.
 */

import type { UnifiedFeedItem } from '@/types/connector';

const IG_API = 'https://graph.instagram.com';

export interface InstagramCredentials {
  access_token: string;
}

interface InstagramUser {
  id: string;
  username: string;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username?: string;
}

interface InstagramMediaListResponse {
  data?: InstagramMedia[];
}

// ── Internal fetch helpers ────────────────────────────────────────────────────

async function fetchInstagramJson<T>(path: string, accessToken: string): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${IG_API}${path}${separator}access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Instagram API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ── Normaliser ────────────────────────────────────────────────────────────────

function normaliseInstagramMedia(item: InstagramMedia): UnifiedFeedItem {
  const caption = item.caption ?? '';
  const tags = (caption.match(/#\w+/g) ?? []).map((t) => t.slice(1).toLowerCase());
  const thumbnail = item.thumbnail_url ?? item.media_url ?? '';

  return {
    provider:      'instagram',
    external_id:   item.id,
    author_handle: item.username ?? 'instagram',
    author_name:   item.username ?? 'Instagram User',
    content_text:  caption,
    media: thumbnail
      ? [{ url: thumbnail, type: item.media_type === 'VIDEO' ? 'video' : 'image', thumbnail_url: thumbnail }]
      : [],
    permalink:     item.permalink,
    published_at:  item.timestamp,
    raw:           item,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Verifies Instagram credentials by calling /me.
 * Returns the Instagram username on success.
 */
export async function instagramVerify(creds: InstagramCredentials): Promise<string> {
  const user = await fetchInstagramJson<InstagramUser>(
    '/me?fields=id,username',
    creds.access_token,
  );
  return user.username ?? user.id ?? 'instagram-user';
}

/**
 * Fetches the authenticated user's recent media posts.
 * Returns up to 25 normalised UnifiedFeedItems sorted newest first.
 */
export async function instagramSync(creds: InstagramCredentials): Promise<UnifiedFeedItem[]> {
  const data = await fetchInstagramJson<InstagramMediaListResponse>(
    '/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username&limit=25',
    creds.access_token,
  );

  return (data.data ?? [])
    .map(normaliseInstagramMedia)
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}

/**
 * Returns the configured Instagram App credentials from the environment.
 * Server-only — never exposed to the browser.
 */
export function getInstagramOAuthConfig() {
  return {
    clientId:     process.env.INSTAGRAM_CLIENT_ID     ?? '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET ?? '',
  };
}

/**
 * Returns the credential fields definition used by ConnectorRow for
 * the manual-token fallback path (power users who already have a long-lived
 * token can paste it directly without going through the redirect flow).
 */
export const INSTAGRAM_CREDENTIAL_FIELDS = [
  {
    key:         'access_token',
    label:       'Long-Lived Access Token',
    placeholder: 'IGQ...',
    type:        'password' as const,
    hint:
      'Obtained automatically via "Connect with Instagram" above. ' +
      'Advanced: paste a long-lived token from the Meta developers console.',
  },
];
