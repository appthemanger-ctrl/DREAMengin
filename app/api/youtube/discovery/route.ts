/**
 * app/api/youtube/discovery/route.ts
 *
 * GET /api/youtube/discovery
 *
 * Returns a randomly shuffled mix of globally trending YouTube videos and
 * world news videos, powered by the server-side YOUTUBE_API_KEY env var.
 *
 * No user authentication required — entirely public data.
 *
 * Query params:
 *   max    — number of items to return (default 30, max 50)
 *
 * Response: { ok: true, items: UnifiedFeedItem[], fetched: number }
 *
 * AXIOM 4 — Security by Default: API key stays server-side; never returned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { youtubeDiscovery, getYouTubeApiKey } from '@/lib/connectors/providers/youtube';
import type { UnifiedFeedItem } from '@/types/connector';

export interface YouTubeDiscoveryResponse {
  ok: boolean;
  items: UnifiedFeedItem[];
  fetched: number;
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<YouTubeDiscoveryResponse>> {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, items: [], fetched: 0, error: 'YOUTUBE_API_KEY is not configured.' },
      { status: 503 },
    );
  }

  const { searchParams } = req.nextUrl;
  const maxParam = parseInt(searchParams.get('max') ?? '30', 10);
  const max = Math.min(Math.max(1, isNaN(maxParam) ? 30 : maxParam), 50);

  try {
    const items = await youtubeDiscovery(apiKey, max);
    return NextResponse.json({ ok: true, items, fetched: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, items: [], fetched: 0, error: message },
      { status: 502 },
    );
  }
}
