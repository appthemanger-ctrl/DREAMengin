// GET /api/feed/home?theme=brand&limit=40&cursor=...
// Returns a FeedResponse for the requested theme.
// Serves cached results (TTL 10 min) with stale-while-revalidate.

import { NextRequest, NextResponse } from 'next/server';
import type { FeedRequest, FeedTheme, FeedCursor } from '@/lib/feed/types';
import { assembleFeed } from '@/lib/feed/assembler';
import { feedCache, coalesce } from '@/lib/feed/cache';
import { ensureProvidersRegistered } from '@/lib/feed/registry';

export const dynamic = 'force-dynamic';

const VALID_THEMES = new Set<FeedTheme>([
  'analytics',
  'brand',
  'games',
  'media-vault',
  'music',
  'play',
]);

const VALID_SOURCE_TYPES = new Set(['news', 'social', 'mixed']);

function parseCursor(raw: string | null): FeedCursor | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as FeedCursor;
  } catch {
    return undefined;
  }
}

function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export async function GET(req: NextRequest) {
  ensureProvidersRegistered();

  const { searchParams } = new URL(req.url);

  const themeParam = searchParams.get('theme') ?? 'play';
  if (!VALID_THEMES.has(themeParam as FeedTheme)) {
    return NextResponse.json({ error: `Unknown theme: ${themeParam}` }, { status: 400 });
  }
  const theme = themeParam as FeedTheme;

  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '40', 10), 1), 100);
  const cursor = parseCursor(searchParams.get('cursor'));
  const sourceTypeParam = searchParams.get('sourceType') ?? 'mixed';
  const sourceType = VALID_SOURCE_TYPES.has(sourceTypeParam)
    ? (sourceTypeParam as FeedRequest['sourceType'])
    : 'mixed';
  const maxAgeHours = parseInt(searchParams.get('maxAgeHours') ?? '48', 10);
  const safeMode = searchParams.get('safeMode') === '1';

  // Cache key: theme + limit + cursor bucket (no per-user variance on public feed)
  const cursorBucket = cursor?.lastSeenTimestamp
    ? Math.floor(new Date(cursor.lastSeenTimestamp).getTime() / (10 * 60 * 1000))
    : 0;
  const cacheKey = `${theme}:${limit}:${cursorBucket}:${sourceType}`;

  // Bypass cache flag (set by /api/feed/refresh)
  const bypass = searchParams.get('_bypass') === '1';

  if (bypass) {
    feedCache.delete(cacheKey);
  }

  const feedReq: FeedRequest = {
    theme,
    limit,
    cursor,
    sourceType,
    maxAgeHours: isNaN(maxAgeHours) ? 48 : maxAgeHours,
    safeMode,
  };

  try {
    const response = await coalesce(cacheKey, () => assembleFeed(feedReq));

    // Encode cursors for the client
    const encodedCursor = response.nextCursor ? encodeCursor(response.nextCursor) : null;

    return NextResponse.json(
      {
        ...response,
        nextCursor: encodedCursor,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    // Serve stale if available
    const stale = feedCache.getStale(cacheKey);
    if (stale) {
      return NextResponse.json(
        { ...stale, fromCache: true },
        {
          headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' },
        }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Feed assembly failed' },
      { status: 502 }
    );
  }
}
