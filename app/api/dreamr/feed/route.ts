/**
 * GET /api/dreamr/feed  ← live HTTP boundary
 *
 * All handler logic lives in the shared module:
 *   app/dreamdmbar/_components/dreamr/api/feedHandler.ts
 *
 * That module is under `_components/` so Next.js never accidentally serves it
 * as a duplicate route. This thin re-export keeps the routing boundary clean
 * and the implementation in one place.
 *
 * -----------------------------------------------------------------------------
 * DreamR-scored feed. Fetches public posts, scores every one with the
 * DreamR humanistic algorithm, and returns them ranked so that creativity,
 * originality, and artistry lead — not follower counts or raw engagement.
 *
 * Query params:
 *   limit    — posts to return (default 20, max 40)
 *   offset   — legacy pagination offset (used only when `before` is absent)
 *   before   — ISO timestamp cursor; returns posts strictly older than it
 *   seen     — comma-separated ids the client has already rendered;
 *              dropped from the pool *before* ranking so pages don't
 *              double-count and the ranker has a clean window
 *
 * Response:
 *   { posts: ScoredPost[], count: number, nextCursor: string | null }
 *
 * Each returned post carries the full DreamR transparency payload:
 *   • dreamr_score    — composite 0-100
 *   • dreamr_signals  — per-signal 0-1 breakdown
 *   • dominant_signal — which signal led to its rank
 *   • dreamr_reason   — short human phrasing of dominant_signal
 *   • view_velocity   — public views per hour since posted
 *   • torridity_rank, originality_mass — torridity-ledger weights
 *
 * Visibility:
 *   Public posts always pass through. `post_visibility = 'close_friends'`
 *   posts pass only when the viewer is on the poster's CF list, or owns
 *   the post. The CF circle is fetched best-effort via the service role;
 *   when unavailable the filter degrades to "public + own" which is the
 *   conservative correct behaviour.
 *
 * The algorithm guarantees creator diversity: the same handle never appears
 * in consecutive slots, so the feed always feels like a wide open stage
 * where everyone gets their moment.
 */

import { dreamrFeedHandler } from '@/app/dreamdmbar/_components/dreamr/api/feedHandler';

export const GET = dreamrFeedHandler;
