/**
 * Social Media Platform Registry
 *
 * Central source of truth for all supported social platforms:
 * metadata, brand colours, emoji icons, URL pattern detection,
 * and share-URL builders used across ProfileCanvas, ProfileEditor,
 * ProfileShareButton, HomeFeed, and PlatformBadge.
 */

// ─── Platform definition ─────────────────────────────────────────────────────

export interface SocialPlatform {
  /** Canonical slug used as a key everywhere (e.g. "twitter") */
  id: string;
  /** Human-readable display name */
  label: string;
  /** Brand colour (hex) */
  color: string;
  /** Emoji icon – used when no SVG / image asset is available */
  emoji: string;
  /** Regex(es) that match a profile / post URL for this platform */
  urlPatterns: RegExp[];
  /**
   * When true the platform exposes a public URL-based share intent (e.g.
   * twitter.com/intent/tweet). When false `buildShareUrl` returns the
   * platform homepage — useful as a link target, not a share destination.
   */
  supportsShare: boolean;
  /**
   * Build a share URL for the platform.
   * For platforms where `supportsShare` is true this opens a pre-filled
   * composer. For others it simply navigates to the platform homepage.
   *
   * @param url  – the URL being shared
   * @param text – optional summary text / title
   */
  buildShareUrl: (url: string, text?: string) => string;
  /** Optional: prefix for the profile page (e.g. "https://twitter.com/") */
  profileUrlPrefix?: string;
}

// ─── Platform registry ───────────────────────────────────────────────────────

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    color: '#000000',
    emoji: '𝕏',
    supportsShare: true,
    urlPatterns: [/twitter\.com\//i, /x\.com\//i],
    buildShareUrl: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}${text ? `&text=${encodeURIComponent(text)}` : ''}`,
    profileUrlPrefix: 'https://twitter.com/',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    emoji: '📸',
    supportsShare: false,
    urlPatterns: [/instagram\.com\//i],
    buildShareUrl: () => `https://www.instagram.com/`,
    profileUrlPrefix: 'https://instagram.com/',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    emoji: '👤',
    supportsShare: true,
    urlPatterns: [/facebook\.com\//i, /fb\.com\//i],
    buildShareUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    profileUrlPrefix: 'https://facebook.com/',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    emoji: '▶️',
    supportsShare: false,
    urlPatterns: [/youtube\.com\//i, /youtu\.be\//i],
    buildShareUrl: () => `https://www.youtube.com/`,
    profileUrlPrefix: 'https://youtube.com/@',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#010101',
    emoji: '🎵',
    supportsShare: false,
    urlPatterns: [/tiktok\.com\//i],
    buildShareUrl: () => `https://www.tiktok.com/`,
    profileUrlPrefix: 'https://tiktok.com/@',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    emoji: '💼',
    supportsShare: true,
    urlPatterns: [/linkedin\.com\//i],
    buildShareUrl: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    profileUrlPrefix: 'https://linkedin.com/in/',
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    color: '#0085FF',
    emoji: '🦋',
    supportsShare: true,
    urlPatterns: [/bsky\.app\//i, /bluesky\.social\//i],
    buildShareUrl: (url, text) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text ? text + ' ' : ''}${url}`)}`,
    profileUrlPrefix: 'https://bsky.app/profile/',
  },
  {
    id: 'threads',
    label: 'Threads',
    color: '#101010',
    emoji: '🧵',
    supportsShare: true,
    urlPatterns: [/threads\.net\//i],
    buildShareUrl: (url, text) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text ? text + ' ' : ''}${url}`)}`,
    profileUrlPrefix: 'https://threads.net/@',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    emoji: '💬',
    supportsShare: true,
    urlPatterns: [/wa\.me\//i, /whatsapp\.com\//i],
    buildShareUrl: (url, text) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text ? text + ' ' : ''}${url}`)}`,
  },
  {
    id: 'discord',
    label: 'Discord',
    color: '#5865F2',
    emoji: '🎮',
    supportsShare: false,
    urlPatterns: [/discord\.gg\//i, /discord\.com\//i],
    buildShareUrl: () => `https://discord.com/`,
    profileUrlPrefix: 'https://discord.gg/',
  },
  {
    id: 'twitch',
    label: 'Twitch',
    color: '#9146FF',
    emoji: '🟣',
    supportsShare: false,
    urlPatterns: [/twitch\.tv\//i],
    buildShareUrl: () => `https://www.twitch.tv/`,
    profileUrlPrefix: 'https://twitch.tv/',
  },
  {
    id: 'github',
    label: 'GitHub',
    color: '#171515',
    emoji: '🐙',
    supportsShare: false,
    urlPatterns: [/github\.com\//i],
    buildShareUrl: () => `https://github.com/`,
    profileUrlPrefix: 'https://github.com/',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    color: '#FFFC00',
    emoji: '👻',
    supportsShare: true,
    urlPatterns: [/snapchat\.com\//i],
    buildShareUrl: (url) =>
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
    profileUrlPrefix: 'https://snapchat.com/add/',
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    color: '#E60023',
    emoji: '📌',
    supportsShare: true,
    urlPatterns: [/pinterest\.com\//i, /pin\.it\//i],
    buildShareUrl: (url, text) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}${text ? `&description=${encodeURIComponent(text)}` : ''}`,
    profileUrlPrefix: 'https://pinterest.com/',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    color: '#1DB954',
    emoji: '🎧',
    supportsShare: false,
    urlPatterns: [/spotify\.com\//i, /open\.spotify\.com\//i],
    buildShareUrl: () => `https://open.spotify.com/`,
    profileUrlPrefix: 'https://open.spotify.com/user/',
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    color: '#FF5500',
    emoji: '☁️',
    supportsShare: false,
    urlPatterns: [/soundcloud\.com\//i],
    buildShareUrl: () => `https://soundcloud.com/`,
    profileUrlPrefix: 'https://soundcloud.com/',
  },
  {
    id: 'website',
    label: 'Website',
    color: '#34d399',
    emoji: '🌐',
    supportsShare: false,
    urlPatterns: [],
    buildShareUrl: (url) => url,
  },
  {
    id: 'other',
    label: 'Other Link',
    color: '#6366f1',
    emoji: '🔗',
    supportsShare: false,
    urlPatterns: [],
    buildShareUrl: (url) => url,
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

/** Map from platform id → SocialPlatform for O(1) access */
export const PLATFORM_MAP: Record<string, SocialPlatform> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p])
);

/**
 * Detect which platform a URL belongs to.
 * Returns the matching SocialPlatform or undefined.
 */
export function detectPlatform(url: string): SocialPlatform | undefined {
  if (!url) return undefined;
  return SOCIAL_PLATFORMS.find(
    (p) => p.urlPatterns.length > 0 && p.urlPatterns.some((re) => re.test(url))
  );
}

/**
 * Return a platform by id, falling back to the 'other' platform.
 */
export function getPlatform(id: string): SocialPlatform {
  return PLATFORM_MAP[id] ?? (PLATFORM_MAP['other'] as SocialPlatform);
}

/**
 * The set of platforms shown in the "share this profile" row.
 * Derived from platforms that have supportsShare === true.
 */
export const PROFILE_SHARE_PLATFORMS: SocialPlatform[] = SOCIAL_PLATFORMS.filter(
  (p) => p.supportsShare
);
