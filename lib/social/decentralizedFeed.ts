// lib/social/decentralizedFeed.ts
// Decentralized social feed service — fetches and normalizes posts from
// Mastodon, Bluesky, and Nostr. All fetchers gracefully handle errors so
// one broken source never blocks the others.

export type NormalizedPost = {
  id: string;
  platform: 'mastodon' | 'bluesky' | 'nostr' | 'internal';
  author: { handle: string; displayName: string; avatarUrl?: string };
  content: string;
  mediaUrls?: string[];
  createdAt: string; // ISO 8601
  url?: string;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
};

export type DecentralizedFeedConfig = {
  mastodon?: {
    instanceUrl: string;
    accessToken?: string;
    limit?: number;
  };
  bluesky?: {
    handle: string;
    appPassword: string;
    limit?: number;
  };
  nostr?: {
    relayUrls: string[];
    pubkeys?: string[];
    limit?: number;
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function extractMediaUrls(content: string): string[] {
  const urls: string[] = [];
  const regex = /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:[?#][^\s]*)?/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[0]);
  }
  return urls;
}

// ─── Mastodon ─────────────────────────────────────────────────────────────────

interface MastodonStatus {
  id: string;
  created_at: string;
  content: string;
  url: string;
  account: {
    username: string;
    display_name: string;
    avatar: string;
  };
  media_attachments?: Array<{ url: string; type: string }>;
  favourites_count?: number;
  reblogs_count?: number;
  replies_count?: number;
  reblog?: unknown;
}

export async function fetchMastodonPosts(
  instanceUrl: string,
  accessToken?: string,
  limit = 20,
): Promise<NormalizedPost[]> {
  try {
    const endpoint = accessToken
      ? `${instanceUrl}/api/v1/timelines/home`
      : `${instanceUrl}/api/v1/timelines/public`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`${endpoint}?limit=${Math.min(limit, 40)}`, { headers });
    if (!res.ok) return [];

    const statuses = (await res.json()) as MastodonStatus[];
    const instance = new URL(instanceUrl).hostname;
    return statuses
      .filter((s) => !s.reblog && s.content)
      .slice(0, limit)
      .map(
        (s): NormalizedPost => ({
          id: `mastodon:${s.id}`,
          platform: 'mastodon',
          author: {
            handle: `@${s.account.username}@${instance}`,
            displayName: s.account.display_name || s.account.username,
            avatarUrl: s.account.avatar,
          },
          content: htmlToText(s.content),
          mediaUrls: (s.media_attachments ?? [])
            .filter((m) => m.type === 'image')
            .map((m) => m.url),
          createdAt: new Date(s.created_at).toISOString(),
          url: s.url,
          likeCount: s.favourites_count,
          repostCount: s.reblogs_count,
          replyCount: s.replies_count,
        }),
      );
  } catch {
    return [];
  }
}

// ─── Bluesky ──────────────────────────────────────────────────────────────────

interface BskySession {
  accessJwt: string;
}

interface BskyFeedPost {
  post: {
    uri: string;
    author: {
      handle: string;
      displayName?: string;
      avatar?: string;
    };
    record: {
      text?: string;
      createdAt?: string;
    };
    embed?: {
      images?: Array<{ thumb?: string }>;
    };
    indexedAt: string;
    likeCount?: number;
    repostCount?: number;
    replyCount?: number;
  };
}

const BSKY_API = 'https://bsky.social/xrpc';

export async function fetchBlueskyPosts(
  handle: string,
  appPassword: string,
  limit = 20,
): Promise<NormalizedPost[]> {
  try {
    const sessionRes = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    });
    if (!sessionRes.ok) return [];
    const session = (await sessionRes.json()) as BskySession;

    const timelineRes = await fetch(
      `${BSKY_API}/app.bsky.feed.getTimeline?limit=${Math.min(limit, 100)}`,
      { headers: { Authorization: `Bearer ${session.accessJwt}` } },
    );
    if (!timelineRes.ok) return [];

    const json = (await timelineRes.json()) as { feed?: BskyFeedPost[] };
    return (json.feed ?? []).slice(0, limit).map((fp): NormalizedPost => {
      const post = fp.post;
      const postId = post.uri.split('/').pop() ?? post.uri;
      return {
        id: `bluesky:${postId}`,
        platform: 'bluesky',
        author: {
          handle: `@${post.author.handle}`,
          displayName: post.author.displayName || post.author.handle,
          avatarUrl: post.author.avatar,
        },
        content: post.record.text ?? '',
        mediaUrls: (post.embed?.images ?? [])
          .map((img) => img.thumb)
          .filter((u): u is string => Boolean(u)),
        createdAt: new Date(
          post.record.createdAt ?? post.indexedAt,
        ).toISOString(),
        url: `https://bsky.app/profile/${post.author.handle}/post/${postId}`,
        likeCount: post.likeCount,
        repostCount: post.repostCount,
        replyCount: post.replyCount,
      };
    });
  } catch {
    return [];
  }
}

