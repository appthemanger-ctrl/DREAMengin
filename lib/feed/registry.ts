// ─── Provider Registration ────────────────────────────────────────────────────
// Import all providers and register them in the registry.
// This file is imported once server-side (in API routes).

import { registerProvider } from './providers/index';
import { RSSProvider } from './providers/rss';
import { GDELTProvider } from './providers/gdelt';
import { MastodonPublicProvider } from './providers/mastodon';
import { BlueskyPublicProvider } from './providers/bluesky';
import { NostrPublicProvider } from './providers/nostr';

let registered = false;

export function ensureProvidersRegistered(): void {
  if (registered) return;
  registered = true;

  registerProvider(new RSSProvider());
  registerProvider(new GDELTProvider());
  registerProvider(new MastodonPublicProvider());
  registerProvider(new BlueskyPublicProvider());
  registerProvider(new NostrPublicProvider());
}
