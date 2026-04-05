/**
 * GET /api/youtube/channel
 *
 * Returns more videos from a YouTube channel (by channel name) and/or
 * similar videos on a topic. Powers the DreamRChannelPanel swipe-left surface.
 *
 * Query params:
 *   channel  — channel display name / title to search for (required)
 *   topic    — optional topic query to also include (e.g. "world news")
 *   max      — items per bucket (default 8, capped at 15)
 *
 * Response: { ok: true, channelVideos: UnifiedFeedItem[], similarVideos: UnifiedFeedItem[] }
 *
 * AXIOM 4 — Security by Default: API key stays server-side; never returned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { youtubeSearchByQuery, getYouTubeApiKey } from '@/lib/connectors/providers/youtube';
import type { UnifiedFeedItem } from '@/types/connector';

export interface YouTubeChannelResponse {
  ok: boolean;
  channelVideos: UnifiedFeedItem[];
  similarVideos: UnifiedFeedItem[];
  channel: string;
  topic: string;
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<YouTubeChannelResponse>> {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, channelVideos: [], similarVideos: [], channel: '', topic: '', error: 'YOUTUBE_API_KEY is not configured.' },
      { status: 503 },
    );
  }

  const { searchParams } = req.nextUrl;
  const channel = searchParams.get('channel')?.trim() ?? '';
  const topic   = searchParams.get('topic')?.trim()   ?? '';
  const maxParam = parseInt(searchParams.get('max') ?? '8', 10);
  const max = Math.min(Math.max(1, isNaN(maxParam) ? 8 : maxParam), 15);

  if (!channel && !topic) {
    return NextResponse.json(
      { ok: false, channelVideos: [], similarVideos: [], channel, topic, error: 'channel or topic is required.' },
      { status: 400 },
    );
  }

  try {
    // Fetch in parallel: more from same channel + similar topic
    const [channelVideos, similarVideos] = await Promise.all([
      channel ? youtubeSearchByQuery(apiKey, channel, max) : Promise.resolve<UnifiedFeedItem[]>([]),
      topic   ? youtubeSearchByQuery(apiKey, topic,   max) : Promise.resolve<UnifiedFeedItem[]>([]),
    ]);

    // Deduplicate similarVideos against channelVideos
    const channelIds = new Set(channelVideos.map(v => v.external_id));
    const uniqueSimilar = similarVideos.filter(v => !channelIds.has(v.external_id));

    return NextResponse.json(
      { ok: true, channelVideos, similarVideos: uniqueSimilar, channel, topic },
      { headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, channelVideos: [], similarVideos: [], channel, topic, error: message },
      { status: 502 },
    );
  }
}
