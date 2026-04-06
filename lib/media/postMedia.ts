export interface PostMediaShape {
  media_url?: unknown;
  media_urls?: unknown;
  media_json?: unknown;
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStringValues(entry));
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => collectStringValues(entry));
  }

  return [];
}

export function getPostMediaUrls(post: PostMediaShape): string[] {
  const seen = new Set<string>();
  const urls = [
    ...collectStringValues(post.media_url),
    ...collectStringValues(post.media_urls),
    ...collectStringValues(post.media_json),
  ];

  return urls.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export function getPrimaryPostMediaUrl(post: PostMediaShape): string | null {
  return getPostMediaUrls(post)[0] ?? null;
}
