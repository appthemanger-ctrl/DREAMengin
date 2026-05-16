/**
 * lib/social/normalizers.ts
 *
 * Social feed normalizers — converts Mastodon, Nostr, and Bluesky posts
 * into the unified FeedPost format used by DREAMengin's feed system.
 *
 * Architecture: adapters from the backend social aggregators into the
 * frontend connector/feed pipeline.
 */

export interface NormalizedPost {
  id: string;
  source: 'mastodon' | 'nostr' | 'bluesky' | 'connector';
  provider: string;
  content: string;
  author: {
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  mediaUrl: string | null;
  permalink: string | null;
  createdAt: string;
  visibility: 'public' | 'private' | 'close_friends';
}

// ── Mastodon ──────────────────────────────────────────────────────────────────

export interface MastodonStatus {
  id: string;
  content: string;
  created_at: string;
  url: string | null;
  visibility: string;
  account: {
    acct: string;
    display_name: string;
    avatar: string | null;
  };
  media_attachments: Array<{ url: string; type: string }>;
}

export function normalizeMastodonPost(status: MastodonStatus): NormalizedPost {
  const firstMedia = status.media_attachments[0];
  const strippedContent = status.content.replace(/<[^>]*>/g, '').trim();
  return {
    id: `mastodon:${status.id}`,
    source: 'mastodon',
    provider: 'mastodon',
    content: strippedContent,
    author: {
      handle: status.account.acct,
      displayName: status.account.display_name || null,
      avatarUrl: status.account.avatar || null,
    },
    mediaUrl: firstMedia?.url ?? null,
    permalink: status.url,
    createdAt: status.created_at,
    visibility: status.visibility === 'public' ? 'public' : 'private',
  };
}

// ── Nostr ─────────────────────────────────────────────────────────────────────

export interface NostrEvent {
  id: string;
  pubkey: string;
  content: string;
  created_at: number; // unix seconds
  tags: string[][];
}

export function normalizeNostrEvent(
  event: NostrEvent,
  authorProfile?: { name?: string; picture?: string },
): NormalizedPost {
  const mediaTag = event.tags.find((t) => t[0] === 'r' || t[0] === 'image');
  return {
    id: `nostr:${event.id}`,
    source: 'nostr',
    provider: 'nostr',
    content: event.content,
    author: {
      handle: event.pubkey.slice(0, 12),
      displayName: authorProfile?.name ?? null,
      avatarUrl: authorProfile?.picture ?? null,
    },
    mediaUrl: mediaTag?.[1] ?? null,
    permalink: null,
    createdAt: new Date(event.created_at * 1000).toISOString(),
    visibility: 'public',
  };
}

// ── Bluesky ───────────────────────────────────────────────────────────────────

export interface BlueskyPost {
  uri: string;
  cid: string;
  record: {
    text: string;
    createdAt: string;
    embed?: {
      $type: string;
      images?: Array<{ image: { ref: { $link: string } } }>;
    };
  };
  author: {
    handle: string;
    displayName?: string;
    avatar?: string;
  };
}

export function normalizeBlueskyPost(post: BlueskyPost): NormalizedPost {
  const img = post.record.embed?.images?.[0];
  return {
    id: `bluesky:${post.cid}`,
    source: 'bluesky',
    provider: 'bluesky',
    content: post.record.text,
    author: {
      handle: post.author.handle,
      displayName: post.author.displayName ?? null,
      avatarUrl: post.author.avatar ?? null,
    },
    mediaUrl: img?.image.ref.$link ? `https://cdn.bsky.app/img/feed_thumbnail/plain/${img.image.ref.$link}` : null,
    permalink: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
    createdAt: post.record.createdAt,
    visibility: 'public',
  };
}
