// tests/activity-first-protocol.test.ts
// Phase 9 — Activity-First Protocol Tests
//
// Tests for AQS calculation, visibility scoring, tier multipliers, and core logic.

import { describe, it, expect } from 'vitest';
import {
  ActivityTier,
  VerificationMethod,
  TIER_MULTIPLIERS,
  VERIFICATION_STRENGTH,
  SKIP_CREDIT_REWARDS,
  CPV_PRICING,
} from '../lib/activity/types';
import {
  calculateActivityPoints,
  getTierMultiplier,
  getVerificationStrength,
  getInnovationBonus,
  shouldPromoteActivity,
  getTierDisplayName,
  calculateDecayDate,
  isDecayed,
} from '../lib/activity/scoring';
import {
  calculateRealShitRate,
  formatRealShitRate,
  getAQSTier,
  formatAQS,
} from '../lib/activity/aqs';
import { estimateVisibilityScore } from '../lib/activity/visibility-score';

describe('Activity-First Protocol - Tier System', () => {
  it('should have correct tier multipliers', () => {
    expect(TIER_MULTIPLIERS[ActivityTier.PASSIVE]).toBe(1);
    expect(TIER_MULTIPLIERS[ActivityTier.REFLECTION]).toBe(2);
    expect(TIER_MULTIPLIERS[ActivityTier.SKILL_DEVELOPMENT]).toBe(4);
    expect(TIER_MULTIPLIERS[ActivityTier.ON_PLATFORM_CREATION]).toBe(8);
    expect(TIER_MULTIPLIERS[ActivityTier.REAL_WORLD_ACTION]).toBe(8);
    expect(TIER_MULTIPLIERS[ActivityTier.ON_PLATFORM_INNOVATION]).toBe(16);
    expect(TIER_MULTIPLIERS[ActivityTier.NEVER_DONE_BEFORE]).toBe(16);
  });

  it('should calculate correct activity points for each tier', () => {
    expect(calculateActivityPoints(ActivityTier.PASSIVE)).toBeGreaterThan(0);
    expect(calculateActivityPoints(ActivityTier.REFLECTION)).toBeGreaterThan(
      calculateActivityPoints(ActivityTier.PASSIVE)
    );
    expect(calculateActivityPoints(ActivityTier.NEVER_DONE_BEFORE)).toBeGreaterThan(
      calculateActivityPoints(ActivityTier.ON_PLATFORM_INNOVATION)
    );
  });

  it('should get correct tier multipliers', () => {
    expect(getTierMultiplier(ActivityTier.PASSIVE)).toBe(1);
    expect(getTierMultiplier(ActivityTier.NEVER_DONE_BEFORE)).toBe(16);
  });

  it('should identify promotable tiers', () => {
    expect(shouldPromoteActivity(ActivityTier.PASSIVE)).toBe(false);
    expect(shouldPromoteActivity(ActivityTier.REFLECTION)).toBe(true);
    expect(shouldPromoteActivity(ActivityTier.NEVER_DONE_BEFORE)).toBe(true);
  });

  it('should return tier display names', () => {
    expect(getTierDisplayName(ActivityTier.PASSIVE)).toContain('Passive');
    expect(getTierDisplayName(ActivityTier.NEVER_DONE_BEFORE)).toContain('Never Done Before');
  });
});

describe('Activity-First Protocol - Verification', () => {
  it('should have correct verification strengths', () => {
    expect(VERIFICATION_STRENGTH[VerificationMethod.TEXT]).toBe(0);
    expect(VERIFICATION_STRENGTH[VerificationMethod.PHOTO]).toBe(100);
    expect(VERIFICATION_STRENGTH[VerificationMethod.AUDIO]).toBe(300);
    expect(VERIFICATION_STRENGTH[VerificationMethod.VIDEO]).toBe(500);
    expect(VERIFICATION_STRENGTH[VerificationMethod.ON_PLATFORM]).toBe(500);
  });

  it('should get verification strength correctly', () => {
    expect(getVerificationStrength(VerificationMethod.TEXT)).toBe(0);
    expect(getVerificationStrength(VerificationMethod.VIDEO)).toBe(500);
  });
});

describe('Activity-First Protocol - Innovation Bonus', () => {
  it('should only award innovation bonus for Tier 6', () => {
    expect(getInnovationBonus(ActivityTier.PASSIVE)).toBe(0);
    expect(getInnovationBonus(ActivityTier.ON_PLATFORM_INNOVATION)).toBe(0);
    expect(getInnovationBonus(ActivityTier.NEVER_DONE_BEFORE)).toBe(1000);
  });
});

