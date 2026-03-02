// ─── Types ────────────────────────────────────────────────────────────────────

export type Platform =
  | 'hn'          // Hacker News (no auth)
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'x'           // Twitter / X
  | 'spotify'
  | 'soundcloud'
  | 'twitch'
  | 'bluesky'
  | 'mastodon'
  | 'reddit'
  | 'rss';        // generic RSS / Atom

export type FollowedAccount = {
  id: string;           // uuid
  platform: Platform;
  handle: string;       // @username or channel name
  displayName: string;
  avatarUrl?: string;
  /** Show posts in main feed */
  inFeed: boolean;
  /** Still get notifications even when inFeed=false */
  notify: boolean;
};

export type ConnectorState = {
  platform: Platform;
  /** true once user has gone through OAuth or manual setup */
  connected: boolean;
  accounts: FollowedAccount[];
};

// ─── Platform metadata ────────────────────────────────────────────────────────

export type PlatformMeta = {
  id: Platform;
  label: string;
  icon: string;
  color: string;
  authRequired: boolean;
  placeholder: string;   // input placeholder for handle
};

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  hn:         { id:'hn',         label:'Hacker News',  icon:'🔶', color:'#ff6600', authRequired:false, placeholder:'Search keyword or author' },
  tiktok:     { id:'tiktok',     label:'TikTok',       icon:'🎵', color:'#69c9d0', authRequired:true,  placeholder:'@creator' },
  instagram:  { id:'instagram',  label:'Instagram',    icon:'📸', color:'#e1306c', authRequired:true,  placeholder:'@username' },
  facebook:   { id:'facebook',   label:'Facebook',     icon:'👥', color:'#1877f2', authRequired:true,  placeholder:'Profile name or Page' },
  youtube:    { id:'youtube',    label:'YouTube',      icon:'▶️', color:'#ff0000', authRequired:true,  placeholder:'@channel' },
  x:          { id:'x',         label:'X / Twitter',  icon:'𝕏',  color:'#1d9bf0', authRequired:true,  placeholder:'@handle' },
  spotify:    { id:'spotify',    label:'Spotify',      icon:'🎧', color:'#1db954', authRequired:true,  placeholder:'Artist or Playlist' },
  soundcloud: { id:'soundcloud', label:'SoundCloud',   icon:'🔊', color:'#ff5500', authRequired:true,  placeholder:'@artist' },
  twitch:     { id:'twitch',     label:'Twitch',       icon:'🟣', color:'#9146ff', authRequired:true,  placeholder:'@channel' },
  bluesky:    { id:'bluesky',    label:'Bluesky',      icon:'🦋', color:'#0085ff', authRequired:true,  placeholder:'@user.bsky.social' },
  mastodon:   { id:'mastodon',   label:'Mastodon',     icon:'🐘', color:'#6364ff', authRequired:true,  placeholder:'@user@instance' },
  reddit:     { id:'reddit',     label:'Reddit',       icon:'🤖', color:'#ff4500', authRequired:false, placeholder:'r/subreddit or u/user' },
  rss:        { id:'rss',        label:'RSS / Atom',   icon:'📡', color:'#f26522', authRequired:false, placeholder:'https://feed-url.com/rss' },
};

export const ALL_PLATFORMS = Object.values(PLATFORM_META);

// ─── Persistence ──────────────────────────────────────────────────────────────

const CONNECTORS_KEY = 'dreamengin:connectors';

export function loadConnectors(): ConnectorState[] {
  try {
    const raw = localStorage.getItem(CONNECTORS_KEY);
    if (raw) return JSON.parse(raw) as ConnectorState[];
  } catch { /* noop */ }
  return [
    { platform: 'hn', connected: true, accounts: [] },
  ];
}

export function saveConnectors(state: ConnectorState[]) {
  try { localStorage.setItem(CONNECTORS_KEY, JSON.stringify(state)); } catch { /* noop */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function makeAccount(platform: Platform, handle: string, displayName?: string): FollowedAccount {
  return {
    id: `${platform}-${handle}-${Date.now()}`,
    platform,
    handle: handle.startsWith('@') ? handle : `@${handle}`,
    displayName: displayName ?? handle,
    inFeed: true,
    notify: true,
  };
}
