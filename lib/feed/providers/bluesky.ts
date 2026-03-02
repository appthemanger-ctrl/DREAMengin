// ─── Bluesky Public Provider ─────────────────────────────────────────────────
// Fetches popular/trending posts from the public Bluesky AppView.
// No auth required – public data only.
// Docs: https://docs.bsky.app/docs/api/app-bsky-feed-get-popular-feed-generators

import type { FeedItem, FeedRequest } from '../types';
import type { Provider, ProviderFetchResult } from './index';
import { sanitizeUrl, truncate } from '../sanitize';
import { sharedFetch } from './shared-fetch';

const BSKY_PUBLIC_API = 'https://public.api.bsky.app/xrpc';
const MAX_TEXT = 500;

interface BskyPost {
  uri: string;
  cid: string;
  author: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  record: {
    text?: string;
    createdAt?: string;
    embed?: {
      images?: Array<{ image: unknown; alt?: string }>;
      external?: { uri?: string; title?: string; description?: string; thumb?: unknown };
    };
  };
  embed?: {
    images?: Array<{ thumb?: string; alt?: string }>;
    external?: { uri?: string; title?: string; description?: string; thumb?: string };
  };
  indexedAt: string;
}

interface BskyFeedPost {
  post: BskyPost;
  reason?: unknown;
}

function postToFeedItem(fp: BskyFeedPost): FeedItem | null {
  const post = fp.post;
  if (!post?.record?.text) return null;

  const text = truncate(post.record.text, MAX_TEXT);
  const handle = post.author.handle;
  const permalink = `https://bsky.app/profile/${handle}/post/${post.uri.split('/').pop()}`;

  // Extract media
  const media: FeedItem['media'] = [];
  const images = post.embed?.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (img.thumb) media.push({ url: img.thumb, type: 'image', alt: img.alt });
    }
  }
  const external = post.embed?.external;
  if (external?.thumb) {
    media.push({ url: external.thumb, type: 'image' });
  }

  return {
    id: `bsky:${post.uri.replace(/[^a-zA-Z0-9]/g, '_')}`,
    source: 'bsky.app',
    sourceType: 'social',
    providerId: 'bluesky-public',
    text,
    title: external?.title,
    url: sanitizeUrl(permalink),
    author: {
      name: post.author.displayName || handle,
      handle: `@${handle}`,
      avatar: post.author.avatar,
      profileUrl: `https://bsky.app/profile/${handle}`,
    },
    media,
    publishedAt: new Date(post.record.createdAt ?? post.indexedAt).toISOString(),
    tags: [],
  };
}

export class BlueskyPublicProvider implements Provider {
  readonly id = 'bluesky-public';
  readonly type = 'social' as const;
  readonly supportsThemes = 'all' as const;
  readonly requiresConfig = false;

  async fetch(req: FeedRequest): Promise<ProviderFetchResult> {
    const limit = req.limit ?? 40;

    const params = new URLSearchParams({
      feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
      limit: String(Math.min(limit * 2, 100)),
    });

    const url = `${BSKY_PUBLIC_API}/app.bsky.feed.getFeed?${params.toString()}`;
    const res = await sharedFetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Bluesky HTTP ${res.status}`);

    const json = await res.json() as { feed?: BskyFeedPost[]; cursor?: string };
    const posts = json.feed ?? [];

    const items: FeedItem[] = posts
      .map(postToFeedItem)
      .filter((i): i is FeedItem => i !== null);

    return {
      items,
      nextCursor: json.cursor,
    };
  }
}
