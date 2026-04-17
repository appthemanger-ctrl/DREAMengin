// lib/activity/visibility-score.ts
// Phase 9 — Feed Ranking Algorithm (Visibility Score)
//
// Implements visibility score calculation for feed ranking.
// Formula: (AQS × tier_multiplier) + verification_strength + innovation_bonus
//
// Per ACTIVITY_FIRST_PROTOCOL.md §III (Algorithm & Visibility)

import { createClient } from '@/lib/supabase/client';
import { getAQS } from './aqs';
import type { ActivityTier } from './types';

/**
 * Calculate visibility score for a post
 *
 * Formula: (AQS × tier_multiplier) + verification_strength + innovation_bonus
 *
 * The visibility score determines feed ranking. Higher score = higher placement.
 *
 * The algorithm does NOT consider:
 * - Time spent in app
 * - Scroll depth
 * - Likes, comments, shares
 * - Follower count
 * - Ad interactions
 *
 * @param postId - Post ID
 * @returns Visibility score (integer)
 */
export async function calculateVisibilityScore(postId: string): Promise<number> {
  const supabase = createClient();

  try {
    // Call database function that implements the visibility score calculation
    const { data, error } = await supabase.rpc('calculate_visibility_score', {
      p_post_id: postId,
    });

    if (error) {
      console.error('[VisibilityScore] Error calculating score:', error);
      return 0;
    }

    return data ?? 0;
  } catch (err) {
    console.error('[VisibilityScore] Exception calculating score:', err);
    return 0;
  }
}

/**
 * Calculate visibility score for multiple posts (batch)
 *
 * More efficient than calling calculateVisibilityScore() multiple times.
 *
 * @param postIds - Array of post IDs
 * @returns Map of postId -> visibility score
 */
export async function calculateVisibilityScores(
  postIds: string[],
): Promise<Map<string, number>> {
  const supabase = createClient();
  const scores = new Map<string, number>();

  if (postIds.length === 0) return scores;

  try {
    // Batch calculate using database function
    const promises = postIds.map(async (postId) => {
      const { data } = await supabase.rpc('calculate_visibility_score', {
        p_post_id: postId,
      });
      return { postId, score: data ?? 0 };
    });

    const results = await Promise.all(promises);
    results.forEach(({ postId, score }) => scores.set(postId, score));

    return scores;
  } catch (err) {
    console.error('[VisibilityScore] Exception calculating batch scores:', err);
    return scores;
  }
}

/**
 * Sort posts by visibility score (descending)
 *
 * @param posts - Array of posts with id field
 * @returns Sorted array of posts (highest visibility first)
 */
export async function sortByVisibilityScore<T extends { id: string }>(
  posts: T[],
): Promise<T[]> {
  if (posts.length === 0) return posts;

  const postIds = posts.map((p) => p.id);
  const scores = await calculateVisibilityScores(postIds);

  return [...posts].sort((a, b) => {
    const scoreA = scores.get(a.id) ?? 0;
    const scoreB = scores.get(b.id) ?? 0;
    return scoreB - scoreA; // Descending
  });
}

/**
 * Get feed posts ranked by visibility score
 *
 * Replaces engagement-based ranking with activity-based ranking.
 *
 * @param userId - User ID (for fetching followed posts)
 * @param options - Query options
 * @returns Ranked feed posts
 */
export async function getVisibilityRankedFeed(
  userId: string,
  options: {
    limit?: number;
    before?: string; // ISO date cursor
    provider?: string; // Optional provider filter
  } = {},
): Promise<any[]> {
  const supabase = createClient();
  const { limit = 30, before, provider } = options;

  try {
    // Get followed user IDs
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followedIds = (follows ?? []).map((f: any) => f.following_id);
    const authorIds = [userId, ...followedIds];

    // Get posts from followed users + own posts
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
      .limit(limit * 2); // Fetch more, then rank and trim

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: posts } = await query;

    if (!posts || posts.length === 0) return [];

    // Calculate visibility scores for all posts
    const rankedPosts = await sortByVisibilityScore(posts);

    // Return top N after ranking
    return rankedPosts.slice(0, limit);
  } catch (err) {
    console.error('[VisibilityScore] Exception fetching ranked feed:', err);
    return [];
  }
}

/**
 * Check if post should be promoted algorithmically
 *
 * Tier 0 (Passive) content is not promoted. Only followers see it.
 *
 * @param postId - Post ID
 * @returns true if post should be promoted
 */
export async function shouldPromotePost(postId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    // Check if post has activity points (non-Tier 0)
    const { data } = await supabase
      .from('activity_points')
      .select('tier')
      .eq('post_id', postId)
      .gt('tier', 0) // Tier > 0
      .single();

    return !!data;
  } catch (err) {
    // If no activity points, treat as Tier 0 (not promoted)
    return false;
  }
}

/**
 * Get tier multiplier from activity points
 *
 * @param tier - Activity tier (0-6)
 * @returns Multiplier value
 */
function getTierMultiplier(tier: ActivityTier): number {
  const multipliers: Record<number, number> = {
    0: 1,   // Passive
    1: 2,   // Reflection
    2: 4,   // Skill Development
    3: 8,   // On-Platform Creation
    4: 8,   // Real-World Action
    5: 16,  // On-Platform Innovation
    6: 16,  // Never Done Before
  };
  return multipliers[tier] ?? 1;
}

/**
 * Estimate visibility score without database call
 * Useful for UI previews
 *
 * @param params - Score parameters
 * @returns Estimated visibility score
 */
export function estimateVisibilityScore(params: {
  aqs: number;
  tier: ActivityTier;
  verificationStrength: number;
  isInnovation?: boolean;
}): number {
  const { aqs, tier, verificationStrength, isInnovation = false } = params;

  const tierMultiplier = getTierMultiplier(tier);
  const innovationBonus = isInnovation ? 1000 : 0;

  return aqs * tierMultiplier + verificationStrength + innovationBonus;
}
