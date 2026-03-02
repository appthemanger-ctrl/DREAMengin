// lib/widgets/widgetRegistry.ts
// Single source of truth for all widget types (req 41-50)
// Stable IDs; no duplicated strings sprinkled across code (req 43)

// ── Connector dependency declaration (req 44-48) ──────────────────────────
export type ConnectorRequirement = 'none' | 'optional' | 'required';

// ── Permissions ────────────────────────────────────────────────────────────
export interface WidgetPermissions {
  requiresLocation?: boolean;
  requiresNotifications?: boolean;
  requiresCamera?: boolean;
}

// ── Widget Type Definition (req 44) ───────────────────────────────────────
export interface WidgetTypeDef {
  /** Stable, never-changed ID (req 43) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Emoji or icon identifier */
  icon: string;
  /** Short description for Add Widgets library */
  description: string;
  /** Default config applied when shell is created (req 44) */
  defaultConfig: Record<string, unknown>;
  /** Permission requirements (req 44) */
  permissions: WidgetPermissions;
  /** Connector dependency (req 44-45) */
  connectorDependency: ConnectorRequirement;
  /** Connector ID that satisfies this widget's dependency (req 45) */
  connectorId?: string;
  /** Library category */
  category: 'Feed' | 'Media' | 'Social' | 'Utilities' | 'Work' | 'Shop';
}

