/**
 * app/api/embed-feed/route.ts
 *
 * GET /api/embed-feed
 *
 * Returns the baked embed feed from Supabase `embed_feed_items`, falling back
 * to the static public/feeds/embed-feed.json if the DB is unavailable.
 *
 * Query params:
 *   provider  — filter by provider ('youtube' | 'instagram', default: all)
 *   limit     — max items to return (default 20, max 50)
 *
 * Response: { ok: true, items: EmbedFeedItem[], generated_at: string }
 *
 * No authentication required — the embed feed contains public social content.
 *
 * Architecture justification: render-on-demand bake pattern —
 * docs/ARCHITECTURE.md §10. The CI workflow populates Supabase; this route
 * reads pre-fetched rows with near-zero latency.
 *
 * AXIOM 4 — Security by Default: no secrets are returned in the response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env';
import { loadEmbedFeed } from '@/lib/feeds/embedFeedLoader';
import type { EmbedFeedItem } from '@/lib/feeds/embedFeedLoader';

export interface EmbedFeedResponse {
  ok: boolean;
  items: EmbedFeedItem[];
  generated_at: string;
  source: 'supabase' | 'json_fallback';
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<EmbedFeedResponse>> {
  const { searchParams } = req.nextUrl;
  const provider = searchParams.get('provider') ?? '';
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 50);

  // ── Try Supabase first ───────────────────────────────────────────────────
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (db as any)
        .from('embed_feed_items')
        .select('provider,external_id,title,permalink,published_at,view_count,tags,embed_html,thumbnail_url,channel_title,generated_at')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (provider) {
        query.eq('provider', provider);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const items = data.map((row: Record<string, unknown>) => ({
          id:            String(row.external_id ?? ''),
          provider:      String(row.provider ?? ''),
          title:         String(row.title ?? ''),
          permalink:     String(row.permalink ?? ''),
          published_at:  String(row.published_at ?? ''),
          view_count:    Number(row.view_count ?? 0),
          tags:          Array.isArray(row.tags) ? (row.tags as string[]) : [],
          embed_html:    String(row.embed_html ?? ''),
          thumbnail_url: String(row.thumbnail_url ?? ''),
          channel_title: String(row.channel_title ?? ''),
        })) as EmbedFeedItem[];

        const generatedAt = data[0]
          ? String((data[0] as Record<string, unknown>).generated_at ?? '')
          : new Date().toISOString();

        return NextResponse.json({
          ok: true,
          items,
          generated_at: generatedAt,
          source: 'supabase',
        });
      }
    } catch {
      // Fall through to JSON fallback
    }
  }

  // ── JSON fallback ────────────────────────────────────────────────────────
  const feed = loadEmbedFeed();
  const items = provider
    ? feed.items.filter((i) => i.provider === provider).slice(0, limit)
    : feed.items.slice(0, limit);

  return NextResponse.json({
    ok: true,
    items,
    generated_at: feed.generated_at,
    source: 'json_fallback',
  });
}
