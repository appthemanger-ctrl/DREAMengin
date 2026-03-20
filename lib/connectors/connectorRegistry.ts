// lib/connectors/connectorRegistry.ts
// Connector definitions — single source of truth (req 41-43, 50)

/**
 * Canonical connector statuses — never use local/timeout fakes.
 *
 * not_connected     → no credentials stored
 * connected         → credentials verified successfully (last_verified_at is recent)
 * needs_reauth      → credentials expired / revoked; user must re-auth
 * requires_approval → provider requires app approval before access is granted
 * unsupported       → technically impossible via official APIs (e.g. IG follower list)
 * error             → transient API error; user may retry
 * needs_admin_setup → optional env vars not configured; admin must set up
 */
export type ConnectorStatus =
  | 'connected'
  | 'not_connected'
  | 'needs_reauth'
  | 'requires_approval'
  | 'unsupported'
  | 'error'
  | 'needs_admin_setup';

export type ConnectorCategory = 'Social' | 'Music' | 'Video' | 'Utilities';

/** What tier of API access a connector requires */
export type ConnectorTier = 'tier1' | 'tier2' | 'tier3';

/** Human-readable explanation of access limitations */
export interface ConnectorLimitation {
  /** What data is accessible */
  available: string;
  /** What data is NOT available */
  unavailable?: string;
  /** Any approvals / paid plans needed */
  requirements?: string;
}

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
   * API access tier.
   * tier1 → fully supported; connect → verify → sync works end-to-end.
   * tier2 → supported but gated (needs approval, paid plan, or partner status).
   * tier3 → explicitly unsupported; shown as unsupported with explanation.
   */
  tier: ConnectorTier;
  /**
   * One-line summary of what you get when connected.
   * Shown in the connector card.
   */
  whatYouGet: string;
  /**
   * One-line summary of requirements / limitations.
   * Shown in the connector card before connecting.
   */
  requirements?: string;
  /**
   * One-line summary of what is NOT available (tier3 only).
   * Shown instead of requirements for unsupported connectors.
   */
  unavailable?: string;
  /**
   * Initial status shown before the user ever connects.
   * tier1 → 'not_connected'
   * tier2 → 'requires_approval' or 'needs_admin_setup'
   * tier3 → 'unsupported'
   */
  defaultStatus: ConnectorStatus;
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
  // ── TIER 1: Fully supported ────────────────────────────────────────────
  {
    id: 'mastodon',
    name: 'Mastodon',
    icon: '🐘',
    description: 'Home timeline, follows, and followers from your Mastodon instance.',
    category: 'Social',
    tier: 'tier1',
    whatYouGet: 'Home timeline + follow/follower counts',
    requirements: 'Your instance URL and an access token from account settings.',
    defaultStatus: 'not_connected',
    widgetTypeId: 'mastodon',
    sliceTypes: [
      { id: 'masto-timeline', label: 'Home Timeline', description: 'Posts from accounts you follow.' },
      { id: 'masto-notifications', label: 'Notifications', description: 'Mentions, boosts, and favourites.' },
    ],
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    icon: '🦋',
    description: 'Follow feed, follows, and followers from Bluesky (AT Protocol).',
    category: 'Social',
    tier: 'tier1',
    whatYouGet: 'Follow feed + follow/follower counts',
    requirements: 'Your Bluesky handle and an app password (Settings → App Passwords).',
    defaultStatus: 'not_connected',
    widgetTypeId: 'bluesky',
    sliceTypes: [
      { id: 'bsky-following', label: 'Following Feed', description: 'Posts from accounts you follow.' },
      { id: 'bsky-notifications', label: 'Notifications', description: 'Likes, reposts, and replies.' },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Activity feed, repos, pull requests, and contributions.',
    category: 'Utilities',
    tier: 'tier1',
    whatYouGet: 'Activity feed + repos + open PRs',
    requirements: 'Authenticate with your GitHub account.',
    defaultStatus: 'not_connected',
    widgetTypeId: 'github',
    sliceTypes: [
      { id: 'gh-activity', label: 'Activity Feed', description: 'Your recent GitHub events.' },
      { id: 'gh-prs', label: 'Pull Requests', description: 'Open PRs you are assigned to.' },
    ],
  },
  {
    id: 'shellhub',
    name: 'ShellHub',
    icon: '🖥️',
    description: 'Remote Linux device management and SSH access via ShellHub gateway.',
    category: 'Utilities',
    tier: 'tier1',
    whatYouGet: 'Device list + online/offline status + web terminal launch',
    requirements: 'A ShellHub account (cloud or self-hosted) and a personal API key.',
    defaultStatus: 'not_connected',
    widgetTypeId: 'shellhub',
    sliceTypes: [
      { id: 'sh-devices', label: 'Device List', description: 'Your registered ShellHub devices with status.' },
      { id: 'sh-online', label: 'Online Devices', description: 'Devices currently connected to the gateway.' },
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    description: 'Subscribed feed, saved posts, and upvoted content.',
    category: 'Social',
    tier: 'tier1',
    whatYouGet: 'Subscribed subreddit feed + saved posts',
    requirements: 'Authenticate with your Reddit account.',
    defaultStatus: 'not_connected',
    widgetTypeId: 'reddit',
    sliceTypes: [
      { id: 'reddit-home', label: 'Home Feed', description: 'Posts from your subscribed subreddits.' },
      { id: 'reddit-saved', label: 'Saved Posts', description: 'Your saved Reddit posts.' },
    ],
  },
  {
    id: 'nostr',
    name: 'Nostr',
    icon: '⚡',
    description: 'Decentralised social feed via Nostr relays.',
    category: 'Social',
    tier: 'tier1',
    whatYouGet: 'Home feed + follow list from relays',
    requirements: 'Your Nostr public key (npub) and at least one relay URL.',
    defaultStatus: 'not_connected',
    widgetTypeId: 'nostr',
    sliceTypes: [
      { id: 'nostr-following', label: 'Following Feed', description: 'Notes from your follow list.' },
      { id: 'nostr-mentions', label: 'Mentions', description: 'Notes that tag your pubkey.' },
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    description: 'Now playing, playlists, and liked songs.',
    category: 'Music',
    tier: 'tier1',
    whatYouGet: 'Now playing + recently played + liked songs',
    requirements: 'Authenticate with your Spotify account.',
    defaultStatus: 'not_connected',
    widgetTypeId: 'spotify',
    sliceTypes: [
      { id: 'sp-nowplaying', label: 'Now Playing', description: 'What you are listening to right now.' },
      { id: 'sp-recent', label: 'Recently Played', description: 'Your last 10 tracks.' },
      { id: 'sp-liked', label: 'Liked Songs', description: 'Your liked songs collection.' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    description: 'Subscriptions, watch history, saved videos, trending, and world news.',
    category: 'Video',
    tier: 'tier1',
    whatYouGet: 'Subscription feed + watch history + Watch Later + trending + world news',
    requirements: 'Authenticate with your Google account (OAuth) or use a server-side YouTube Data API key for public trending and news content.',
    defaultStatus: 'not_connected',
    widgetTypeId: 'youtube',
    sliceTypes: [
      { id: 'yt-subs', label: 'Subscriptions', description: 'Latest videos from your subscriptions.' },
      { id: 'yt-history', label: 'Watch History', description: 'Recently watched videos.' },
      { id: 'yt-saved', label: 'Saved / Watch Later', description: 'Your Watch Later playlist.' },
      { id: 'yt-trending', label: 'Trending', description: 'Globally trending YouTube videos.' },
      { id: 'yt-news', label: 'World News', description: 'Top world news videos from YouTube.' },
    ],
  },

  // ── TIER 2: Gated (requires approval or paid plan) ─────────────────────
  {
    id: 'twitter',
    name: 'X / Twitter',
    icon: '✖️',
    description: 'Home timeline and bookmarks.',
    category: 'Social',
    tier: 'tier2',
    whatYouGet: 'Home timeline + bookmarks (if access is approved)',
    requirements: 'Home timeline access requires X API paid plan or partner access.',
    defaultStatus: 'needs_admin_setup',
    widgetTypeId: 'twitter',
    sliceTypes: [
      { id: 'tw-home', label: 'Home Timeline', description: 'Tweets from people you follow.' },
      { id: 'tw-bookmarks', label: 'Bookmarks', description: 'Your saved tweets.' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'Job alerts, profile highlights, and network updates.',
    category: 'Social',
    tier: 'tier2',
    whatYouGet: 'Network feed + job alerts (requires partner approval)',
    requirements: 'Connections API requires LinkedIn partner program approval.',
    defaultStatus: 'requires_approval',
    widgetTypeId: 'linkedin',
    sliceTypes: [
      { id: 'li-jobs', label: 'Job Alerts', description: 'Matching job posts from your network.' },
      { id: 'li-feed', label: 'Network Feed', description: 'Recent posts from your connections.' },
      { id: 'li-profile', label: 'Profile Highlights', description: 'Your top skills and endorsements.' },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    description: 'Friends feed — only friends who also use DREAMengin.',
    category: 'Social',
    tier: 'tier2',
    whatYouGet: 'Friends posts (only friends who also use the app)',
    requirements: 'Facebook Graph API only returns mutual-app friends.',
    defaultStatus: 'requires_approval',
    widgetTypeId: 'facebook',
    sliceTypes: [
      { id: 'fb-friends', label: 'Friends Feed', description: 'Posts from mutual-app friends.' },
      { id: 'fb-pages', label: 'Pages', description: 'Recent posts from Pages you follow.' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    description: 'Friends list and server activity.',
    category: 'Social',
    tier: 'tier2',
    whatYouGet: 'Friends list + server activity (requires Social SDK access)',
    requirements: 'Requires Discord Social SDK access approval.',
    defaultStatus: 'requires_approval',
    widgetTypeId: 'discord',
    sliceTypes: [
      { id: 'discord-friends', label: 'Friends List', description: 'Your Discord friends online status.' },
      { id: 'discord-activity', label: 'Activity', description: 'Recent server activity.' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎬',
    description: 'Following feed and saved videos.',
    category: 'Social',
    tier: 'tier2',
    whatYouGet: 'Following feed + saved videos',
    requirements: 'TikTok API requires developer application approval.',
    defaultStatus: 'needs_admin_setup',
    widgetTypeId: 'tiktok',
    sliceTypes: [
      { id: 'tt-following', label: 'Following Feed', description: 'Latest videos from accounts you follow.' },
      { id: 'tt-saved', label: 'Saved Videos', description: 'Your favourited TikToks.' },
    ],
  },
  {
    id: 'apple',
    name: 'Apple Music',
    icon: '🎼',
    description: 'Library, playlists, and recent plays.',
    category: 'Music',
    tier: 'tier2',
    whatYouGet: 'Recently played + top playlist',
    requirements: 'Requires Apple Music membership and MusicKit developer key.',
    defaultStatus: 'needs_admin_setup',
    widgetTypeId: 'apple',
    sliceTypes: [
      { id: 'am-recent', label: 'Recently Played', description: 'Your recently played albums.' },
      { id: 'am-playlist', label: 'Top Playlist', description: 'Your most-played playlist.' },
    ],
  },

  // ── TIER 3: Explicitly unsupported ────────────────────────────────────
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    description: 'Profile stats only — follower list is not available via official API.',
    category: 'Social',
    tier: 'tier3',
    whatYouGet: 'Follower/following counts only (no feed or follower list)',
    unavailable: 'Instagram Graph API does not expose follower lists or home feed.',
    requirements: 'Use Mastodon or Bluesky for full follow/feed access.',
    defaultStatus: 'unsupported',
    widgetTypeId: 'instagram',
    sliceTypes: [
      { id: 'ig-timeline', label: 'Timeline', description: 'Your Instagram photo/video timeline.' },
      { id: 'ig-stories', label: 'Stories', description: 'Active stories from people you follow.' },
      { id: 'ig-saved', label: 'Saved Posts', description: 'Your bookmarked Instagram posts.' },
    ],
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: '👻',
    description: 'No official public API for Stories or memories.',
    category: 'Social',
    tier: 'tier3',
    whatYouGet: 'Not available — no official read API',
    unavailable: 'Snapchat does not expose a public API for Stories or friend content.',
    defaultStatus: 'unsupported',
    widgetTypeId: 'snapchat',
    sliceTypes: [
      { id: 'sc-stories', label: 'Stories', description: 'Latest stories from your friends.' },
      { id: 'sc-memories', label: 'Memories', description: 'Your saved snaps and memories.' },
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: '🌤️',
    description: 'Current conditions and forecast (by location).',
    category: 'Utilities',
    tier: 'tier1',
    whatYouGet: 'Current conditions + 7-day forecast',
    requirements: 'Location permission required. No external API key needed (uses open-meteo).',
    defaultStatus: 'not_connected',
    widgetTypeId: 'weather',
    sliceTypes: [
      { id: 'wx-current', label: 'Current Conditions', description: 'Temperature, wind, and sky right now.' },
      { id: 'wx-forecast', label: '7-Day Forecast', description: 'Week-ahead weather overview.' },
    ],
  },
] as const;

/** Look up a connector definition by stable ID (req 43) */
export function getConnectorDef(id: string): ConnectorDef | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}
