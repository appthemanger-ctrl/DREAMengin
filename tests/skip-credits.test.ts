import { describe, expect, it } from 'vitest';

import {
  addSkipCredits,
  calculateSkipCreditsEarned,
  canSpendSkipCredit,
  spendSkipCredit,
} from '@/lib/activity/skipCredits';
import { AdType } from '@/lib/activity/types';

describe('Activity-First skip credits', () => {
  it('awards one credit for verified pre-roll and post-roll ads', () => {
    expect(
      calculateSkipCreditsEarned({
        adType: AdType.PRE_ROLL,
        verified: true,
        watchedPct: 95,
      }),
    ).toBe(1);
    expect(
      calculateSkipCreditsEarned({
        adType: AdType.POST_ROLL,
        verified: true,
        watchedPct: 100,
      }),
    ).toBe(1);
  });

  it('awards three credits for verified rewarded ads', () => {
    expect(
      calculateSkipCreditsEarned({
        adType: AdType.REWARDED,
        verified: true,
        watchedPct: 100,
      }),
    ).toBe(3);
  });

  it('does not award credits for unverified or insufficient watches', () => {
    expect(
      calculateSkipCreditsEarned({
        adType: AdType.REWARDED,
        verified: false,
        watchedPct: 100,
      }),
    ).toBe(0);
    expect(
      calculateSkipCreditsEarned({
        adType: AdType.REWARDED,
        verified: true,
        watchedPct: 94,
      }),
    ).toBe(0);
  });

  it('spends exactly one credit when balance allows it', () => {
    expect(canSpendSkipCredit(1)).toBe(true);
    expect(spendSkipCredit(3)).toBe(2);
  });

  it('never lets the balance go negative', () => {
    expect(canSpendSkipCredit(0)).toBe(false);
    expect(spendSkipCredit(0)).toBe(0);
    expect(spendSkipCredit(-5)).toBe(0);
  });

  it('adds only safe whole credits', () => {
    expect(addSkipCredits(1, 3)).toBe(4);
    expect(addSkipCredits(1.9, 2.9)).toBe(3);
    expect(addSkipCredits(Number.NaN, Number.NaN)).toBe(0);
  });
});
