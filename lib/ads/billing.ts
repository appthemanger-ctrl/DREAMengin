// lib/ads/billing.ts
// Phase 9 — Ad Revenue Billing & Split Logic
//
// Implements CPV (Cost Per View) billing and revenue distribution.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Ad Economy)
//
// CPV Rates:
//   Standard     $0.08  — any verified view
//   Premium      $0.12  — view from user with AQS > 500
//   Super        $0.15  — full 30s view + interaction engagement
//
// Revenue Split:
//   30%  → Platform (DREAMengin operating costs + infra)
//   50%  → Creator  (content author whose post hosted the ad)
//   20%  → Activity Reward Pool (monthly distribution to active users)
//
// No Mid-Roll ads. Only Pre-Roll, Post-Roll, Rewarded.

import { createClient } from '@/lib/supabase/client';
import { CPVTier, CPV_PRICING, AdType } from '@/lib/activity/types';

// ─── Revenue Split Constants ───────────────────────────────────────────────

/** Platform takes 30% of every CPV payment */
export const PLATFORM_REVENUE_SHARE = 0.30;

/** Creator (post author) receives 50% of every CPV payment */
export const CREATOR_REVENUE_SHARE = 0.50;

/** Activity Reward Pool receives 20% of every CPV payment */
export const REWARD_POOL_SHARE = 0.20;

// ─── Revenue Breakdown Type ────────────────────────────────────────────────

export interface RevenueSplit {
  /** Total CPV amount in USD */
  total: number;
  /** Platform share (30%) in USD */
  platform: number;
  /** Creator share (50%) in USD */
  creator: number;
  /** Reward pool share (20%) in USD */
  rewardPool: number;
  /** CPV tier used */
  cpvTier: CPVTier;
  /** CPV rate per view in USD */
  cpvRate: number;
}

// ─── CPV Tier Determination ────────────────────────────────────────────────

/**
 * Determine CPV tier for an ad view based on viewer quality and watch time.
 *
 * Tier hierarchy:
 *  SUPER_PREMIUM ($0.15) — Watched full 30s AND viewer AQS > 500
 *  PREMIUM       ($0.12) — Viewer AQS > 500
 *  STANDARD      ($0.08) — Any verified view
 *
 * @param viewerAqs       Viewer's Activity Quality Score
 * @param watchedPct      0–100 percentage of ad watched
 * @param adType          AdType (Rewarded always earns Super Premium if completed)
 */
export function determineCPVTier(
  viewerAqs: number,
  watchedPct: number,
  adType: AdType,
): CPVTier {
  const watchedFull = watchedPct >= 95;

  if (watchedFull && viewerAqs >= 500) return CPVTier.SUPER_PREMIUM;
  if (adType === AdType.REWARDED && watchedFull) return CPVTier.SUPER_PREMIUM;
  if (viewerAqs >= 500) return CPVTier.PREMIUM;
  return CPVTier.STANDARD;
}

// ─── Revenue Split Calculator ──────────────────────────────────────────────

/**
 * Calculate the revenue split for a single verified ad view.
 *
 * @param cpvTier    CPV tier (Standard / Premium / Super Premium)
 * @returns RevenueSplit breakdown
 */
export function calculateRevenueSplit(cpvTier: CPVTier): RevenueSplit {
  const cpvRate = CPV_PRICING[cpvTier];
  const total = cpvRate;

  return {
    total,
    platform:   +(total * PLATFORM_REVENUE_SHARE).toFixed(6),
    creator:    +(total * CREATOR_REVENUE_SHARE).toFixed(6),
    rewardPool: +(total * REWARD_POOL_SHARE).toFixed(6),
    cpvTier,
    cpvRate,
  };
}

/**
 * Calculate total revenue from a batch of ad views.
 *
 * @param views Array of { cpvTier, verified } ad view records
 * @returns Aggregated RevenueSplit (sum of all verified views)
 */
