// lib/activity/revenueSplit.ts
// Activity-First Protocol revenue split helpers.

export const ACTIVITY_REVENUE_SPLIT = {
  platform: 0.3,
  creator: 0.5,
  rewardPool: 0.2,
} as const;

export interface ActivityRevenueSplit {
  grossRevenue: number;
  platformShare: number;
  creatorShare: number;
  rewardPoolShare: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateActivityRevenueSplit(
  grossRevenue: number,
): ActivityRevenueSplit {
  const safeGross = Number.isFinite(grossRevenue) && grossRevenue > 0
    ? roundCurrency(grossRevenue)
    : 0;

  const platformShare = roundCurrency(safeGross * ACTIVITY_REVENUE_SPLIT.platform);
  const creatorShare = roundCurrency(safeGross * ACTIVITY_REVENUE_SPLIT.creator);
  const rewardPoolShare = roundCurrency(
    safeGross - platformShare - creatorShare,
  );

  return {
    grossRevenue: safeGross,
    platformShare,
    creatorShare,
    rewardPoolShare,
  };
}

export function validateActivityRevenueSplit(split: ActivityRevenueSplit): boolean {
  const total = roundCurrency(
    split.platformShare + split.creatorShare + split.rewardPoolShare,
  );
  return total === roundCurrency(split.grossRevenue);
}
