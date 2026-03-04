// app/api/social/decentralized/route.ts
// GET /api/social/decentralized
// Returns merged decentralized feed posts from Mastodon, Bluesky, and Nostr.
// Credentials are read from server-side env vars only (never exposed to browser).

import { NextResponse } from 'next/server';
import {
  fetchAllDecentralizedPosts,
  type NormalizedPost,
  type DecentralizedFeedConfig,
} from '@/lib/social/decentralizedFeed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mastodonInstanceUrl =
    process.env.MASTODON_INSTANCE_URL ?? 'https://mastodon.social';
  const mastodonToken = process.env.MASTODON_ACCESS_TOKEN;
  const blueskyHandle = process.env.BLUESKY_HANDLE;
  const blueskyPassword = process.env.BLUESKY_APP_PASSWORD;
  const nostrRelayEnv = process.env.NOSTR_RELAY_URLS;
  const nostrRelayUrls = nostrRelayEnv
    ? nostrRelayEnv.split(',').map((u) => u.trim()).filter(Boolean)
    : ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];

  const config: DecentralizedFeedConfig = {
    mastodon: {
      instanceUrl: mastodonInstanceUrl,
      accessToken: mastodonToken,
      limit: 20,
    },
    nostr: {
      relayUrls: nostrRelayUrls,
      limit: 20,
    },
  };

  // Only include Bluesky when both credentials are present
  if (blueskyHandle && blueskyPassword) {
    config.bluesky = {
      handle: blueskyHandle,
      appPassword: blueskyPassword,
      limit: 20,
    };
  }

  const posts: NormalizedPost[] = await fetchAllDecentralizedPosts(config);

  const sources: string[] = [
    ...new Set(posts.map((p) => p.platform)),
  ];

  return NextResponse.json(
    { posts, sources },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
      },
    },
  );
}
