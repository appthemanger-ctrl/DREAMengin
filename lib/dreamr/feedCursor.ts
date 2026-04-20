/**
 * lib/dreamr/feedCursor.ts
 *
 * Stable cursor helpers for the DreamR feed.
 *
 * Why we need them:
 *   The route used to fetch a window with `range(offset, offset+N-1)` then
 *   re-rank with `rankFeed()`, then `.slice(0, limit)`. Because the underlying
 *   pool fetched for "page 2" is a *different* set than the pool for "page 1"
 *   (different ORDER BY tie-breaks, new posts arriving), the same id could
 *   appear in both pages — or a post that ranked #21 on page 1 could be
 *   re-promoted to #5 on page 2.
 *
 * Strategy:
 *   • Anchor pagination on a `created_at` cursor (`?before=<ISO>`), not an
 *     opaque offset. The pool is now deterministic for any (limit, before).
 *   • The route returns the oldest `created_at` it shipped as `nextCursor`,
 *     so the client can request `?before=nextCursor` for the next page.
 *   • Offset is still accepted for backward compatibility (existing UI uses
 *     it), but cursor takes precedence when both are present.
 *   • Dedupe is the caller's responsibility — they pass the set of ids they
 *     have already rendered (`?seen=id1,id2,...` truncated to 200 ids) and we
 *     filter them out *before* ranking, so the ranker uses a clean pool.
 */

export interface FeedPaginationParams {
  /** Hard cap on returned posts. */
  limit: number;
  /** Number of posts to over-fetch so the ranker has selection. */
  fetchLimit: number;
  /** ISO timestamp; only consider rows older than this. May be null. */
  before: string | null;
  /** Legacy numeric offset, used only when `before` is null. */
  offset: number;
  /** Set of post ids the client has already seen (capped at MAX_SEEN_IDS). */
  seen: Set<string>;
}

export const MAX_SEEN_IDS = 200;

/** Parse and clamp pagination params off a URLSearchParams. */
export function parseFeedParams(
  searchParams: URLSearchParams,
  defaults: { limit?: number; maxLimit?: number; poolFactor?: number; poolCap?: number } = {},
): FeedPaginationParams {
  const dl   = defaults.limit      ?? 20;
  const ml   = defaults.maxLimit   ?? 40;
  const pf   = defaults.poolFactor ?? 3;
  const pc   = defaults.poolCap    ?? 120;

  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') ?? `${dl}`, 10) || dl, ml));
  const fetchLimit = Math.min(limit * pf, pc);

  const beforeRaw = searchParams.get('before');
  const before = beforeRaw && /^\d{4}-\d{2}-\d{2}T/.test(beforeRaw) ? beforeRaw : null;

  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);

  const seenRaw = searchParams.get('seen') ?? '';
  const seenIds = seenRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SEEN_IDS);

  return { limit, fetchLimit, before, offset, seen: new Set(seenIds) };
}

/** Compute the `nextCursor` ISO string for the next request, or null. */
export function deriveNextCursor(
  ranked: Array<{ created_at?: string | null }>,
  fetchedCount: number,
  fetchLimit: number,
): string | null {
  // No more rows in the underlying pool → end of feed.
  if (fetchedCount < fetchLimit) return null;
  if (ranked.length === 0) return null;
  // Anchor on the oldest created_at returned this page so the next page
  // continues strictly older.
  let oldest: string | null = null;
  for (const r of ranked) {
    const c = r.created_at;
    if (!c) continue;
    if (oldest === null || c < oldest) oldest = c;
  }
  return oldest;
}