// ── Registry ───────────────────────────────────────────────────────────────
// All widget types with stable IDs (req 41-43)
export const WIDGET_REGISTRY: ReadonlyArray<WidgetTypeDef> = [
  {
    id: 'feed-main',
    title: 'Main Feed',
    icon: '📰',
    description: 'Your primary content stream.',
    defaultConfig: { limit: 20, sort: 'recent' },
    permissions: {},
    connectorDependency: 'none',
    category: 'Feed',
  },
  {
    id: 'feed-topic',
    title: 'Topic Slice',
    icon: '🏷️',
    description: 'A slice of news or content by topic.',
    defaultConfig: { topic: '', limit: 10 },
    permissions: {},
    connectorDependency: 'none',
    category: 'Feed',
  },
  {
    id: 'play-media',
    title: 'Play Media',
    icon: '▶️',
    description: 'Music and video player with queue.',
    defaultConfig: { autoplay: false },
    permissions: {},
    connectorDependency: 'optional',
    connectorId: 'spotify',
    category: 'Media',
  },
  {
    id: 'media-thumb',
    title: 'Media Gallery',
    icon: '🖼️',
    description: 'Photo and video thumbnails from your vault.',
    defaultConfig: { columns: 3 },
    permissions: {},
    connectorDependency: 'none',
    category: 'Media',
  },
  {
    id: 'ig-friend',
    title: 'IG: Friend Feed',
    icon: '📸',
    description: 'Posts from a specific Instagram friend.',
    defaultConfig: { handle: '' },
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'instagram',
    category: 'Social',
  },
  {
    id: 'yt-channel',
    title: 'YouTube Channel',
    icon: '📺',
    description: 'Latest videos from a channel.',
    defaultConfig: { channelId: '', limit: 6 },
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'youtube',
    category: 'Social',
  },
  {
    id: 'spotify',
    title: 'Spotify Now',
    icon: '🎵',
    description: "What you're listening to on Spotify.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'spotify',
    category: 'Social',
  },
  {
    id: 'weather',
    title: 'Weather',
    icon: '🌤️',
    description: 'Current conditions and forecast.',
    defaultConfig: { unit: 'metric' },
    permissions: { requiresLocation: true },
    connectorDependency: 'optional',
    connectorId: 'weather',
    category: 'Utilities',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: '📅',
    description: 'Upcoming events and schedule.',
    defaultConfig: { view: 'week', limit: 5 },
    permissions: {},
    connectorDependency: 'none',
    category: 'Work',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: '✅',
    description: 'Quick task list for today.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'none',
    category: 'Work',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: '📊',
    description: 'Key metrics at a glance.',
    defaultConfig: { period: '7d' },
    permissions: {},
    connectorDependency: 'none',
    category: 'Work',
  },
  {
    id: 'shop-feed',
    title: 'Shop Feed',
    icon: '🛍️',
    description: 'Featured items from the marketplace.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'none',
    category: 'Shop',
  },
  {
    id: 'github',
    title: 'GitHub Activity',
    icon: '🐙',
    description: 'Repos, activity, and contributions.',
    defaultConfig: { username: '' },
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'github',
    category: 'Work',
  },
  {
    id: 'tiktok',
    title: 'TikTok Feed',
    icon: '🎬',
    description: 'Following feed and saved videos.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'tiktok',
    category: 'Social',
  },
  {
    id: 'twitter',
    title: 'X / Twitter',
    icon: '✖️',
    description: 'Home timeline and bookmarks.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'twitter',
    category: 'Social',
  },
  {
    id: 'apple-music',
    title: 'Apple Music',
    icon: '🎼',
    description: 'Library, playlists, and recent plays.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'apple',
    category: 'Media',
  },
  // ── Social Media Feed + Friend list connectors ────────────────────────
  {
    id: 'facebook-feed',
    title: 'Facebook Feed',
    icon: '👥',
    description: 'Home feed and friends posts from Facebook.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'facebook',
    category: 'Social',
  },
  {
    id: 'linkedin-feed',
    title: 'LinkedIn Feed',
    icon: '💼',
    description: 'Professional feed and connection updates.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'linkedin',
    category: 'Social',
  },
  {
    id: 'reddit-feed',
    title: 'Reddit Feed',
    icon: '🤖',
    description: 'Home feed from subscribed subreddits.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'reddit',
    category: 'Social',
  },
  {
    id: 'tumblr-feed',
    title: 'Tumblr Dashboard',
    icon: '📝',
    description: 'Dashboard posts from blogs you follow on Tumblr.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'tumblr',
    category: 'Social',
  },
  {
    id: 'pinterest-feed',
    title: 'Pinterest Feed',
    icon: '📌',
    description: 'Home feed of pins from accounts you follow.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'pinterest',
    category: 'Social',
  },
  {
    id: 'flickr-feed',
    title: 'Flickr Contacts',
    icon: '📷',
    description: 'Recent photos from your Flickr contacts.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'flickr',
    category: 'Social',
  },
  {
    id: 'mastodon-feed',
    title: 'Mastodon Timeline',
    icon: '🐘',
    description: 'Home and federated timeline from Mastodon.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'mastodon',
    category: 'Social',
  },
  {
    id: 'bluesky-feed',
    title: 'Bluesky Feed',
    icon: '🦋',
    description: 'Following feed from Bluesky.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'bluesky',
    category: 'Social',
  },
  {
    id: 'nostr-feed',
    title: 'Nostr Feed',
    icon: '⚡',
    description: 'Relay-based feeds from Nostr.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'nostr',
    category: 'Social',
  },
  {
    id: 'granary-feed',
    title: 'Granary Unified Feed',
    icon: '🌾',
    description: 'Normalized ActivityStreams feed aggregated from all connected platforms.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'optional',
    connectorId: 'granary',
    category: 'Feed',
  },
  // ── Gaming connectors ─────────────────────────────────────────────────
  {
    id: 'xbox-activity',
    title: 'Xbox Live Activity',
    icon: '🎮',
    description: "Friends' activity and achievements on Xbox Live.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'xbox',
    category: 'Social',
  },
  {
    id: 'psn-activity',
    title: 'PlayStation Activity',
    icon: '🕹️',
    description: "Friends' activity and trophies on PlayStation Network.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'psn',
    category: 'Social',
  },
  {
    id: 'steam-activity',
    title: 'Steam Activity',
    icon: '🖥️',
    description: "Friends' activity and achievements on Steam.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'steam',
    category: 'Social',
  },
  {
    id: 'nintendo-activity',
    title: 'Nintendo Play Activity',
    icon: '🍄',
    description: 'Recent play activity from Nintendo friends.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'nintendo',
    category: 'Social',
  },
  {
    id: 'epic-activity',
    title: 'Epic Games Activity',
    icon: '⚔️',
    description: "Friends' activity and invites on Epic Games.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'epic',
    category: 'Social',
  },
  {
    id: 'gog-activity',
    title: 'GOG Activity',
    icon: '🌌',
    description: "Friends' activity on GOG.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'gog',
    category: 'Social',
  },
  {
    id: 'roblox-activity',
    title: 'Roblox Activity',
    icon: '🟥',
    description: "Friends' feed and game activity on Roblox.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'roblox',
    category: 'Social',
  },
  {
    id: 'discord-activity',
    title: 'Discord Activity',
    icon: '💬',
    description: "Friends' rich presence activity on Discord.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'discord',
    category: 'Social',
  },
  {
    id: 'google-play-games-activity',
    title: 'Google Play Games Activity',
    icon: '▶️',
    description: "Friends' game activity on Google Play Games.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'google-play-games',
    category: 'Social',
  },
  {
    id: 'gamejolt-activity',
    title: 'Game Jolt Activity',
    icon: '🕹️',
    description: "Friends' activity and trophies on Game Jolt.",
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'gamejolt',
    category: 'Social',
  },
  {
    id: 'itchio-activity',
    title: 'Itch.io Activity',
    icon: '🎲',
    description: 'Recent releases from creators you follow on itch.io.',
    defaultConfig: {},
    permissions: {},
    connectorDependency: 'required',
    connectorId: 'itchio',
    category: 'Social',
  },
] as const;

// ── Lookup helpers (req 43) ────────────────────────────────────────────────
export function getWidgetTypeDef(id: string): WidgetTypeDef | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

/** All widget types that belong to a given connector (req 45) */
export function getWidgetTypesForConnector(connectorId: string): WidgetTypeDef[] {
  return WIDGET_REGISTRY.filter((w) => w.connectorId === connectorId);
}

/** Connector status used to determine what CTA to show (req 46-48) */
export type ConnectorState = 'connected' | 'not_connected' | 'expired' | 'not_required';

/**
 * Determine the connector state for a given widget type
 * given a map of currently-connected connector IDs (req 46-50).
 */
export function resolveConnectorState(
  widgetId: string,
  connectedIds: Set<string>,
  expiredIds: Set<string>,
): ConnectorState {
  const def = getWidgetTypeDef(widgetId);
  if (!def || def.connectorDependency === 'none' || !def.connectorId) {
    return 'not_required';
  }
  if (expiredIds.has(def.connectorId)) return 'expired';
  if (connectedIds.has(def.connectorId)) return 'connected';
  return 'not_connected';
}