export function calculateBatchRevenue(
  views: Array<{ cpvTier: CPVTier; verified: boolean }>,
): RevenueSplit {
  const verifiedViews = views.filter((v) => v.verified);

  const aggregated: RevenueSplit = {
    total: 0,
    platform: 0,
    creator: 0,
    rewardPool: 0,
    cpvTier: CPVTier.STANDARD,
    cpvRate: CPV_PRICING[CPVTier.STANDARD],
  };

  for (const view of verifiedViews) {
    const split = calculateRevenueSplit(view.cpvTier);
    aggregated.total += split.total;
    aggregated.platform += split.platform;
    aggregated.creator += split.creator;
    aggregated.rewardPool += split.rewardPool;
  }

  // Round to 6 decimal places to avoid floating point drift
  aggregated.total     = +aggregated.total.toFixed(6);
  aggregated.platform  = +aggregated.platform.toFixed(6);
  aggregated.creator   = +aggregated.creator.toFixed(6);
  aggregated.rewardPool = +aggregated.rewardPool.toFixed(6);

  return aggregated;
}

// ─── Reward Pool Distribution ──────────────────────────────────────────────

export interface RewardPoolDistribution {
  /** Total pool amount to distribute */
  poolTotal: number;
  /** Distributed to individual users (array of { userId, amount }) */
  distributions: Array<{ userId: string; amount: number }>;
  /** Calculated at timestamp */
  calculatedAt: string;
}

/**
 * Calculate monthly reward pool distribution.
 *
 * Distributes the accumulated reward pool proportionally to users based on
 * their Activity Quality Score (AQS) for the billing period.
 *
 * @param poolTotal  Total USD amount in the reward pool
 * @param userScores Map of userId → AQS for active users this period
 */
export function calculateRewardPoolDistribution(
  poolTotal: number,
  userScores: Map<string, number>,
): RewardPoolDistribution {
  const totalAqs = Array.from(userScores.values()).reduce((s, v) => s + v, 0);

  const distributions: Array<{ userId: string; amount: number }> = [];

  if (totalAqs === 0) {
    // Equal split if no activity data
    const perUser = userScores.size > 0 ? poolTotal / userScores.size : 0;
    for (const userId of userScores.keys()) {
      distributions.push({ userId, amount: +perUser.toFixed(6) });
    }
  } else {
    for (const [userId, aqs] of userScores.entries()) {
      const share = (aqs / totalAqs) * poolTotal;
      distributions.push({ userId, amount: +share.toFixed(6) });
    }
  }

  return {
    poolTotal,
    distributions,
    calculatedAt: new Date().toISOString(),
  };
}

// ─── Supabase Billing Helpers ──────────────────────────────────────────────

/**
 * Record a billed ad view in the database.
 * Marks the ad_view record as billed and stores the revenue split.
 *
 * @param adViewId    The ad_view row id
 * @param split       The calculated revenue split
 */
export async function recordBilledView(
  adViewId: string,
  split: RevenueSplit,
): Promise<void> {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    await supabase
      .from('ad_views')
      .update({
        billed: true,
        billed_at: now,
        cpv_amount: split.cpvRate,
        cpv_tier: split.cpvTier,
      })
      .eq('id', adViewId);
  } catch (err) {
    console.warn('[billing] recordBilledView error:', err);
  }
}

/**
 * Get total pending (unbilled) revenue for a creator.
 *
 * @param creatorId  The creator's user_id
 * @returns Total USD owed to creator (50% share of unbilled verified views)
 */
export async function getPendingCreatorRevenue(
  creatorId: string,
): Promise<number> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('ad_views')
      .select('cpv_tier')
      .eq('billed', false)
      .eq('verified', true);

    if (error || !data) return 0;

    const total = (data as Array<{ cpv_tier: string }>).reduce((sum, view) => {
      const tier = view.cpv_tier as CPVTier;
      const split = calculateRevenueSplit(tier);
      return sum + split.creator;
    }, 0);

    return +total.toFixed(6);
  } catch (err) {
    console.error('[billing] getPendingCreatorRevenue error:', err);
    return 0;
  }
}

// ─── Display Helpers ───────────────────────────────────────────────────────

/**
 * Format a USD amount for display.
 * e.g.  0.08 → "$0.08"  |  1.234567 → "$1.23"
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Get a human-readable CPV tier label.
 */
export function cpvTierLabel(tier: CPVTier): string {
  switch (tier) {
    case CPVTier.SUPER_PREMIUM: return 'Super Premium ($0.15/view)';
    case CPVTier.PREMIUM:       return 'Premium ($0.12/view)';
    case CPVTier.STANDARD:
    default:                    return 'Standard ($0.08/view)';
  }
}
