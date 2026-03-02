// ─── Mastodon Public Provider ─────────────────────────────────────────────────
// Fetches trending posts from public Mastodon instances.
// No auth required – public data only.

import type { FeedItem, FeedRequest } from '../types';
import type { Provider, ProviderFetchResult } from './index';
import { sanitizeUrl, htmlToText, truncate } from '../sanitize';
import { sharedFetch } from './shared-fetch';

const DEFAULT_INSTANCES = ['mastodon.social'];
const MAX_TEXT = 500;

interface MastodonStatus {
  id: string;
  created_at: string;
  content: string;
  url: string;
  account: {
    username: string;
    display_name: string;
    avatar: string;
    url: string;
  };
  media_attachments?: Array<{
    type: string;
    url: string;
    description?: string;
  }>;
  language?: string;
  reblog?: unknown;
}

function normalizeStatus(status: MastodonStatus, instance: string): FeedItem {
  const text = truncate(htmlToText(status.content), MAX_TEXT);
  return {
    id: `mastodon:${instance}:${status.id}`,
    source: instance,
    sourceType: 'social',
    providerId: 'mastodon-public',
    text,
    url: sanitizeUrl(status.url),
    author: {
      name: status.account.display_name || status.account.username,
      handle: `@${status.account.username}@${instance}`,
      avatar: status.account.avatar,
      profileUrl: status.account.url,
    },
    media: (status.media_attachments ?? []).map((m) => ({
      url: m.url,
      type: m.type === 'video' || m.type === 'gifv' ? 'video' : 'image',
      alt: m.description,
    })),
    publishedAt: new Date(status.created_at).toISOString(),
    tags: [],
  };
}

export class MastodonPublicProvider implements Provider {
  readonly id = 'mastodon-public';
  readonly type = 'social' as const;
  readonly supportsThemes = 'all' as const;
  readonly requiresConfig = false;

  private instances: string[];

  constructor(instances: string[] = DEFAULT_INSTANCES) {
    this.instances = instances;
  }

  async fetch(req: FeedRequest): Promise<ProviderFetchResult> {
    const limit = req.limit ?? 40;
    const perInstance = Math.ceil((limit * 2) / this.instances.length);

    const results = await Promise.allSettled(
      this.instances.map(async (instance) => {
        const url = `https://${instance}/api/v1/trends/statuses?limit=${Math.min(perInstance, 40)}`;
        const res = await sharedFetch(url);
        if (!res.ok) throw new Error(`Mastodon ${instance} HTTP ${res.status}`);
        const statuses: MastodonStatus[] = await res.json();
        return statuses
          .filter((s) => !s.reblog && s.content)
          .map((s) => normalizeStatus(s, instance));
      })
    );

    const items: FeedItem[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') items.push(...r.value);
    }

    return { items };
  }
}