// ─── Nostr ────────────────────────────────────────────────────────────────────

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  content: string;
  tags?: string[][];
}

export async function fetchNostrPosts(
  relayUrls: string[],
  pubkeys?: string[],
  limit = 20,
): Promise<NormalizedPost[]> {
  if (relayUrls.length === 0) return [];

  return new Promise((resolve) => {
    const events: NostrEvent[] = [];
    const seen = new Set<string>();
    let openCount = relayUrls.length;
    let resolved = false;

    function finish() {
      if (resolved) return;
      resolved = true;
      const posts = events
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit)
        .map(
          (e): NormalizedPost => ({
            id: `nostr:${e.id}`,
            platform: 'nostr',
            author: {
              handle: e.pubkey.slice(0, 16),
              displayName: `${e.pubkey.slice(0, 12)}…`,
            },
            content: e.content,
            mediaUrls: extractMediaUrls(e.content),
            createdAt: new Date(e.created_at * 1000).toISOString(),
            url: `https://nostr.com/e/${e.id}`,
          }),
        );
      resolve(posts);
    }

    // Safety timeout — resolve after 3 s regardless
    const timer = setTimeout(finish, 3000);

    // Guard against environments without WebSocket (e.g. edge runtime)
    if (typeof WebSocket === 'undefined') {
      clearTimeout(timer);
      resolve([]);
      return;
    }

    for (const relayUrl of relayUrls) {
      try {
        const ws = new WebSocket(relayUrl);

        ws.onopen = () => {
          const filter: Record<string, unknown> = {
            kinds: [1],
            limit: limit * 2,
          };
          if (pubkeys && pubkeys.length > 0) filter['authors'] = pubkeys;
          ws.send(JSON.stringify(['REQ', 'decentralized-feed', filter]));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as unknown[];
            if (
              msg[0] === 'EVENT' &&
              msg[2] !== null &&
              typeof msg[2] === 'object'
            ) {
              const e = msg[2] as NostrEvent;
              if (e.kind === 1 && !seen.has(e.id) && e.content?.trim()) {
                seen.add(e.id);
                events.push(e);
              }
            } else if (msg[0] === 'EOSE') {
              ws.close();
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          openCount--;
          if (openCount <= 0 && !resolved) {
            clearTimeout(timer);
            finish();
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        openCount--;
        if (openCount <= 0 && !resolved) {
          clearTimeout(timer);
          finish();
        }
      }
    }
  });
}

// ─── Combined ─────────────────────────────────────────────────────────────────

export async function fetchAllDecentralizedPosts(
  config: DecentralizedFeedConfig,
): Promise<NormalizedPost[]> {
  const fetchers: Promise<NormalizedPost[]>[] = [];

  if (config.mastodon?.instanceUrl) {
    fetchers.push(
      fetchMastodonPosts(
        config.mastodon.instanceUrl,
        config.mastodon.accessToken,
        config.mastodon.limit,
      ),
    );
  }

  if (config.bluesky?.handle && config.bluesky?.appPassword) {
    fetchers.push(
      fetchBlueskyPosts(
        config.bluesky.handle,
        config.bluesky.appPassword,
        config.bluesky.limit,
      ),
    );
  }

  if (config.nostr?.relayUrls && config.nostr.relayUrls.length > 0) {
    fetchers.push(
      fetchNostrPosts(
        config.nostr.relayUrls,
        config.nostr.pubkeys,
        config.nostr.limit,
      ),
    );
  }

  const results = await Promise.allSettled(fetchers);
  const all: NormalizedPost[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  return all.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
