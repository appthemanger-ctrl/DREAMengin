// lib/activity/aqs.ts
// Phase 9 — Activity Quality Score Calculator
//
// Implements AQS calculation algorithm per ACTIVITY_FIRST_PROTOCOL.md §III
// Formula: (Activity Points × Views per Post) ÷ Days Active

import { createClient } from '@/lib/supabase/client';
import type { UserMetrics } from './types';

/**
 * Calculate Activity Quality Score (AQS) for a user
 *
 * Formula: (Activity Points × Views per Post) ÷ Days Active
 *
 * - High AQS = you do things, people watch, you're contributing
 * - Low AQS = you're just watching
 *
 * @param userId - User ID to calculate AQS for
 * @returns AQS score (integer)
 */
export async function calculateAQS(userId: string): Promise<number> {
  const supabase = createClient();

  try {
    // Call database function that implements the AQS calculation
    const { data, error } = await supabase.rpc('calculate_aqs', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[AQS] Error calculating AQS:', error);
      return 0;
    }

    return data ?? 0;
  } catch (err) {
    console.error('[AQS] Exception calculating AQS:', err);
    return 0;
  }
}

/**
 * Get cached user metrics including AQS
 *
 * More performant than calculateAQS() but may be slightly stale.
 * Metrics are updated by database triggers when activity changes.
 *
 * @param userId - User ID
 * @returns User metrics or null if not found
 */
export async function getUserMetrics(
  userId: string,
): Promise<UserMetrics | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[AQS] Error fetching user metrics:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[AQS] Exception fetching user metrics:', err);
    return null;
  }
}

/**
 * Get AQS from cached metrics (fast)
 *
 * @param userId - User ID
 * @returns AQS score or 0 if not found
 */
export async function getAQS(userId: string): Promise<number> {
  const metrics = await getUserMetrics(userId);
  return metrics?.aqs ?? 0;
}

/**
 * Check if user qualifies for premium CPV tier
 * Premium = AQS > 500
 *
 * @param userId - User ID
 * @returns true if user qualifies for premium CPV
 */
export async function qualifiesForPremiumCPV(userId: string): Promise<boolean> {
  const aqs = await getAQS(userId);
  return aqs > 500;
}

/**
 * Get AQS tier display
 *
 * @param aqs - AQS score
 * @returns Display string (e.g., "Elite", "Active", "New")
 */
export function getAQSTier(aqs: number): string {
  if (aqs >= 1000) return 'Elite';
  if (aqs >= 500) return 'Active';
  if (aqs >= 100) return 'Building';
  if (aqs > 0) return 'New';
  return 'Watching';
}

/**
 * Get AQS tier color for UI display
 *
 * @param aqs - AQS score
 * @returns Tailwind color class
 */
export function getAQSTierColor(aqs: number): string {
  if (aqs >= 1000) return 'text-purple-500';
  if (aqs >= 500) return 'text-blue-500';
  if (aqs >= 100) return 'text-green-500';
  if (aqs > 0) return 'text-gray-500';
  return 'text-gray-400';
}

/**
 * Format AQS for display
 *
 * @param aqs - AQS score
 * @returns Formatted string (e.g., "847")
 */
export function formatAQS(aqs: number): string {
  return aqs.toLocaleString();
}

/**
 * Calculate Real Shit Rate
 * Formula: (Verified Posts ÷ Total Posts) × 100
 *
 * @param verifiedPosts - Number of verified posts
 * @param totalPosts - Total number of posts
 * @returns Real Shit Rate (0-100)
 */
export function calculateRealShitRate(
  verifiedPosts: number,
  totalPosts: number,
): number {
  if (totalPosts === 0) return 0;
  return (verifiedPosts / totalPosts) * 100;
}

/**
 * Format Real Shit Rate for display
 *
 * @param rate - Real Shit Rate (0-100)
 * @returns Formatted string (e.g., "94%")
 */
export function formatRealShitRate(rate: number): string {
  return `${rate.toFixed(0)}%`;
}

/**
 * Get leaderboard (top users by AQS)
 *
 * @param limit - Number of users to return (default: 100)
 * @returns Array of user metrics
 */
export async function getAQSLeaderboard(
  limit: number = 100,
): Promise<UserMetrics[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('user_metrics')
      .select('*')
      .order('aqs', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AQS] Error fetching leaderboard:', error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error('[AQS] Exception fetching leaderboard:', err);
    return [];
  }
}
