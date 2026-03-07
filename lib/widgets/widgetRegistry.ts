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
  category: 'Feed' | 'Media' | 'Social' | 'Utilities' | 'Work' | 'Shop' | 'Daydream';
  /**
   * The Daydream domain this widget belongs to.
   * Matches the six canonical Daydream/Engin pairs from docs/ARCHITECTURE.md §1:
   *   music | games | lab | code | brand | create
   * Undefined for platform-level widgets that are not domain-specific.
   */
  daydream?: 'music' | 'games' | 'lab' | 'code' | 'brand' | 'create';
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

  // ── Music / StarMakerEngin widgets (Daydream: music) ─────────────────────

  {
    id: 'music-release',
    title: 'Music Release',
    icon: '🎵',
    description: 'Showcase your latest or featured music release with album art and a play button.',
    defaultConfig: { release_id: null },
    permissions: {},
    connectorDependency: 'none',
    category: 'Daydream',
    daydream: 'music',
  },
  {
    id: 'music-playlist',
    title: 'Music Playlist',
    icon: '🎶',
    description: 'Display a curated playlist with a scrollable track list.',
    defaultConfig: { playlist_id: null },
    permissions: {},
    connectorDependency: 'none',
    category: 'Daydream',
    daydream: 'music',
  },

  // ── Games / GameEngin widgets (Daydream: games) ──────────────────────────

  {
    id: 'game-leaderboard',
    title: 'Game Leaderboard',
    icon: '🏆',
    description: 'Show your top scores and ranking for a DREAMengin mini-game.',
    defaultConfig: { game_type: 'WordSprint' },
    permissions: {},
    connectorDependency: 'none',
    category: 'Daydream',
    daydream: 'games',
  },
  {
    id: 'game-challenge',
    title: 'Daily Challenge',
    icon: '⚡',
    description: "Surface today's game challenge and invite visitors to beat your score.",
    defaultConfig: { challenge_type: 'daily' },
    permissions: {},
    connectorDependency: 'none',
    category: 'Daydream',
    daydream: 'games',
  },

  // ── Lab / LabEngin widgets (Daydream: lab) ───────────────────────────────

  {
    id: 'lab-experiment',
    title: 'Lab Experiment',
    icon: '🔬',
    description: 'Show the live status and progress of an active Lab experiment.',
    defaultConfig: { experiment_id: null },
    permissions: {},
    connectorDependency: 'none',
    category: 'Daydream',
    daydream: 'lab',
  },

  // ── Code / CodeEngin widgets (Daydream: code) ────────────────────────────

  {
    id: 'code-project',
    title: 'Code Project',
    icon: '💻',
    description: 'Show a code project card with repository info and an optional README preview.',
    defaultConfig: { project_id: null, show_readme: false },
    permissions: {},
    connectorDependency: 'optional',
    connectorId: 'github',
    category: 'Daydream',
    daydream: 'code',
  },

  // ── Brand / BrandingEngin widgets (Daydream: brand) ──────────────────────

  {
    id: 'brand-analytics',
    title: 'Brand Analytics',
    icon: '📈',
    description: 'Mini analytics chart showing views, followers, or engagement over time.',
    defaultConfig: { metric: 'views' },
    permissions: {},
    connectorDependency: 'none',
    category: 'Daydream',
    daydream: 'brand',
  },

  // ── Create / ContentEngin widgets (Daydream: create) ─────────────────────

  {
    id: 'create-draft',
    title: 'Recent Drafts',
    icon: '✍️',
    description: 'Show your most recent draft notes and content ideas from the Create Daydream.',
    defaultConfig: { max_items: 3 },
    permissions: {},
    connectorDependency: 'none',
    category: 'Daydream',
    daydream: 'create',
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

/**
 * All widget types that belong to a given Daydream domain.
 * Used by Daydream-specific widget pickers (music, games, lab, code, brand, create).
 */
export function getWidgetTypesForDaydream(
  daydream: WidgetTypeDef['daydream'],
): WidgetTypeDef[] {
  return WIDGET_REGISTRY.filter((w) => w.daydream === daydream);
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
