// lib/widgets/parseConfig.ts
import type {
  SocialEmbedWidgetConfig,
  SocialFeedWidgetConfig,
  SocialProfileWidgetConfig,
  SocialProvider,
  YouTubeWidgetConfig,
} from '@/types/widgetConfigs';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function asNum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function asStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

const PROVIDERS: ReadonlySet<string> = new Set([
  'youtube',
  'instagram',
  'tiktok',
  'x',
  'threads',
  'twitch',
  'spotify',
  'soundcloud',
  'github',
  'linkedin',
  'website',
]);

function asProvider(v: unknown): SocialProvider | undefined {
  const s = asStr(v);
  if (!s) return undefined;
  return PROVIDERS.has(s) ? (s as SocialProvider) : undefined;
}

export function parseYouTubeWidgetConfig(raw: unknown): YouTubeWidgetConfig {
  if (!isRecord(raw)) throw new Error('YouTube config must be an object');
  const videoId = asStr(raw.videoId) ?? asStr(raw.video_id);
  if (!videoId) throw new Error('YouTube config missing videoId');

  return {
    videoId,
    startSeconds: asNum(raw.startSeconds) ?? asNum(raw.start_seconds),
    autoplay: asBool(raw.autoplay),
    muted: asBool(raw.muted),
    loop: asBool(raw.loop),
    controls: asBool(raw.controls),
    modestBranding: asBool(raw.modestBranding) ?? asBool(raw.modest_branding),
  };
}

export function parseSocialEmbedWidgetConfig(raw: unknown): SocialEmbedWidgetConfig {
  if (!isRecord(raw)) throw new Error('Social embed config must be an object');
  const provider = asProvider(raw.provider) ?? inferProviderFromUrl(asStr(raw.url));
  const url = asStr(raw.url);
  if (!provider) throw new Error('Social embed config missing provider');
  if (!url) throw new Error('Social embed config missing url');

  const mode = raw.mode === 'preview' ? 'preview' : raw.mode === 'embed' ? 'embed' : undefined;

  return {
    provider,
    url,
    mode,
    allowTracking: asBool(raw.allowTracking) ?? asBool(raw.allow_tracking),
    sandbox: asBool(raw.sandbox),
  };
}

export function parseSocialProfileWidgetConfig(raw: unknown): SocialProfileWidgetConfig {
  if (!isRecord(raw)) throw new Error('Social profile config must be an object');
  const profilesRaw = raw.profiles;
  if (!Array.isArray(profilesRaw)) throw new Error('Social profile config missing profiles[]');

  const profiles = profilesRaw
    .map((p) => {
      if (!isRecord(p)) return null;
      const provider = asProvider(p.provider) ?? inferProviderFromUrl(asStr(p.url));
      if (!provider) return null;
      return {
        provider,
        handle: asStr(p.handle),
        url: asStr(p.url),
        showFollowers: asBool(p.showFollowers) ?? asBool(p.show_followers),
      };
    })
    .filter(Boolean) as SocialProfileWidgetConfig['profiles'];

  if (profiles.length === 0) throw new Error('Social profile profiles[] had no valid entries');

  const layout = raw.layout === 'grid' || raw.layout === 'list' || raw.layout === 'chips' ? raw.layout : undefined;

  return { profiles, layout };
}

export function parseSocialFeedWidgetConfig(raw: unknown): SocialFeedWidgetConfig {
  if (!isRecord(raw)) throw new Error('Social feed config must be an object');
  const sourcesRaw = raw.sources;
  if (!Array.isArray(sourcesRaw)) throw new Error('Social feed config missing sources[]');

  const sources = sourcesRaw
    .map((s) => {
      if (!isRecord(s)) return null;
      const provider = asProvider(s.provider);
      if (!provider) return null;
      const mode = s.mode === 'authenticated' ? 'authenticated' : 'public';
      return {
        provider,
        mode,
        handle: asStr(s.handle),
        connectorId: asStr(s.connectorId) ?? asStr(s.connector_id),
      };
    })
    .filter(Boolean) as SocialFeedWidgetConfig['sources'];

  if (sources.length === 0) throw new Error('Social feed sources[] had no valid entries');

  const horizon = raw.horizon === '24h' || raw.horizon === '7d' || raw.horizon === '30d' ? raw.horizon : undefined;
  const ranking = raw.ranking === 'source_order' ? 'source_order' : raw.ranking === 'chronological' ? 'chronological' : undefined;
  const maxItems = typeof raw.maxItems === 'number' && Number.isFinite(raw.maxItems) ? raw.maxItems : undefined;

  return { sources, horizon, maxItems, ranking };
}

export function inferProviderFromUrl(url?: string): SocialProvider | undefined {
  if (!url) return undefined;
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x';
  if (u.includes('threads.net')) return 'threads';
  if (u.includes('twitch.tv')) return 'twitch';
  if (u.includes('spotify.com')) return 'spotify';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('github.com')) return 'github';
  if (u.includes('linkedin.com')) return 'linkedin';
  return 'website';
}
