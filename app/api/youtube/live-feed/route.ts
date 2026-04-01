/**
 * app/api/youtube/live-feed/route.ts
 *
 * GET /api/youtube/live-feed
 *
 * Searches YouTube for videos matching a free-text query using the
 * server-side YOUTUBE_API_KEY. Consumed by useYouTubeLiveFeed to
 * populate the HomeFeed sliding window without exposing the API key.
 *
 * Query params:
 *   query  — search term, e.g. "weed" | "world news" | "neil degrasse tyson"
 *            (default: "world news")
 *   max    — items to return (default 5, capped at 20)
 *
 * Response: { ok: true, items: UnifiedFeedItem[], fetched: number, query: string }
 *
 * AXIOM 4 — Security by Default: API key stays server-side; never echoed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { youtubeSearchByQuery, getYouTubeApiKey } from '@/lib/connectors/providers/youtube';
import type { UnifiedFeedItem } from '@/types/connector';

export interface YouTubeLiveFeedResponse {
  ok: boolean;
  items: UnifiedFeedItem[];
  fetched: number;
  query: string;
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<YouTubeLiveFeedResponse>> {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, items: [], fetched: 0, query: '', error: 'YOUTUBE_API_KEY is not configured.' },
      { status: 503 },
    );
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get('query')?.trim() || 'world news';
  const maxParam = parseInt(searchParams.get('max') ?? '5', 10);
  const max = Math.min(Math.max(1, isNaN(maxParam) ? 5 : maxParam), 20);

  try {
    const items = await youtubeSearchByQuery(apiKey, query, max);
    return NextResponse.json({ ok: true, items, fetched: items.length, query });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, items: [], fetched: 0, query, error: message },
      { status: 502 },
    );
  }
}