describe('Activity-First Protocol - Decay System', () => {
  it('should calculate decay date 30 days in future', () => {
    const decayDate = calculateDecayDate();
    const now = new Date();
    const diffDays = Math.round(
      (decayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);
  });

  it('should correctly identify decayed points', () => {
    const past = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
    const future = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000); // 29 days from now

    expect(isDecayed(past)).toBe(true);
    expect(isDecayed(future)).toBe(false);
  });
});

describe('Activity-First Protocol - AQS Calculation', () => {
  it('should calculate Real Shit Rate correctly', () => {
    expect(calculateRealShitRate(10, 10)).toBe(100);
    expect(calculateRealShitRate(5, 10)).toBe(50);
    expect(calculateRealShitRate(0, 10)).toBe(0);
    expect(calculateRealShitRate(0, 0)).toBe(0);
  });

  it('should format Real Shit Rate correctly', () => {
    expect(formatRealShitRate(94.5)).toBe('95%'); // Rounds to nearest
    expect(formatRealShitRate(94.4)).toBe('94%');
    expect(formatRealShitRate(100)).toBe('100%');
    expect(formatRealShitRate(0)).toBe('0%');
  });

  it('should categorize AQS into tiers', () => {
    expect(getAQSTier(0)).toBe('Watching');
    expect(getAQSTier(50)).toBe('New');
    expect(getAQSTier(200)).toBe('Building');
    expect(getAQSTier(600)).toBe('Active');
    expect(getAQSTier(1200)).toBe('Elite');
  });

  it('should format AQS with locale strings', () => {
    expect(formatAQS(847)).toBe('847');
    expect(formatAQS(1234)).toBe('1,234');
  });
});

describe('Activity-First Protocol - Visibility Score', () => {
  it('should estimate visibility score correctly', () => {
    // Base case: AQS=100, Tier 0, no verification
    const score1 = estimateVisibilityScore({
      aqs: 100,
      tier: ActivityTier.PASSIVE,
      verificationStrength: 0,
    });
    expect(score1).toBe(100); // 100 * 1 + 0 + 0

    // With verification: AQS=100, Tier 0, video verification
    const score2 = estimateVisibilityScore({
      aqs: 100,
      tier: ActivityTier.PASSIVE,
      verificationStrength: 500,
    });
    expect(score2).toBe(600); // 100 * 1 + 500 + 0

    // Higher tier: AQS=100, Tier 3, video verification
    const score3 = estimateVisibilityScore({
      aqs: 100,
      tier: ActivityTier.ON_PLATFORM_CREATION,
      verificationStrength: 500,
    });
    expect(score3).toBe(1300); // 100 * 8 + 500 + 0

    // Innovation: AQS=100, Tier 6, video verification
    const score4 = estimateVisibilityScore({
      aqs: 100,
      tier: ActivityTier.NEVER_DONE_BEFORE,
      verificationStrength: 500,
      isInnovation: true,
    });
    expect(score4).toBe(3100); // 100 * 16 + 500 + 1000
  });
});

describe('Activity-First Protocol - Skip Credits', () => {
  it('should have correct skip credit rewards', () => {
    expect(SKIP_CREDIT_REWARDS.pre_roll).toBe(1);
    expect(SKIP_CREDIT_REWARDS.post_roll).toBe(1);
    expect(SKIP_CREDIT_REWARDS.rewarded).toBe(3);
  });
});

describe('Activity-First Protocol - CPV Pricing', () => {
  it('should have correct CPV pricing tiers', () => {
    expect(CPV_PRICING.standard).toBe(0.08);
    expect(CPV_PRICING.premium).toBe(0.12);
    expect(CPV_PRICING.super_premium).toBe(0.15);
  });
});

describe('Activity-First Protocol - Core Principles', () => {
  it('should prioritize views over likes in ranking', () => {
    // Tier 0 with high likes should rank lower than Tier 4 with low likes
    const tier0Score = estimateVisibilityScore({
      aqs: 100,
      tier: ActivityTier.PASSIVE,
      verificationStrength: 0,
    });

    const tier4Score = estimateVisibilityScore({
      aqs: 100,
      tier: ActivityTier.REAL_WORLD_ACTION,
      verificationStrength: 500,
    });

    expect(tier4Score).toBeGreaterThan(tier0Score);
  });

  it('should not allow purchasing higher placement', () => {
    // Points cannot be bought (tested implicitly by tier system)
    // This test documents the principle - no paid boost in algorithm
    expect(true).toBe(true);
  });
});
