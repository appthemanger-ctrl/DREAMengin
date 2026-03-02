// ─── Nostr Public Provider ────────────────────────────────────────────────────
// Fetches recent kind=1 text notes from a curated relay list via HTTP REST.
// No auth required – public data only.
//
// NOTE: We use the nostr.band REST search API (free) instead of raw WebSocket
// relays because Next.js API routes run in a server context that does not have
// persistent WebSocket support. The nostr.band API mirrors relay data and
// supports basic queries without a key.

import type { FeedItem, FeedRequest } from '../types';
import type { Provider, ProviderFetchResult } from './index';
import { truncate } from '../sanitize';
import { sharedFetch } from './shared-fetch';

const NOSTR_BAND_SEARCH = 'https://api.nostr.band/v0/trending/notes';
const MAX_TEXT = 500;

interface NostrBandNote {
  id: string;
  pubkey: string;
  created_at: number; // unix seconds
  kind: number;
  content: string;
  tags?: string[][];
}

interface NostrBandResponse {
  notes?: Array<{ id: string; event: NostrBandNote }>;
}

function extractFirstMediaUrl(content: string): string | undefined {
  const urlMatch = content.match(/https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|mp4|mov)/i);
  return urlMatch?.[0];
}

function noteToFeedItem(note: NostrBandNote): FeedItem | null {
  if (note.kind !== 1 || !note.content?.trim()) return null;

  const text = truncate(note.content, MAX_TEXT);
  const mediaUrl = extractFirstMediaUrl(note.content);

  return {
    id: `nostr:${note.id}`,
    source: 'nostr',
    sourceType: 'social',
    providerId: 'nostr-public',
    text,
    author: {
      name: note.pubkey.slice(0, 12) + '…',
      handle: note.pubkey.slice(0, 16),
    },
    media: mediaUrl ? [{ url: mediaUrl, type: 'image' }] : [],
    publishedAt: new Date(note.created_at * 1000).toISOString(),
    tags: (note.tags ?? [])
      .filter((t) => t[0] === 't')
      .map((t) => t[1])
      .filter(Boolean),
  };
}

export class NostrPublicProvider implements Provider {
  readonly id = 'nostr-public';
  readonly type = 'social' as const;
  readonly supportsThemes = 'all' as const;
  readonly requiresConfig = false;

  async fetch(req: FeedRequest): Promise<ProviderFetchResult> {
    const limit = req.limit ?? 40;

    const res = await sharedFetch(NOSTR_BAND_SEARCH, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Nostr.band HTTP ${res.status}`);

    const json = await res.json() as NostrBandResponse;
    const notes = json.notes ?? [];

    // Dedupe by event id across relays
    const seen = new Set<string>();
    const items: FeedItem[] = [];
    for (const { event } of notes) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      const item = noteToFeedItem(event);
      if (item) items.push(item);
      if (items.length >= limit * 2) break;
    }

    return { items };
  }
}
