// lib/widgets/parse.ts
// No zod dependency: manual runtime validation + safe defaults.

import type {
  DreamenginWidgetType,
  TypedWidget,
  YouTubeWidgetConfig,
  SocialEmbedWidgetConfig,
  SocialFeedWidgetConfig,
  SocialProfileWidgetConfig,
  EmbedWidgetConfig,
  TextWidgetConfig,
  SocialProvider,
} from '@/types/widgetConfigs';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  'youtube','instagram','tiktok','x','threads','twitch','spotify','soundcloud','github','linkedin','website'
];

function asProvider(v: unknown): SocialProvider | undefined {
  const s = asString(v);
  if (!s) return undefined;
  return (SOCIAL_PROVIDERS as string[]).includes(s) ? (s as SocialProvider) : undefined;
}

export function parseYouTubeConfig(raw: unknown): YouTubeWidgetConfig {
  if (!isRecord(raw)) throw new Error('youtube config must be an object');

  // accept either videoId or full url
  const videoId = asString(raw.videoId) ?? extractYouTubeVideoId(asString(raw.url));
  if (!videoId) throw new Error('youtube config requires videoId (or url containing video id)');

  return {
    videoId,
    startSeconds: asNumber(raw.startSeconds),
    autoplay: asBool(raw.autoplay),
    muted: asBool(raw.muted),
    loop: asBool(raw.loop),
    controls: asBool(raw.controls),
    modestBranding: asBool(raw.modestBranding),
  };
}

function extractYouTubeVideoId(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').trim();
      return id || undefined;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      // /embed/ID
      const parts = u.pathname.split('/').filter(Boolean);
      const embedIndex = parts.indexOf('embed');
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function parseTextConfig(raw: unknown): TextWidgetConfig {
  if (!isRecord(raw)) throw new Error('text config must be an object');
  const body = asString(raw.body) ?? asString(raw.text) ?? '';
  if (!body.trim()) throw new Error('text config requires body');
  const format = asString(raw.format);
  return { body, format: format === 'markdown' ? 'markdown' : 'plain' };
}

export function parseEmbedConfig(raw: unknown): EmbedWidgetConfig {
  if (!isRecord(raw)) throw new Error('embed config must be an object');
  const src = asString(raw.src) ?? asString(raw.url);
  if (!src) throw new Error('embed config requires src');
  const provider = asString(raw.provider) === 'custom' ? 'custom' : 'iframe';
  const aspectRatio = asString(raw.aspectRatio);
  return {
    provider,
    src,
    aspectRatio: aspectRatio === '4:3' || aspectRatio === '1:1' ? (aspectRatio as any) : '16:9',
    sandbox: asBool(raw.sandbox),
  };
}

export function parseSocialEmbedConfig(raw: unknown): SocialEmbedWidgetConfig {
  if (!isRecord(raw)) throw new Error('social_embed config must be an object');
  const url = asString(raw.url);
  if (!url) throw new Error('social_embed config requires url');
  const provider = asProvider(raw.provider);
  if (!provider || provider === 'website') throw new Error('social_embed config requires provider');
  const mode = asString(raw.mode) === 'preview' ? 'preview' : 'embed';
  return {
    provider: provider as Exclude<SocialProvider, 'website'>,
    url,
    mode,
    allowTracking: asBool(raw.allowTracking),
    sandbox: asBool(raw.sandbox),
  };
}

export function parseSocialProfileConfig(raw: unknown): SocialProfileWidgetConfig {
  if (!isRecord(raw)) throw new Error('social_profile config must be an object');
  const layoutRaw = asString(raw.layout);
  const layout = layoutRaw === 'grid' || layoutRaw === 'chips' ? layoutRaw : 'list';

  const profilesRaw = raw.profiles;
  if (!Array.isArray(profilesRaw)) throw new Error('social_profile config requires profiles[]');

  const profiles = profilesRaw.map((p) => {
    if (!isRecord(p)) throw new Error('profile entry must be object');
    const provider = asProvider(p.provider);
    if (!provider) throw new Error('profile entry requires provider');
    return {
      provider,
      handle: asString(p.handle),
      url: asString(p.url),
      verified: asBool(p.verified),
      showFollowers: asBool(p.showFollowers),
    };
  });

  return { profiles, layout };
}

export function parseSocialFeedConfig(raw: unknown): SocialFeedWidgetConfig {
  if (!isRecord(raw)) throw new Error('social_feed config must be an object');
  const sourcesRaw = raw.sources;
  if (!Array.isArray(sourcesRaw) || sourcesRaw.length === 0) {
    throw new Error('social_feed config requires sources[]');
  }
  const horizonRaw = asString(raw.horizon);
  const horizon: '24h'|'7d'|'30d' = horizonRaw === '7d' || horizonRaw === '30d' ? (horizonRaw as any) : '24h';
  const maxItems = asNumber(raw.maxItems) ?? 25;
  const rankingRaw = asString(raw.ranking);
  const ranking: 'chronological'|'source_order' = rankingRaw === 'source_order' ? 'source_order' : 'chronological';

  const sources = sourcesRaw.map((s) => {
    if (!isRecord(s)) throw new Error('source entry must be object');
    const provider = asProvider(s.provider);
    if (!provider || provider === 'website') throw new Error('source entry requires provider');
    const mode: 'public' | 'authenticated' = asString(s.mode) === 'authenticated' ? 'authenticated' : 'public';
    return {
      provider: provider as Exclude<SocialProvider, 'website'>,
      mode,
      handle: asString(s.handle),
      connectorId: asString(s.connectorId),
    };
  });

  const filterRaw = raw.filter;
  let filter: SocialFeedWidgetConfig['filter'] | undefined;
  if (isRecord(filterRaw)) {
    const includeKinds = Array.isArray(filterRaw.includeKinds)
      ? (filterRaw.includeKinds.filter((k) => typeof k === 'string') as any)
      : undefined;
    const excludeKeywords = Array.isArray(filterRaw.excludeKeywords)
      ? filterRaw.excludeKeywords.filter((k) => typeof k === 'string')
      : undefined;
    filter = { includeKinds, excludeKeywords };
  }

  return { sources, horizon, maxItems, ranking, filter };
}

export function parseTypedWidget(input: { id: string; type: string; config: unknown }): TypedWidget {
  const type = input.type as DreamenginWidgetType;
  switch (type) {
    case 'youtube':
      return { id: input.id, type, config: parseYouTubeConfig(input.config) };
    case 'social_embed':
      return { id: input.id, type, config: parseSocialEmbedConfig(input.config) };
    case 'social_profile':
      return { id: input.id, type, config: parseSocialProfileConfig(input.config) };
    case 'social_feed':
      return { id: input.id, type, config: parseSocialFeedConfig(input.config) };
    case 'embed':
      return { id: input.id, type, config: parseEmbedConfig(input.config) };
    case 'text':
      return { id: input.id, type, config: parseTextConfig(input.config) };
    default:
      throw new Error(`Unsupported widget type: ${input.type}`);
  }
}
