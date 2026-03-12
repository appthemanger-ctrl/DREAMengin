/**
 * lib/connectors/providers/youtube.ts
 *
 * YouTube provider for DREAMengin connectors.
 *
 * Current implementation uses a user-supplied OAuth access token with the
 * `https://www.googleapis.com/auth/youtube.readonly` scope.
 *
 * This fits the repo's existing connector architecture immediately:
 * - Connect via credential modal
 * - Verify token live
 * - Sync subscriptions / watch history / watch later
 *
 * No DB calls here. No React imports. Pure provider integration only.
 */

import {
  normaliseYouTubePlaylistItem,
  normaliseYouTubeSearchResult,
  type YouTubePlaylistItem,
  type YouTubeSearchItem,
} from '@/lib/connectors/normalise';
import type { UnifiedFeedItem } from '@/types/connector';

const YT_API = 'https://www.googleapis.com/youtube/v3';
const GOOGLE_USERINFO_API = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface YouTubeCredentials {
  access_token: string;
}

interface GoogleUserInfo {
  id?: string;
  email?: string;
  name?: string;
}

interface RelatedPlaylistsResponse {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        watchHistory?: string;
        watchLater?: string;
      };
    };
  }>;
}

interface SubscriptionsResponse {
  items?: Array<{
    snippet?: {
      resourceId?: {
        channelId?: string;
      };
      title?: string;
    };
  }>;
}

interface SearchResponse {
  items?: YouTubeSearchItem[];
}

interface PlaylistItemsResponse {
  items?: YouTubePlaylistItem[];
}

function requireAccessToken(accessToken: string): string {
  const token = accessToken.trim();
  if (!token) {
    throw new Error('YouTube access token is required.');
  }
  return token;
}

async function fetchYouTubeJson<T>(url: string, accessToken: string): Promise<T> {
  const token = requireAccessToken(accessToken);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YouTube request failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }

  return await res.json() as T;
}

/**
 * Verifies the token by calling Google's userinfo endpoint.
 * Returns a human-readable identifier on success.
 */
export async function youtubeVerify(creds: YouTubeCredentials): Promise<string> {
  const user = await fetchYouTubeJson<GoogleUserInfo>(GOOGLE_USERINFO_API, creds.access_token);
  return user.email ?? user.name ?? user.id ?? 'youtube-user';
}

async function fetchRelatedPlaylists(accessToken: string) {
  const data = await fetchYouTubeJson<RelatedPlaylistsResponse>(
    `${YT_API}/channels?part=contentDetails&mine=true&maxResults=1`,
    accessToken,
  );

  const playlists = data.items?.[0]?.contentDetails?.relatedPlaylists;
  return {
    watchHistory: playlists?.watchHistory ?? '',
    watchLater: playlists?.watchLater ?? '',
  };
}

async function fetchPlaylistItems(
  accessToken: string,
  playlistId: string,
  source: 'history' | 'watch_later',
  maxResults = 12,
): Promise<UnifiedFeedItem[]> {
  if (!playlistId) return [];

  const data = await fetchYouTubeJson<PlaylistItemsResponse>(
    `${YT_API}/playlistItems?part=snippet,contentDetails,status&playlistId=${encodeURIComponent(playlistId)}&maxResults=${maxResults}`,
    accessToken,
  );

  return (data.items ?? [])
    .filter((item) => {
      const title = item.snippet?.title ?? '';
      return title && title !== 'Deleted video' && title !== 'Private video';
    })
    .map((item) => normaliseYouTubePlaylistItem(item, source));
}

async function fetchSubscriptionFeed(
  accessToken: string,
  maxChannels = 6,
  videosPerChannel = 3,
): Promise<UnifiedFeedItem[]> {
  const subs = await fetchYouTubeJson<SubscriptionsResponse>(
    `${YT_API}/subscriptions?part=snippet&mine=true&maxResults=${maxChannels}&order=alphabetical`,
    accessToken,
  );

  const channelIds = (subs.items ?? [])
    .map((item) => item.snippet?.resourceId?.channelId ?? '')
    .filter(Boolean);

  const batches = await Promise.all(
    channelIds.map(async (channelId) => {
      const search = await fetchYouTubeJson<SearchResponse>(
        `${YT_API}/search?part=snippet&channelId=${encodeURIComponent(channelId)}&maxResults=${videosPerChannel}&order=date&type=video`,
        accessToken,
      );
      return (search.items ?? []).map(normaliseYouTubeSearchResult);
    }),
  );

  return batches.flat();
}

/**
 * Sync strategy:
 * - subscriptions feed
 * - watch history
 * - watch later
 *
 * Results are normalised and sorted newest-first.
 */
export async function youtubeSync(creds: YouTubeCredentials): Promise<UnifiedFeedItem[]> {
  await youtubeVerify(creds);

  const accessToken = requireAccessToken(creds.access_token);
  const { watchHistory, watchLater } = await fetchRelatedPlaylists(accessToken);

  const [subscriptions, history, saved] = await Promise.all([
    fetchSubscriptionFeed(accessToken),
    fetchPlaylistItems(accessToken, watchHistory, 'history'),
    fetchPlaylistItems(accessToken, watchLater, 'watch_later'),
  ]);

  return [...subscriptions, ...history, ...saved]
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .slice(0, 40);
}
