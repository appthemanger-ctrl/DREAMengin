// lib/feed/ranking.ts
// Phase 9 — Feed Ranking (Visibility Score)
//
// Replaces engagement-based ranking (likes/comments/shares) with
// Activity-First visibility score ranking.
//
// Per ACTIVITY_FIRST_PROTOCOL.md §III (Algorithm & Visibility)
//
// What drives ranking:
//   - AQS of the post author (higher AQS = higher base score)
//   - Activity tier of the post (tier multiplier 1–16×)
//   - Verification strength (video = 500 pts, on-platform = 500 pts, …)
//   - Innovation bonus (+1000 for Tier 6 "Never Done Before")
//   - Verified view count on the post
//
// What DOES NOT drive ranking:
//   - Likes
//   - Comments
//   - Shares
//   - Follower count
//   - Ad interactions
//   - Time spent scrolling

export { getVisibilityRankedFeed, sortByVisibilityScore } from '@/lib/activity/visibility-score';

import { createClient } from '@/lib/supabase/client';
import { getAQS } from '@/lib/activity/aqs';
import { ActivityTier, TIER_MULTIPLIERS, INNOVATION_BONUS } from '@/lib/activity/types';

// ─── Post Ranking Score ────────────────────────────────────────────────────

export interface PostRankingInput {
  postId: string;
  authorId: string;
  tier?: ActivityTier;
  verificationStrength?: number;
  verifiedViewCount?: number;
  isInnovation?: boolean;
}

export interface PostRankingResult {
  postId: string;
  visibilityScore: number;
  breakdown: {
    aqsScore: number;
    tierMultiplier: number;
    verificationStrength: number;
    viewBonus: number;
    innovationBonus: number;
  };
}

/**
 * Calculate a detailed ranking score for a single post, including a full breakdown.
 *
 * Formula:
 *   visibilityScore = (AQS × tier_multiplier) + verification_strength + view_bonus + innovation_bonus
 *
 * view_bonus = log2(verified_view_count + 1) × 50  (logarithmic to prevent pure popularity from dominating)
 *
 * @param input  Post ranking parameters
 * @returns      Detailed ranking result with breakdown
 */
export async function rankPost(
  input: PostRankingInput,
): Promise<PostRankingResult> {
  const {
    postId,
    authorId,
    tier = ActivityTier.PASSIVE,
    verificationStrength = 0,
    verifiedViewCount = 0,
    isInnovation = false,
  } = input;

  const aqs = await getAQS(authorId);
  const tierMultiplier = TIER_MULTIPLIERS[tier] ?? 1;
  const innovationBonus = isInnovation ? INNOVATION_BONUS : 0;

  // Logarithmic view bonus: diminishing returns past first views
  const viewBonus = Math.floor(Math.log2(verifiedViewCount + 1) * 50);

  const visibilityScore =
    aqs * tierMultiplier + verificationStrength + viewBonus + innovationBonus;

  return {
    postId,
    visibilityScore,
    breakdown: {
      aqsScore: aqs * tierMultiplier,
      tierMultiplier,
      verificationStrength,
      viewBonus,
      innovationBonus,
    },
  };
}

// ─── Feed Fetch & Rank ─────────────────────────────────────────────────────

export interface RankedFeedOptions {
  /** Maximum number of posts to return after ranking */
  limit?: number;
  /** ISO cursor for pagination (posts before this timestamp) */
  before?: string;
  /** Include posts from this specific author only */
  authorId?: string;
}

export interface FeedPost {
  id: string;
  content: unknown;
  visibility: string;
  media_url?: string | null;
  media_urls?: string[] | null;
  media_json?: unknown;
  created_at: string;
  likes_count: number;
  comments_count: number;
  view_count?: number;
  profiles: {
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  _visibilityScore?: number;
}

/**
 * Fetch and rank feed posts by visibility score.
 *
 * This is the canonical feed ranking function for DREAMengin.
 * It fetches 2× the requested limit, ranks by visibility score,
 * and returns the top N.
 *
 * @param userId   Authenticated user ID
 * @param options  Fetch/filter options
 */
export async function getRankedFeed(
  userId: string,
  options: RankedFeedOptions = {},
): Promise<FeedPost[]> {
  const supabase = createClient();
  const { limit = 30, before, authorId } = options;

  try {
    // Get followed user IDs
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followedIds = (follows ?? []).map((f: { following_id: string }) => f.following_id);
    const authorIds = authorId
      ? [authorId]
      : [userId, ...followedIds];

    let query = supabase
      .from('app_posts')
      .select(
        'id, content, visibility, media_url, media_urls, media_json, created_at, ' +
        'likes_count, comments_count, ' +
        'profiles!inner(handle, display_name, avatar_url)',
      )
      .in('user_id', authorIds)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit * 3); // Fetch extra to allow ranking to trim

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: posts } = await query;
    if (!posts || posts.length === 0) return [];

    // Get visibility scores for ranking
    // Attempt to call the DB function in parallel
    const scoredPosts = await Promise.all(
      (posts as FeedPost[]).map(async (post) => {
        try {
          const { data } = await supabase.rpc('calculate_visibility_score', {
            p_post_id: post.id,
          });
          return { ...post, _visibilityScore: (data as number) ?? 0 };
        } catch {
          return { ...post, _visibilityScore: 0 };
        }
      }),
    );

    // Sort by visibility score descending
    scoredPosts.sort((a, b) => (b._visibilityScore ?? 0) - (a._visibilityScore ?? 0));

    return scoredPosts.slice(0, limit);
  } catch (err) {
    console.error('[ranking] getRankedFeed error:', err);
    return [];
  }
}

// ─── Promoted / Discovery Feed ────────────────────────────────────────────

/**
 * Get discovery feed posts (posts from users you don't follow).
 *
 * Ranked by visibility score. Only Tier 1+ content is eligible.
 * Passive (Tier 0) posts are not promoted beyond followers.
 *
 * @param userId   Authenticated user ID
 * @param limit    Maximum posts to return
 */
export async function getDiscoveryFeed(
  userId: string,
  limit = 20,
): Promise<FeedPost[]> {
  const supabase = createClient();

  try {
    // Exclude posts the user has already seen in their main feed
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followedIds = (follows ?? []).map((f: { following_id: string }) => f.following_id);
    const excludeIds = [userId, ...followedIds];

    const { data: posts } = await supabase
      .from('app_posts')
      .select(
        'id, content, visibility, media_url, media_urls, media_json, created_at, ' +
        'likes_count, comments_count, ' +
        'profiles!inner(handle, display_name, avatar_url)',
      )
      .eq('visibility', 'public')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(limit * 3);

    if (!posts || posts.length === 0) return [];

    // Score and sort
    const scoredPosts = await Promise.all(
      (posts as FeedPost[]).map(async (post) => {
        try {
          const { data } = await supabase.rpc('calculate_visibility_score', {
            p_post_id: post.id,
          });
          return { ...post, _visibilityScore: (data as number) ?? 0 };
        } catch {
          return { ...post, _visibilityScore: 0 };
        }
      }),
    );

    // Filter out Tier 0 (passive) and sort
    scoredPosts
      .filter((p) => (p._visibilityScore ?? 0) > 0)
      .sort((a, b) => (b._visibilityScore ?? 0) - (a._visibilityScore ?? 0));

    return scoredPosts.slice(0, limit);
  } catch (err) {
    console.error('[ranking] getDiscoveryFeed error:', err);
    return [];
  }
}
