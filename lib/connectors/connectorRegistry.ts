// lib/connectors/connectorRegistry.ts
// Connector definitions — single source of truth (req 41-43, 50)

export type ConnectorStatus = 'connected' | 'not_connected' | 'needs_reauth' | 'error';
export type ConnectorCategory = 'Social' | 'Music' | 'Video' | 'Utilities';

export interface SliceTypeDef {
  id: string;
  label: string;
  description: string;
}

export interface ConnectorDef {
  /** Stable ID (req 43) */
  id: string;
  name: string;
  icon: string;
  description: string;
  category: ConnectorCategory;
  /**
   * The widget type this connector maps to in the profile grid.
   * When this widget type is already in the grid, this connector is disabled
   * in the ConnectorWidgetPicker (HARD RULE — S.I.C.C.).
   */
  widgetTypeId?: string;
  /**
   * Feed slice types offered when this connector is connected (req 51-60).
   * Min 2, max 5 (req 56).
   */
  sliceTypes: SliceTypeDef[];
}

export const CONNECTOR_REGISTRY: ReadonlyArray<ConnectorDef> = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    description: 'See your feed, stories, and friend posts.',
    category: 'Social',
    widgetTypeId: 'instagram',
    sliceTypes: [
      { id: 'ig-timeline', label: 'Timeline', description: 'Your Instagram photo/video timeline.' },
      { id: 'ig-stories', label: 'Stories', description: 'Active stories from people you follow.' },
      { id: 'ig-saved', label: 'Saved Posts', description: 'Your bookmarked Instagram posts.' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    description: 'Subscriptions, watch history, saved videos.',
    category: 'Video',
    widgetTypeId: 'youtube',
    sliceTypes: [
      { id: 'yt-subs', label: 'Subscriptions', description: 'Latest videos from your subscriptions.' },
      { id: 'yt-history', label: 'Watch History', description: 'Recently watched videos.' },
      { id: 'yt-saved', label: 'Saved / Watch Later', description: 'Your Watch Later playlist.' },
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    description: 'Now playing, playlists, liked songs.',
    category: 'Music',
    widgetTypeId: 'spotify',
    sliceTypes: [
      { id: 'sp-nowplaying', label: 'Now Playing', description: 'What you are listening to right now.' },
      { id: 'sp-recent', label: 'Recently Played', description: 'Your last 10 tracks.' },
      { id: 'sp-liked', label: 'Liked Songs', description: 'Your liked songs collection.' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎬',
    description: 'Following feed and saved videos.',
    category: 'Social',
    widgetTypeId: 'tiktok',
    sliceTypes: [
      { id: 'tt-following', label: 'Following Feed', description: 'Latest videos from accounts you follow.' },
      { id: 'tt-saved', label: 'Saved Videos', description: 'Your favourited TikToks.' },
    ],
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    icon: '✖️',
    description: 'Home timeline and bookmarks.',
    category: 'Social',
    widgetTypeId: 'twitter',
    sliceTypes: [
      { id: 'tw-home', label: 'Home Timeline', description: 'Tweets from people you follow.' },
      { id: 'tw-bookmarks', label: 'Bookmarks', description: 'Your saved tweets.' },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Repos, activity, and contributions.',
    category: 'Utilities',
    widgetTypeId: 'github',
    sliceTypes: [
      { id: 'gh-activity', label: 'Activity Feed', description: 'Your recent GitHub events.' },
      { id: 'gh-prs', label: 'Pull Requests', description: 'Open PRs you are assigned to.' },
    ],
  },
  {
    id: 'apple',
    name: 'Apple Music',
    icon: '🎼',
    description: 'Library, playlists, and recent plays.',
    category: 'Music',
    widgetTypeId: 'apple',
    sliceTypes: [
      { id: 'am-recent', label: 'Recently Played', description: 'Your recently played albums.' },
      { id: 'am-playlist', label: 'Top Playlist', description: 'Your most-played playlist.' },
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: '🌤️',
    description: 'Current conditions and forecast (by location).',
    category: 'Utilities',
    widgetTypeId: 'weather',
    sliceTypes: [
      { id: 'wx-current', label: 'Current Conditions', description: 'Temperature, wind, and sky right now.' },
      { id: 'wx-forecast', label: '7-Day Forecast', description: 'Week-ahead weather overview.' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'Job alerts, profile highlights, and network updates.',
    category: 'Social',
    widgetTypeId: 'linkedin',
    sliceTypes: [
      { id: 'li-jobs', label: 'Job Alerts', description: 'Matching job posts from your network.' },
      { id: 'li-feed', label: 'Network Feed', description: 'Recent posts from your connections.' },
      { id: 'li-profile', label: 'Profile Highlights', description: 'Your top skills and endorsements.' },
    ],
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: '👻',
    description: 'Stories and memories from your friends.',
    category: 'Social',
    widgetTypeId: 'snapchat',
    sliceTypes: [
      { id: 'sc-stories', label: 'Stories', description: 'Latest stories from your friends.' },
      { id: 'sc-memories', label: 'Memories', description: 'Your saved snaps and memories.' },
    ],
  },
] as const;

/** Look up a connector definition by stable ID (req 43) */
export function getConnectorDef(id: string): ConnectorDef | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}
