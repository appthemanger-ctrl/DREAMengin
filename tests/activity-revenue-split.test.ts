import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_REVENUE_SPLIT,
  calculateActivityRevenueSplit,
  validateActivityRevenueSplit,
} from '@/lib/activity/revenueSplit';

describe('Activity-First Protocol revenue split', () => {
  it('uses the 30 / 50 / 20 split from the protocol', () => {
    expect(ACTIVITY_REVENUE_SPLIT.platform).toBe(0.3);
    expect(ACTIVITY_REVENUE_SPLIT.creator).toBe(0.5);
    expect(ACTIVITY_REVENUE_SPLIT.rewardPool).toBe(0.2);
  });

  it('calculates platform, creator, and reward pool shares', () => {
    expect(calculateActivityRevenueSplit(100)).toEqual({
      grossRevenue: 100,
      platformShare: 30,
      creatorShare: 50,
      rewardPoolShare: 20,
    });
  });

  it('keeps rounded shares balanced against gross revenue', () => {
    const split = calculateActivityRevenueSplit(0.08);
    expect(validateActivityRevenueSplit(split)).toBe(true);
    expect(split.platformShare + split.creatorShare + split.rewardPoolShare).toBe(
      split.grossRevenue,
    );
  });

  it('never returns negative or non-finite revenue shares', () => {
    expect(calculateActivityRevenueSplit(-10)).toEqual({
      grossRevenue: 0,
      platformShare: 0,
      creatorShare: 0,
      rewardPoolShare: 0,
    });
    expect(calculateActivityRevenueSplit(Number.NaN)).toEqual({
      grossRevenue: 0,
      platformShare: 0,
      creatorShare: 0,
      rewardPoolShare: 0,
    });
  });
});
