// types/widgetConfigs.ts
// Canonical widget config contracts. Use these instead of `unknown` at usage sites.

export type SocialProvider =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'x'
  | 'threads'
  | 'twitch'
  | 'spotify'
  | 'soundcloud'
  | 'github'
  | 'linkedin'
  | 'website';

export interface YouTubeWidgetConfig {
  videoId: string; // REQUIRED
  startSeconds?: number;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  modestBranding?: boolean;
}

export interface SocialProfileWidgetConfig {
  profiles: Array<{
    provider: SocialProvider;
    handle?: string;
    url?: string;
    showFollowers?: boolean;
  }>;
  layout?: 'grid' | 'list' | 'chips';
}

export interface SocialEmbedWidgetConfig {
  provider: SocialProvider;
  url: string; // REQUIRED
  mode?: 'embed' | 'preview';
  allowTracking?: boolean;
  sandbox?: boolean;
}

export interface SocialFeedWidgetConfig {
  sources: Array<{
    provider: SocialProvider;
    mode?: 'public' | 'authenticated';
    handle?: string;
    connectorId?: string;
  }>;
  horizon?: '24h' | '7d' | '30d';
  maxItems?: number;
  ranking?: 'chronological' | 'source_order';
}
