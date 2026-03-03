// lib/connectors/connectorRegistry.ts
// Connector definitions — single source of truth (req 41-43, 50)

export type ConnectorStatus = 'connected' | 'not_connected' | 'needs_reauth' | 'error';
export type ConnectorCategory =
  | 'Social'
  | 'Music'
  | 'Video'
  | 'Utilities'
  | 'Gaming'
  | 'Storage'
  | 'Calendar'
  | 'Productivity'
  | 'Health'
  | 'News'
  | 'Finance'
  | 'Travel'
  | 'Food'
  | 'Smart Home'
  | 'Education'
  | 'Development'
  | 'Analytics';

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
  // ── Music & Audio ───────────────────────────────────────────────────────────
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    icon: '🎵',
    description: 'Library, playback, and uploads from YouTube Music.',
    category: 'Music',
    sliceTypes: [
      { id: 'ytm-library', label: 'Library', description: 'Your YouTube Music library and liked songs.' },
      { id: 'ytm-recent', label: 'Recently Played', description: 'Your recently played tracks on YouTube Music.' },
    ],
  },
  {
    id: 'deezer',
    name: 'Deezer',
    icon: '🎶',
    description: 'Full music library and streaming.',
    category: 'Music',
    sliceTypes: [
      { id: 'dz-flow', label: 'Flow', description: 'Your personalized Deezer Flow recommendations.' },
      { id: 'dz-favorites', label: 'Favorite Tracks', description: 'Tracks you have favourited on Deezer.' },
    ],
  },
  {
    id: 'tidal',
    name: 'Tidal',
    icon: '🌊',
    description: 'Hi-res audio library and streaming.',
    category: 'Music',
    sliceTypes: [
      { id: 'td-mymusic', label: 'My Music', description: 'Your Tidal library and added albums.' },
      { id: 'td-mixes', label: 'Mixes', description: 'Your personalized Tidal Mixes.' },
    ],
  },
  {
    id: 'qobuz',
    name: 'Qobuz',
    icon: '🎼',
    description: 'Hi-res audio library and downloads.',
    category: 'Music',
    sliceTypes: [
      { id: 'qb-favorites', label: 'Favorite Albums', description: 'Albums you have favourited on Qobuz.' },
      { id: 'qb-purchases', label: 'Purchases', description: 'Your purchased Qobuz albums and tracks.' },
    ],
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: '☁️',
    description: 'Likes, playlists, and stream.',
    category: 'Music',
    sliceTypes: [
      { id: 'sc-stream', label: 'Stream', description: 'Your SoundCloud stream from people you follow.' },
      { id: 'sc-likes', label: 'Likes', description: 'Tracks you have liked on SoundCloud.' },
    ],
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    icon: '🏕️',
    description: 'Public tracks and albums (embed).',
    category: 'Music',
    sliceTypes: [
      { id: 'bc-collection', label: 'Collection', description: 'Albums and tracks in your Bandcamp collection.' },
      { id: 'bc-wishlist', label: 'Wishlist', description: 'Items on your Bandcamp wishlist.' },
    ],
  },
  {
    id: 'mixcloud',
    name: 'Mixcloud',
    icon: '🎙️',
    description: 'DJ mixes and shows (embed).',
    category: 'Music',
    sliceTypes: [
      { id: 'mc-following', label: 'Following Feed', description: 'New mixes from DJs and shows you follow.' },
      { id: 'mc-favorites', label: 'Favorites', description: 'Mixes you have favourited on Mixcloud.' },
    ],
  },
  {
    id: 'lastfm',
    name: 'Last.fm',
    icon: '📻',
    description: 'Scrobbling and music recommendations.',
    category: 'Music',
    sliceTypes: [
      { id: 'lf-recent', label: 'Recent Tracks', description: 'Your recently scrobbled tracks on Last.fm.' },
      { id: 'lf-recommendations', label: 'Recommended', description: 'Personalized Last.fm music recommendations.' },
    ],
  },
  // ── Video & Streaming ───────────────────────────────────────────────────────
  {
    id: 'vimeo',
    name: 'Vimeo',
    icon: '🎬',
    description: 'Videos, analytics, and portfolio.',
    category: 'Video',
    sliceTypes: [
      { id: 'vi-feed', label: 'Following Feed', description: 'New videos from channels you follow on Vimeo.' },
      { id: 'vi-portfolio', label: 'Portfolio', description: 'Your Vimeo video portfolio.' },
    ],
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: '🟣',
    description: 'Streams, chat, and followed channels.',
    category: 'Video',
    sliceTypes: [
      { id: 'tw-live', label: 'Live Streams', description: 'Live streams from channels you follow on Twitch.' },
      { id: 'tw-following', label: 'Following', description: 'Channels you follow on Twitch.' },
    ],
  },
  {
    id: 'dailymotion',
    name: 'Dailymotion',
    icon: '📹',
    description: 'Library and uploads.',
    category: 'Video',
    sliceTypes: [
      { id: 'dm-feed', label: 'Following Feed', description: 'Videos from channels you follow on Dailymotion.' },
      { id: 'dm-liked', label: 'Liked Videos', description: 'Videos you have liked on Dailymotion.' },
    ],
  },
  // ── Cloud Storage ───────────────────────────────────────────────────────────
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: '📂',
    description: 'Files, folders, and sharing.',
    category: 'Storage',
    sliceTypes: [
      { id: 'gd-recent', label: 'Recent Files', description: 'Recently modified files in your Google Drive.' },
      { id: 'gd-shared', label: 'Shared with Me', description: 'Files shared with you in Google Drive.' },
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: '📦',
    description: 'Files and sharing.',
    category: 'Storage',
    sliceTypes: [
      { id: 'db-recent', label: 'Recent Files', description: 'Recently modified files in your Dropbox.' },
      { id: 'db-shared', label: 'Shared Folders', description: 'Folders shared with you in Dropbox.' },
    ],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '🌐',
    description: 'Files and Microsoft 365 integration.',
    category: 'Storage',
    sliceTypes: [
      { id: 'od-recent', label: 'Recent Files', description: 'Recently modified files in your OneDrive.' },
      { id: 'od-shared', label: 'Shared with Me', description: 'Files shared with you in OneDrive.' },
    ],
  },
  {
    id: 'box',
    name: 'Box',
    icon: '📫',
    description: 'Files and collaboration.',
    category: 'Storage',
    sliceTypes: [
      { id: 'bx-recent', label: 'Recent Files', description: 'Recently modified files in your Box account.' },
      { id: 'bx-collaborated', label: 'Collaborated', description: 'Folders you are collaborating on in Box.' },
    ],
  },
  {
    id: 'icloud-drive',
    name: 'iCloud Drive',
    icon: '🍎',
    description: 'Files and photos.',
    category: 'Storage',
    sliceTypes: [
      { id: 'ic-recent', label: 'Recent Files', description: 'Recently modified files in your iCloud Drive.' },
      { id: 'ic-photos', label: 'Photos', description: 'Your iCloud Photos library.' },
    ],
  },
  {
    id: 'mega',
    name: 'MEGA',
    icon: '🔒',
    description: 'End-to-end encrypted cloud storage.',
    category: 'Storage',
    sliceTypes: [
      { id: 'mg-recent', label: 'Recent Files', description: 'Recently modified files in your MEGA account.' },
      { id: 'mg-shared', label: 'Shared Links', description: 'Encrypted links you have shared from MEGA.' },
    ],
  },
  // ── Calendars & Scheduling ──────────────────────────────────────────────────
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: '📅',
    description: 'Full events, reminders, and free/busy.',
    category: 'Calendar',
    sliceTypes: [
      { id: 'gc-upcoming', label: 'Upcoming Events', description: 'Your next 7 days of Google Calendar events.' },
      { id: 'gc-today', label: "Today's Events", description: "Today's events from your Google Calendar." },
    ],
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    icon: '📆',
    description: 'Full calendar and events via Microsoft 365.',
    category: 'Calendar',
    sliceTypes: [
      { id: 'oc-upcoming', label: 'Upcoming Events', description: 'Your next 7 days of Outlook Calendar events.' },
      { id: 'oc-today', label: "Today's Events", description: "Today's events from your Outlook Calendar." },
    ],
  },
  {
    id: 'proton-calendar',
    name: 'Proton Calendar',
    icon: '🔐',
    description: 'Encrypted private calendar.',
    category: 'Calendar',
    sliceTypes: [
      { id: 'pc-upcoming', label: 'Upcoming Events', description: 'Your next 7 days of Proton Calendar events.' },
      { id: 'pc-today', label: "Today's Events", description: "Today's encrypted Proton Calendar events." },
    ],
  },
  // ── Productivity & Notes ────────────────────────────────────────────────────
  {
    id: 'notion',
    name: 'Notion',
    icon: '📓',
    description: 'Workspace, pages, and databases.',
    category: 'Productivity',
    sliceTypes: [
      { id: 'no-recent', label: 'Recent Pages', description: 'Recently edited pages in your Notion workspace.' },
      { id: 'no-databases', label: 'Databases', description: 'Your Notion databases and tables.' },
    ],
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: '🗂️',
    description: 'Boards and cards.',
    category: 'Productivity',
    sliceTypes: [
      { id: 'tr-boards', label: 'Boards', description: 'Your Trello boards and their recent activity.' },
      { id: 'tr-cards', label: 'Assigned Cards', description: 'Cards assigned to you across all Trello boards.' },
    ],
  },
  {
    id: 'asana',
    name: 'Asana',
    icon: '✅',
    description: 'Tasks and projects.',
    category: 'Productivity',
    sliceTypes: [
      { id: 'as-tasks', label: 'My Tasks', description: 'Tasks assigned to you in Asana.' },
      { id: 'as-projects', label: 'Projects', description: 'Your active Asana projects.' },
    ],
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    icon: '⚡',
    description: 'Tasks and docs.',
    category: 'Productivity',
    sliceTypes: [
      { id: 'cu-tasks', label: 'My Tasks', description: 'Tasks assigned to you in ClickUp.' },
      { id: 'cu-docs', label: 'Recent Docs', description: 'Recently edited ClickUp Docs.' },
    ],
  },
  {
    id: 'evernote',
    name: 'Evernote',
    icon: '🐘',
    description: 'Notes and notebooks.',
    category: 'Productivity',
    sliceTypes: [
      { id: 'en-recent', label: 'Recent Notes', description: 'Your recently edited Evernote notes.' },
      { id: 'en-notebooks', label: 'Notebooks', description: 'Your Evernote notebooks.' },
    ],
  },
  // ── Health & Fitness ────────────────────────────────────────────────────────
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: '💪',
    description: 'Activity, sleep, and heart rate.',
    category: 'Health',
    sliceTypes: [
      { id: 'fb-activity', label: 'Daily Activity', description: 'Steps, calories, and activity from your Fitbit.' },
      { id: 'fb-sleep', label: 'Sleep', description: 'Your Fitbit sleep tracking data.' },
    ],
  },
  {
    id: 'strava',
    name: 'Strava',
    icon: '🏃',
    description: 'Runs, rides, and activities.',
    category: 'Health',
    sliceTypes: [
      { id: 'sv-activities', label: 'Recent Activities', description: 'Your recent Strava runs, rides, and activities.' },
      { id: 'sv-feed', label: 'Friend Feed', description: 'Activities from athletes you follow on Strava.' },
    ],
  },
  {
    id: 'apple-health',
    name: 'Apple Health',
    icon: '❤️',
    description: 'Health data and workouts.',
    category: 'Health',
    sliceTypes: [
      { id: 'ah-summary', label: 'Daily Summary', description: 'Steps, calories, and health metrics from Apple Health.' },
      { id: 'ah-workouts', label: 'Workouts', description: 'Your Apple Health workouts and activity rings.' },
    ],
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    icon: '💍',
    description: 'Sleep, readiness, and activity.',
    category: 'Health',
    sliceTypes: [
      { id: 'or-readiness', label: 'Readiness', description: 'Your daily Oura readiness score.' },
      { id: 'or-sleep', label: 'Sleep', description: 'Your Oura sleep tracking data.' },
    ],
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    icon: '⌚',
    description: 'Fitness data and activities.',
    category: 'Health',
    sliceTypes: [
      { id: 'gn-activities', label: 'Recent Activities', description: 'Your recent Garmin activities and workouts.' },
      { id: 'gn-stats', label: 'Daily Stats', description: 'Steps, heart rate, and daily stats from Garmin Connect.' },
    ],
  },
  // ── News & Reading ──────────────────────────────────────────────────────────
  {
    id: 'feedly',
    name: 'Feedly',
    icon: '📑',
    description: 'RSS feeds and saved articles.',
    category: 'News',
    sliceTypes: [
      { id: 'fe-feed', label: 'Today\'s Feed', description: 'New articles from your Feedly subscriptions.' },
      { id: 'fe-saved', label: 'Saved', description: 'Articles you have saved to read later in Feedly.' },
    ],
  },
  {
    id: 'pocket',
    name: 'Pocket',
    icon: '📥',
    description: 'Saved articles and tags.',
    category: 'News',
    sliceTypes: [
      { id: 'po-saved', label: 'Saved Articles', description: 'Articles you have saved to Pocket.' },
      { id: 'po-tagged', label: 'Tagged', description: 'Your tagged articles in Pocket.' },
    ],
  },
  {
    id: 'medium',
    name: 'Medium',
    icon: '✍️',
    description: 'Reading history and publications.',
    category: 'News',
    sliceTypes: [
      { id: 'me-following', label: 'Following Feed', description: 'Posts from writers you follow on Medium.' },
      { id: 'me-bookmarks', label: 'Bookmarks', description: 'Stories you have bookmarked on Medium.' },
    ],
  },
  // ── Finance & Trading ───────────────────────────────────────────────────────
  {
    id: 'coinbase',
    name: 'Coinbase',
    icon: '₿',
    description: 'Crypto wallet and trading.',
    category: 'Finance',
    sliceTypes: [
      { id: 'cb-portfolio', label: 'Portfolio', description: 'Your Coinbase crypto portfolio and balances.' },
      { id: 'cb-transactions', label: 'Transactions', description: 'Recent Coinbase transactions.' },
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    description: 'Payments and transactions.',
    category: 'Finance',
    sliceTypes: [
      { id: 'pp-transactions', label: 'Transactions', description: 'Your recent PayPal payment transactions.' },
      { id: 'pp-balance', label: 'Balance', description: 'Your PayPal account balance.' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '⚡',
    description: 'Payments, customers, and subscriptions.',
    category: 'Finance',
    sliceTypes: [
      { id: 'st-payments', label: 'Recent Payments', description: 'Your recent Stripe payment receipts.' },
      { id: 'st-subscriptions', label: 'Subscriptions', description: 'Active subscriptions on your Stripe account.' },
    ],
  },
  {
    id: 'alpaca',
    name: 'Alpaca Markets',
    icon: '🦙',
    description: 'Commission-free stock trading.',
    category: 'Finance',
    sliceTypes: [
      { id: 'al-portfolio', label: 'Portfolio', description: 'Your Alpaca Markets portfolio positions.' },
      { id: 'al-orders', label: 'Orders', description: 'Your recent Alpaca Markets orders.' },
    ],
  },
  // ── Travel & Maps ───────────────────────────────────────────────────────────
  {
    id: 'google-maps',
    name: 'Google Maps',
    icon: '🗺️',
    description: 'Saved places, timeline, and reviews.',
    category: 'Travel',
    sliceTypes: [
      { id: 'gm-saved', label: 'Saved Places', description: 'Your saved places and lists in Google Maps.' },
      { id: 'gm-reviews', label: 'Reviews', description: 'Your Google Maps reviews.' },
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    icon: '🚗',
    description: 'Ride history and booking.',
    category: 'Travel',
    sliceTypes: [
      { id: 'ub-history', label: 'Ride History', description: 'Your recent Uber trips.' },
      { id: 'ub-book', label: 'Quick Book', description: 'Quickly book a ride with your saved addresses.' },
    ],
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏡',
    description: 'Bookings and wishlists.',
    category: 'Travel',
    sliceTypes: [
      { id: 'ab-trips', label: 'Upcoming Trips', description: 'Your upcoming Airbnb reservations.' },
      { id: 'ab-wishlists', label: 'Wishlists', description: 'Your Airbnb saved wishlists.' },
    ],
  },
  // ── Food & Delivery ─────────────────────────────────────────────────────────
  {
    id: 'uber-eats',
    name: 'Uber Eats',
    icon: '🍔',
    description: 'Food ordering (deep link).',
    category: 'Food',
    sliceTypes: [
      { id: 'ue-order', label: 'Order Food', description: 'Order food via the Uber Eats app.' },
      { id: 'ue-recent', label: 'Recent Orders', description: 'Your recent Uber Eats orders.' },
    ],
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    icon: '🛵',
    description: 'Food ordering (deep link).',
    category: 'Food',
    sliceTypes: [
      { id: 'dd-order', label: 'Order Food', description: 'Order food via the DoorDash app.' },
      { id: 'dd-recent', label: 'Recent Orders', description: 'Your recent DoorDash orders.' },
    ],
  },
  {
    id: 'yelp',
    name: 'Yelp',
    icon: '⭐',
    description: 'Reviews and check-ins.',
    category: 'Food',
    sliceTypes: [
      { id: 'yp-reviews', label: 'My Reviews', description: 'Reviews you have written on Yelp.' },
      { id: 'yp-bookmarks', label: 'Bookmarks', description: 'Businesses you have bookmarked on Yelp.' },
    ],
  },
  // ── Smart Home ──────────────────────────────────────────────────────────────
  {
    id: 'google-home',
    name: 'Google Home',
    icon: '🏠',
    description: 'Devices, routines, and settings.',
    category: 'Smart Home',
    sliceTypes: [
      { id: 'gh-devices', label: 'Devices', description: 'Status of your Google Home smart devices.' },
      { id: 'gh-routines', label: 'Routines', description: 'Your Google Home automation routines.' },
    ],
  },
  {
    id: 'amazon-alexa',
    name: 'Amazon Alexa',
    icon: '🔵',
    description: 'Devices, skills, and routines.',
    category: 'Smart Home',
    sliceTypes: [
      { id: 'aa-devices', label: 'Devices', description: 'Status of your Alexa smart home devices.' },
      { id: 'aa-routines', label: 'Routines', description: 'Your Alexa automation routines.' },
    ],
  },
  {
    id: 'philips-hue',
    name: 'Philips Hue',
    icon: '💡',
    description: 'Lights, scenes, and schedules.',
    category: 'Smart Home',
    sliceTypes: [
      { id: 'ph-lights', label: 'Lights', description: 'Control and view status of your Philips Hue lights.' },
      { id: 'ph-scenes', label: 'Scenes', description: 'Your saved Philips Hue lighting scenes.' },
    ],
  },
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    icon: '🤖',
    description: 'Full smart home control (self-hosted).',
    category: 'Smart Home',
    sliceTypes: [
      { id: 'ha-entities', label: 'Entities', description: 'Status of your Home Assistant entities and devices.' },
      { id: 'ha-automations', label: 'Automations', description: 'Your Home Assistant automations.' },
    ],
  },
  // ── Education & Learning ────────────────────────────────────────────────────
  {
    id: 'duolingo',
    name: 'Duolingo',
    icon: '🦉',
    description: 'Language progress and streaks.',
    category: 'Education',
    sliceTypes: [
      { id: 'dl-streak', label: 'Streak', description: 'Your current Duolingo learning streak.' },
      { id: 'dl-progress', label: 'Progress', description: 'Your Duolingo course progress and XP.' },
    ],
  },
  {
    id: 'coursera',
    name: 'Coursera',
    icon: '🎓',
    description: 'Course enrollments and progress.',
    category: 'Education',
    sliceTypes: [
      { id: 'co-courses', label: 'Enrolled Courses', description: 'Courses you are enrolled in on Coursera.' },
      { id: 'co-progress', label: 'Course Progress', description: 'Your progress in enrolled Coursera courses.' },
    ],
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    icon: '📐',
    description: 'Learning progress and analytics.',
    category: 'Education',
    sliceTypes: [
      { id: 'ka-progress', label: 'Progress', description: 'Your Khan Academy course progress and mastery.' },
      { id: 'ka-assignments', label: 'Assignments', description: 'Your pending Khan Academy assignments.' },
    ],
  },
  // ── Development ─────────────────────────────────────────────────────────────
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    description: 'Projects, CI/CD, and merge requests.',
    category: 'Development',
    sliceTypes: [
      { id: 'gl-activity', label: 'Activity Feed', description: 'Your recent GitLab activity events.' },
      { id: 'gl-mrs', label: 'Merge Requests', description: 'Open merge requests assigned to you in GitLab.' },
    ],
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    icon: '🪣',
    description: 'Repositories and pipelines.',
    category: 'Development',
    sliceTypes: [
      { id: 'bb-activity', label: 'Activity Feed', description: 'Your recent Bitbucket activity events.' },
      { id: 'bb-prs', label: 'Pull Requests', description: 'Open pull requests assigned to you in Bitbucket.' },
    ],
  },
  {
    id: 'replit',
    name: 'Replit',
    icon: '🔁',
    description: 'Repls and team projects.',
    category: 'Development',
    sliceTypes: [
      { id: 'rp-repls', label: 'My Repls', description: 'Your recent Replit repls.' },
      { id: 'rp-community', label: 'Community', description: 'Trending Repls from the Replit community.' },
    ],
  },
  // ── Analytics ───────────────────────────────────────────────────────────────
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    icon: '📈',
    description: 'Full property data for your own sites.',
    category: 'Analytics',
    sliceTypes: [
      { id: 'ga-realtime', label: 'Realtime', description: 'Real-time visitors on your Google Analytics property.' },
      { id: 'ga-overview', label: 'Overview', description: 'Sessions, users, and conversions summary.' },
    ],
  },
  {
    id: 'plausible',
    name: 'Plausible',
    icon: '📊',
    description: 'Simple privacy-friendly analytics (self-hosted).',
    category: 'Analytics',
    sliceTypes: [
      { id: 'pl-stats', label: 'Site Stats', description: 'Visitors and pageviews from your Plausible dashboard.' },
      { id: 'pl-top', label: 'Top Pages', description: 'Your top-performing pages from Plausible.' },
    ],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    icon: '🛡️',
    description: 'Error tracking for your applications.',
    category: 'Analytics',
    sliceTypes: [
      { id: 'sn-issues', label: 'Open Issues', description: 'Unresolved error issues in your Sentry projects.' },
      { id: 'sn-alerts', label: 'Alerts', description: 'Recent Sentry alert notifications.' },
    ],
  },
] as const;

/** Look up a connector definition by stable ID (req 43) */
export function getConnectorDef(id: string): ConnectorDef | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}
