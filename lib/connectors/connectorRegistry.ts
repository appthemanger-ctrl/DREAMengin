// lib/connectors/connectorRegistry.ts
// Connector definitions — single source of truth (req 41-43, 50)

export type ConnectorStatus = 'connected' | 'not_connected' | 'needs_reauth' | 'error';
export type ConnectorCategory = 'Social' | 'Music' | 'Video' | 'Utilities' | 'Gaming';

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
    sliceTypes: [
      { id: 'wx-current', label: 'Current Conditions', description: 'Temperature, wind, and sky right now.' },
      { id: 'wx-forecast', label: '7-Day Forecast', description: 'Week-ahead weather overview.' },
    ],
  },
  // ── Social Media — Feed + Friend list access ────────────────────────────
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    description: 'Home feed, friends posts, and full friends list.',
    category: 'Social',
    sliceTypes: [
      { id: 'fb-home', label: 'Home Feed', description: 'Posts from your Facebook friends and followed pages.' },
      { id: 'fb-friends', label: 'Friends List', description: 'Your Facebook friends (requires user_friends permission).' },
      { id: 'fb-timeline', label: 'Timeline', description: 'Your own Facebook timeline posts.' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'Professional feed and 1st-degree connections.',
    category: 'Social',
    sliceTypes: [
      { id: 'li-feed', label: 'Professional Feed', description: 'Updates from your LinkedIn connections.' },
      { id: 'li-connections', label: 'Connections', description: 'Your 1st-degree LinkedIn connections.' },
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    description: 'Home feed from subscribed subreddits and friends list.',
    category: 'Social',
    sliceTypes: [
      { id: 'rd-home', label: 'Home Feed', description: 'Posts from your subscribed subreddits.' },
      { id: 'rd-friends', label: 'Friends List', description: 'Your Reddit friends list.' },
      { id: 'rd-saved', label: 'Saved Posts', description: 'Your saved Reddit posts and comments.' },
    ],
  },
  {
    id: 'tumblr',
    name: 'Tumblr',
    icon: '📝',
    description: 'Dashboard feed and blogs you follow.',
    category: 'Social',
    sliceTypes: [
      { id: 'tb-dashboard', label: 'Dashboard', description: 'Your Tumblr dashboard with posts from followed blogs.' },
      { id: 'tb-following', label: 'Blogs Following', description: 'Blogs you follow on Tumblr.' },
    ],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    description: 'Home feed of following pins and followers/following.',
    category: 'Social',
    sliceTypes: [
      { id: 'pt-home', label: 'Home Feed', description: 'Pins from people you follow on Pinterest.' },
      { id: 'pt-following', label: 'Following', description: 'Accounts you follow on Pinterest.' },
      { id: 'pt-saved', label: 'Saved Pins', description: 'Pins you have saved to your boards.' },
    ],
  },
  {
    id: 'flickr',
    name: 'Flickr',
    icon: '📷',
    description: 'Contacts feed and contacts list.',
    category: 'Social',
    sliceTypes: [
      { id: 'fk-contacts', label: 'Contacts Feed', description: 'Recent photos from your Flickr contacts.' },
      { id: 'fk-contacts-list', label: 'Contacts List', description: 'Your Flickr contacts.' },
    ],
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    icon: '🐘',
    description: 'Home and federated timeline, following and followers.',
    category: 'Social',
    sliceTypes: [
      { id: 'md-home', label: 'Home Timeline', description: 'Posts from accounts you follow on Mastodon.' },
      { id: 'md-federated', label: 'Federated Timeline', description: 'Public posts from the wider Mastodon network.' },
      { id: 'md-following', label: 'Following', description: 'Accounts you follow on Mastodon.' },
    ],
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    icon: '🦋',
    description: 'Following feed and following/followers list.',
    category: 'Social',
    sliceTypes: [
      { id: 'bs-following', label: 'Following Feed', description: 'Posts from accounts you follow on Bluesky.' },
      { id: 'bs-followers', label: 'Followers', description: 'Your Bluesky followers.' },
    ],
  },
  {
    id: 'nostr',
    name: 'Nostr',
    icon: '⚡',
    description: 'Relay-based feeds and pubkey-based follow lists.',
    category: 'Social',
    sliceTypes: [
      { id: 'ns-feed', label: 'Relay Feed', description: 'Posts from your Nostr relay subscriptions.' },
      { id: 'ns-following', label: 'Follow List', description: 'Pubkeys in your Nostr follow list.' },
    ],
  },
  // ── Universal Feed Aggregator ───────────────────────────────────────────
  {
    id: 'granary',
    name: 'Granary',
    icon: '🌾',
    description: 'Normalized ActivityStreams feed from Facebook, Twitter, Instagram, Mastodon, Bluesky, Nostr, GitHub, and more.',
    category: 'Utilities',
    sliceTypes: [
      { id: 'gr-unified', label: 'Unified Feed', description: 'All connected platform feeds merged into one ActivityStreams timeline.' },
      { id: 'gr-social', label: 'Social Activity', description: 'Social posts normalized from all connected social platforms.' },
    ],
  },
  // ── Gaming — Activity Feeds + Friends ──────────────────────────────────
  {
    id: 'xbox',
    name: 'Xbox Live',
    icon: '🎮',
    description: "Friends' activity, achievements, and what friends are playing.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'xb-activity', label: 'Friends Activity', description: "What your Xbox friends are playing right now." },
      { id: 'xb-achievements', label: 'Achievements', description: 'Recent achievements earned by your friends.' },
      { id: 'xb-friends', label: 'Friends List', description: 'Your full Xbox friends list with presence info.' },
    ],
  },
  {
    id: 'psn',
    name: 'PlayStation Network',
    icon: '🕹️',
    description: "Friends' activity, trophies, and recently played games.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'ps-activity', label: 'Friends Activity', description: 'Recent game activity from your PSN friends.' },
      { id: 'ps-trophies', label: 'Trophies', description: 'Recent trophies earned by your PSN friends.' },
      { id: 'ps-friends', label: 'Friends List', description: 'Your full PSN friends list and profiles.' },
    ],
  },
  {
    id: 'steam',
    name: 'Steam',
    icon: '🖥️',
    description: "Friends' activity, game news, and achievements.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'st-activity', label: 'Friends Activity', description: 'Recent game activity from your Steam friends.' },
      { id: 'st-achievements', label: 'Achievements', description: 'Recent Steam achievements from your friends.' },
      { id: 'st-friends', label: 'Friends List', description: 'Your Steam friends list and profiles.' },
    ],
  },
  {
    id: 'nintendo',
    name: 'Nintendo Account',
    icon: '🍄',
    description: 'Play activity and friends list (limited).',
    category: 'Gaming',
    sliceTypes: [
      { id: 'ni-activity', label: 'Play Activity', description: 'Recent play activity from your Nintendo friends.' },
      { id: 'ni-friends', label: 'Friends List', description: 'Your Nintendo friends list.' },
    ],
  },
  {
    id: 'epic',
    name: 'Epic Games',
    icon: '⚔️',
    description: "Friends' activity and game invites.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'eg-activity', label: 'Friends Activity', description: 'Recent game activity from your Epic Games friends.' },
      { id: 'eg-friends', label: 'Friends List', description: 'Your Epic Games friends list.' },
    ],
  },
  {
    id: 'gog',
    name: 'GOG',
    icon: '🌌',
    description: "Friends' activity feed.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'gg-activity', label: 'Friends Activity', description: 'Recent game activity from your GOG friends.' },
      { id: 'gg-friends', label: 'Friends List', description: 'Your GOG friends list.' },
    ],
  },
  {
    id: 'roblox',
    name: 'Roblox',
    icon: '🟥',
    description: 'Friends feed and game activity.',
    category: 'Gaming',
    sliceTypes: [
      { id: 'rb-feed', label: 'Friends Feed', description: 'Recent activity feed from your Roblox friends.' },
      { id: 'rb-activity', label: 'Game Activity', description: 'What your Roblox friends are playing.' },
      { id: 'rb-friends', label: 'Friends List', description: 'Your Roblox friends list.' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '💬',
    description: "Friends' activity, rich presence, and servers.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'dc-activity', label: 'Friends Activity', description: 'Rich presence activity from your Discord friends.' },
      { id: 'dc-friends', label: 'Friends List', description: 'Your Discord friends list and servers.' },
    ],
  },
  {
    id: 'google-play-games',
    name: 'Google Play Games',
    icon: '▶️',
    description: "Friends' game activity and achievements.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'gp-activity', label: 'Friends Activity', description: 'Recent game activity from Google Play Games friends.' },
      { id: 'gp-achievements', label: 'Achievements', description: 'Recent achievements from your Google Play Games friends.' },
      { id: 'gp-friends', label: 'Friends List', description: 'Your Google Play Games friends list (requires consent).' },
    ],
  },
  {
    id: 'gamejolt',
    name: 'Game Jolt',
    icon: '🕹️',
    description: "Friends' activity feed and trophies.",
    category: 'Gaming',
    sliceTypes: [
      { id: 'gj-activity', label: 'Friends Activity', description: 'Activity feed from your Game Jolt friends.' },
      { id: 'gj-trophies', label: 'Trophies', description: 'Recent trophies earned by your Game Jolt friends.' },
      { id: 'gj-friends', label: 'Friends List', description: 'Your Game Jolt friends list.' },
    ],
  },
  {
    id: 'itchio',
    name: 'Itch.io',
    icon: '🎲',
    description: 'Followed creators activity and following list.',
    category: 'Gaming',
    sliceTypes: [
      { id: 'it-activity', label: 'Creator Activity', description: 'Recent releases and updates from creators you follow on itch.io.' },
      { id: 'it-following', label: 'Following List', description: 'Creators you follow on itch.io.' },
    ],
  },
] as const;

/** Look up a connector definition by stable ID (req 43) */
export function getConnectorDef(id: string): ConnectorDef | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}
