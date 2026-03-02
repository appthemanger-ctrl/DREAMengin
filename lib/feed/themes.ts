// ─── Daydream Theme Profiles ─────────────────────────────────────────────────
// One profile per theme. Each profile defines: display label, keywords used for
// GDELT/RSS discovery, RSS feed URLs, social discovery modes, safety defaults,
// and media preference. See /docs/FEED_THEMES.md for the full specification.

import type { FeedTheme, SourceType } from './types';

export type SocialDiscoveryMode = 'trending' | 'public' | 'following';
export type MediaPreference = 'video-first' | 'mixed';

export interface ThemeProfile {
  id: FeedTheme;
  label: string;
  emoji: string;
  /** 10–25 search keywords / phrases for GDELT + keyword scoring */
  keywords: string[];
  /** 5–15 RSS/Atom feed URLs (open, no auth required) */
  rssFeeds: string[];
  /** 1–3 social discovery modes */
  socialModes: SocialDiscoveryMode[];
  /** Filter these words from content summaries (safe-mode default list) */
  blockedWords: string[];
  mediaPreference: MediaPreference;
  defaultSourceTypes: Array<SourceType | 'mixed'>;
}

const THEMES: Record<FeedTheme, ThemeProfile> = {
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    emoji: '📊',
    keywords: [
      'data analytics',
      'business intelligence',
      'machine learning',
      'big data',
      'data science',
      'predictive analytics',
      'dashboard metrics',
      'KPI tracking',
      'data visualization',
      'real-time analytics',
      'AI insights',
      'cloud data',
      'data pipeline',
      'statistical analysis',
    ],
    rssFeeds: [
      'https://feeds.feedburner.com/oreilly/radar',
      'https://towardsdatascience.com/feed',
      'https://www.infoq.com/analytics/rss',
      'https://datanami.com/feed/',
      'https://feeds.feedburner.com/kdnuggets-data-mining-analytics',
    ],
    socialModes: ['trending', 'public'],
    blockedWords: [],
    mediaPreference: 'mixed',
    defaultSourceTypes: ['news'],
  },

  brand: {
    id: 'brand',
    label: 'Brand',
    emoji: '✦',
    keywords: [
      'branding strategy',
      'brand identity',
      'marketing trends',
      'social media marketing',
      'content marketing',
      'digital advertising',
      'brand storytelling',
      'brand design',
      'logo design',
      'campaign launch',
      'influencer marketing',
      'brand voice',
      'product launch',
      'brand awareness',
    ],
    rssFeeds: [
      'https://feeds.feedburner.com/fastcompany/headlines',
      'https://www.marketingweek.com/feed/',
      'https://digiday.com/feed/',
      'https://www.thinkwithgoogle.com/rss',
      'https://sproutsocial.com/insights/feed/',
    ],
    socialModes: ['trending', 'public'],
    blockedWords: [],
    mediaPreference: 'mixed',
    defaultSourceTypes: ['news'],
  },

  games: {
    id: 'games',
    label: 'Games',
    emoji: '🎮',
    keywords: [
      'video games',
      'game development',
      'indie games',
      'gaming news',
      'esports',
      'game release',
      'PC gaming',
      'console gaming',
      'mobile games',
      'game review',
      'game trailer',
      'game studio',
      'game update',
      'speedrun',
      'gaming culture',
    ],
    rssFeeds: [
      'https://www.gamespot.com/feeds/mashup/',
      'https://kotaku.com/rss',
      'https://www.eurogamer.net/?format=rss',
      'https://feeds.feedburner.com/rockpapershotgun/pc-gaming-news',
      'https://www.polygon.com/rss/index.xml',
    ],
    socialModes: ['trending', 'public'],
    blockedWords: [],
    mediaPreference: 'video-first',
    defaultSourceTypes: ['news', 'social'],
  },

  'media-vault': {
    id: 'media-vault',
    label: 'Media Vault',
    emoji: '🎬',
    keywords: [
      'film reviews',
      'movie release',
      'streaming shows',
      'documentary',
      'television series',
      'podcast',
      'audiobook',
      'media production',
      'cinematography',
      'director',
      'award season',
      'animation',
      'short film',
      'media criticism',
      'entertainment news',
    ],
    rssFeeds: [
      'https://variety.com/feed/',
      'https://www.indiewire.com/feed/',
      'https://feeds.feedburner.com/thr/news',
      'https://pitchfork.com/rss/news/feed/r.xml',
      'https://www.avclub.com/rss',
    ],
    socialModes: ['trending', 'public'],
    blockedWords: [],
    mediaPreference: 'video-first',
    defaultSourceTypes: ['news', 'social'],
  },

  music: {
    id: 'music',
    label: 'Music',
    emoji: '🎵',
    keywords: [
      'new music release',
      'album review',
      'music video',
      'live concert',
      'music production',
      'independent artist',
      'record label',
      'music streaming',
      'playlist',
      'music festival',
      'music industry',
      'hip-hop',
      'electronic music',
      'singer-songwriter',
    ],
    rssFeeds: [
      'https://pitchfork.com/rss/news/feed/r.xml',
      'https://www.rollingstone.com/music/feed/',
      'https://consequenceofsound.net/feed/',
      'https://feeds.feedburner.com/stereogum',
      'https://www.nme.com/music/rss',
    ],
    socialModes: ['trending', 'public'],
    blockedWords: [],
    mediaPreference: 'mixed',
    defaultSourceTypes: ['news', 'social'],
  },

  play: {
    id: 'play',
    label: 'Play',
    emoji: '🌟',
    keywords: [
      'creativity',
      'art project',
      'design inspiration',
      'fun projects',
      'DIY build',
      'generative art',
      'interactive art',
      'maker culture',
      'creative coding',
      'experimental design',
      'play and learn',
      'open source project',
      'side project',
    ],
    rssFeeds: [
      'https://www.wired.com/feed/rss',
      'https://feeds.feedburner.com/codrops',
      'https://tympanus.net/codrops/feed/',
      'https://cooltools.org/feed',
      'https://feeds.feedburner.com/makeuseof',
    ],
    socialModes: ['trending', 'public'],
    blockedWords: [],
    mediaPreference: 'mixed',
    defaultSourceTypes: ['news', 'social'],
  },
};

export function getTheme(id: FeedTheme): ThemeProfile {
  return THEMES[id];
}

export function getAllThemes(): ThemeProfile[] {
  return Object.values(THEMES);
}

/** Sanity check: every theme must have at least one source. */
export function validateThemes(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const theme of getAllThemes()) {
    if (theme.rssFeeds.length === 0) {
      errors.push(`${theme.id}: no RSS feeds defined`);
    }
    if (theme.keywords.length < 10) {
      errors.push(`${theme.id}: fewer than 10 keywords`);
    }
  }
  return { valid: errors.length === 0, errors };
}
