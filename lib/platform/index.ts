/**
 * lib/platform/index.ts
 *
 * DREAMengin Platform Utilities — public API surface.
 *
 * Re-exports utilities from the platform sub-modules so consumers can import
 * from a single, stable path.
 *
 * Server-side operations (financial, registry sync) are exposed as typed
 * fetch helpers that delegate to the appropriate API routes; they must never
 * call Supabase directly from the browser for those operations.
 *
 * Browser-safe operations (e.g. physics telemetry, social feed) may use the
 * Supabase browser client because RLS enforces the auth boundary.
 *
 * Architecture: docs/ARCHITECTURE.md §3 — logic layer (lib/).
 */

// ── Physics / Lab telemetry (browser-safe, RLS-protected) ────────────────────
export { logPhysicsExperiment } from './lab';

// ── Social feed ───────────────────────────────────────────────────────────────
// The canonical feed lives in app/api/feed/route.ts.
// This helper fetches from that route so callers don't need the URL.

export type FeedEntry = {
  id: string;
  source: 'connector' | 'post' | 'system';
  provider?: string;
  author_handle?: string;
  author_name?: string;
  author_avatar?: string | null;
  content_text?: string;
  published_at: string;
  likes_count?: number;
};

/**
 * Fetches the unified HomeDream feed from the server-side API route.
 * Returns an empty array on error.
 */
export async function getFeed(opts?: {
  limit?: number;
  before?: string;
  provider?: string;
  sort?: 'recent' | 'trending';
}): Promise<FeedEntry[]> {
  const params = new URLSearchParams();
  if (opts?.limit)    params.set('limit',    String(opts.limit));
  if (opts?.before)   params.set('before',   opts.before);
  if (opts?.provider) params.set('provider', opts.provider);
  if (opts?.sort)     params.set('sort',     opts.sort);

  try {
    const res = await fetch(`/api/feed?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.feed ?? [];
  } catch (err) {
    console.error('Feed fetch error:', err);
    return [];
  }
}

// ── Global Association Layer — GAL registry sync (server-delegated) ───────────

export type RegistryEntry = {
  id: string;
  object_type: string;
  internal_id: string;
  label: string;
  owner_id: string | null;
  created_at: string;
};

/**
 * Registers a platform object in the global_registry ("Everything to Everything").
 * Delegates to POST /api/gal which enforces authentication server-side.
 *
 * @param type       - Object type (e.g. 'post', 'experiment', 'music')
 * @param internalId - UUID of the object in its native table
 * @param label      - Human-readable label (handle, title, etc.)
 */
export async function syncToGlobalRegistry(
  type: string,
  internalId: string,
  label: string,
): Promise<{ data: RegistryEntry | null; error: string | null }> {
  try {
    const res = await fetch('/api/gal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, internalId, label }),
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? 'Registry sync failed.' };
    return { data: json.data as RegistryEntry, error: null };
  } catch (err) {
    console.error('GAL sync error:', err);
    return { data: null, error: 'Registry sync failed.' };
  }
}

// ── Monetization — Ad order processing (server-delegated) ─────────────────────

export type AdOrderResult = {
  id: string;
  ad_listing_id: string;
  buyer_id: string;
  gross_revenue: number;
  platform_share: number;
  creator_share: number;
  platform_payout: number;
  creator_payout: number;
  status: string;
};

/**
 * Creates an ad order with the 10% platform / 90% creator revenue split.
 * Delegates to POST /api/ads/orders which enforces authentication server-side
 * and calculates the split — never trust client-supplied financial values.
 *
 * @param listingId   - UUID of the ad_listings record
 * @param grossAmount - Total gross revenue for this order (in dollars)
 */
export async function processAdOrder(
  listingId: string,
  grossAmount: number,
): Promise<{ data: AdOrderResult | null; error: string | null }> {
  try {
    const res = await fetch('/api/ads/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, grossAmount }),
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? 'Ad order failed.' };
    return { data: json.data as AdOrderResult, error: null };
  } catch (err) {
    console.error('Ad order error:', err);
    return { data: null, error: 'Ad order failed.' };
  }
}
