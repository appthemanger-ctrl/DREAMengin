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

  /**
   * Optional filters applied before ranking.
   * Keep this shape stable because runtime parsing depends on it.
   */
  filter?: {
    includeKinds?: string[];
    excludeKeywords?: string[];
  };
}

// ---------------------------------------------------------------------------
// Dreamengin widget typing helpers used by lib/widgets/parse.ts
// ---------------------------------------------------------------------------

export type DreamenginWidgetType =
  | 'youtube'
  | 'social_embed'
  | 'social_profile'
  | 'social_feed'
  | 'embed'
  | 'text';

export interface EmbedWidgetConfig {
  url?: string;
  src?: string;
  title?: string;
  provider?: 'iframe' | 'custom';
  aspectRatio?: '16:9' | '4:3' | '1:1';
  sandbox?: boolean;
}

export interface TextWidgetConfig {
  text?: string;
  body?: string;
  format?: 'plain' | 'markdown';
}

export type TypedWidget =
  | { id: string; type: 'youtube'; config: YouTubeWidgetConfig }
  | { id: string; type: 'social_embed'; config: SocialEmbedWidgetConfig }
  | { id: string; type: 'social_profile'; config: SocialProfileWidgetConfig }
  | { id: string; type: 'social_feed'; config: SocialFeedWidgetConfig }
  | { id: string; type: 'embed'; config: EmbedWidgetConfig }
  | { id: string; type: 'text'; config: TextWidgetConfig };
