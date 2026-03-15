/**
 * lib/connectors/providers/youtube.ts
 *
 * YouTube provider for DREAMengin connectors.
 *
 * Supports two authentication modes:
 *  1. OAuth access token (access_token) — user-authenticated, accesses private
 *     data: subscriptions, watch history, Watch Later playlist.
 *     Scope: https://www.googleapis.com/auth/youtube.readonly
 *
 *  2. YouTube Data API key (api_key) — server-configured, public data only:
 *     trending videos via the mostPopular chart.
 *     Set YOUTUBE_API_KEY in environment variables.
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
  /** YouTube Data API key for server-configured public data access. */
  api_key?: string;
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

interface VideosListResponse {
  items?: Array<{
    id?: string;
    snippet?: YouTubeSearchItem['snippet'];
  }>;
}

// YouTube video category IDs (Data API v3)
const CATEGORY_NEWS = '25'; // News & Politics

function requireAccessToken(accessToken: string): string {
  const token = accessToken.trim();
  if (!token) {
    throw new Error('YouTube access token is required.');
  }
  return token;
}

function requireApiKey(apiKey: string): string {
  const key = apiKey.trim();
  if (!key) {
    throw new Error('YouTube API key is required. Set YOUTUBE_API_KEY in environment variables.');
  }
  return key;
}

/** Returns the trimmed api_key from credentials, or empty string. */
function resolveApiKey(creds: YouTubeCredentials): string {
  return (creds.api_key ?? '').trim();
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

async function fetchYouTubeJsonWithApiKey<T>(url: string, apiKey: string): Promise<T> {
  const key = requireApiKey(apiKey);
  const separator = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${separator}key=${encodeURIComponent(key)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YouTube request failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }

  return await res.json() as T;
}

/** Maps a Videos-list item (id is a plain string) to the unified feed format. */
function normaliseVideoListItem(item: { id?: string; snippet?: YouTubeSearchItem['snippet'] }): UnifiedFeedItem {
  const asSearchItem: YouTubeSearchItem = {
    id: { videoId: item.id ?? '' },
    snippet: item.snippet,
  };
  return normaliseYouTubeSearchResult(asSearchItem);
}

/**
 * Verifies credentials. Accepts either an OAuth access_token or an api_key.
 * Returns a human-readable identifier on success.
 */
export async function youtubeVerify(creds: YouTubeCredentials): Promise<string> {
  const apiKey = resolveApiKey(creds);
  if (apiKey) {
    // Verify key by fetching a single mostPopular video (minimal quota cost)
    await fetchYouTubeJsonWithApiKey<VideosListResponse>(
      `${YT_API}/videos?part=id&chart=mostPopular&maxResults=1`,
      apiKey,
    );
    return 'youtube-api-key';
  }
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
 * Fetches globally trending videos using the mostPopular chart.
 * Requires only an API key — no user authentication.
 */
async function fetchTrendingVideos(apiKey: string, maxResults = 20): Promise<UnifiedFeedItem[]> {
  const data = await fetchYouTubeJsonWithApiKey<VideosListResponse>(
    `${YT_API}/videos?part=snippet&chart=mostPopular&maxResults=${maxResults}`,
    apiKey,
  );
  return (data.items ?? []).map(normaliseVideoListItem);
}

/**
 * Fetches world news videos (category 25 — News & Politics).
 * Requires only an API key — no user authentication.
 */
async function fetchWorldNewsVideos(apiKey: string, maxResults = 20): Promise<UnifiedFeedItem[]> {
  const data = await fetchYouTubeJsonWithApiKey<VideosListResponse>(
    `${YT_API}/videos?part=snippet&chart=mostPopular&videoCategoryId=${CATEGORY_NEWS}&maxResults=${maxResults}`,
    apiKey,
  );
  return (data.items ?? []).map(normaliseVideoListItem);
}

/** Fisher-Yates shuffle — returns a new array in random order. */
function shuffleArray<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Public discovery feed: randomly interleaves trending and world-news videos.
 * Does not require user authentication — driven entirely by YOUTUBE_API_KEY.
 * Exported for use by the /api/youtube/discovery route.
 */
export async function youtubeDiscovery(apiKey: string, maxResults = 30): Promise<UnifiedFeedItem[]> {
  const key = requireApiKey(apiKey);
  const half = Math.ceil(maxResults / 2);
  const [trending, news] = await Promise.all([
    fetchTrendingVideos(key, half),
    fetchWorldNewsVideos(key, half),
  ]);
  return shuffleArray([...trending, ...news]).slice(0, maxResults);
}

/**
 * Returns the YOUTUBE_API_KEY from the server environment, or empty string.
 * Server-side only — no NEXT_PUBLIC_ prefix, so it is never sent to the browser.
 */
export function getYouTubeApiKey(): string {
  return process.env.YOUTUBE_API_KEY ?? '';
}

/**
 * Sync strategy:
 * - If api_key is provided: fetch trending + world news public videos (no user auth needed).
 * - If access_token is provided: subscriptions feed + watch history + Watch Later.
 *
 * Results are normalised and sorted newest-first.
 */
export async function youtubeSync(creds: YouTubeCredentials): Promise<UnifiedFeedItem[]> {
  const apiKey = resolveApiKey(creds);
  if (apiKey) {
    const items = await youtubeDiscovery(apiKey);
    return items.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  }

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
