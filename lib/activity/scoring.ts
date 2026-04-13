// lib/activity/scoring.ts
// Phase 9 — Activity Scoring System
//
// Implements tier-based activity point calculation, verification strength,
// and innovation bonus logic per ACTIVITY_FIRST_PROTOCOL.md §II

import {
  ActivityTier,
  VerificationMethod,
  TIER_MULTIPLIERS,
  VERIFICATION_STRENGTH,
  INNOVATION_BONUS,
} from './types';

/**
 * Base points awarded for each activity tier
 * Per ACTIVITY_FIRST_PROTOCOL.md §II
 */
const BASE_POINTS_BY_TIER: Record<ActivityTier, number> = {
  [ActivityTier.PASSIVE]: 10,
  [ActivityTier.REFLECTION]: 50,
  [ActivityTier.SKILL_DEVELOPMENT]: 100,
  [ActivityTier.ON_PLATFORM_CREATION]: 200,
  [ActivityTier.REAL_WORLD_ACTION]: 200,
  [ActivityTier.ON_PLATFORM_INNOVATION]: 500,
  [ActivityTier.NEVER_DONE_BEFORE]: 1000,
};

/**
 * Calculate activity points based on tier
 */
export function calculateActivityPoints(tier: ActivityTier): number {
  return BASE_POINTS_BY_TIER[tier] ?? 0;
}

/**
 * Get tier multiplier for visibility score calculation
 */
export function getTierMultiplier(tier: ActivityTier): number {
  return TIER_MULTIPLIERS[tier] ?? 1;
}

/**
 * Get verification strength points based on method
 */
export function getVerificationStrength(method: VerificationMethod): number {
  return VERIFICATION_STRENGTH[method] ?? 0;
}

/**
 * Calculate innovation bonus
 * Only awarded for Tier 6 (Never Done Before)
 */
export function getInnovationBonus(tier: ActivityTier): number {
  return tier === ActivityTier.NEVER_DONE_BEFORE ? INNOVATION_BONUS : 0;
}

/**
 * Calculate total visibility boost from activity
 * Used in feed ranking algorithm
 */
export function calculateVisibilityBoost(
  tier: ActivityTier,
  verificationMethod: VerificationMethod,
): number {
  const tierMultiplier = getTierMultiplier(tier);
  const verificationStrength = getVerificationStrength(verificationMethod);
  const innovationBonus = getInnovationBonus(tier);

  return tierMultiplier + verificationStrength + innovationBonus;
}

/**
 * Determine if activity qualifies for promotion
 * Tier 0 (Passive) content is not promoted algorithmically
 */
export function shouldPromoteActivity(tier: ActivityTier): boolean {
  return tier > ActivityTier.PASSIVE;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: ActivityTier): string {
  const names: Record<ActivityTier, string> = {
    [ActivityTier.PASSIVE]: 'Passive',
    [ActivityTier.REFLECTION]: 'Reflection',
    [ActivityTier.SKILL_DEVELOPMENT]: 'Skill Development',
    [ActivityTier.ON_PLATFORM_CREATION]: 'On-Platform Creation',
    [ActivityTier.REAL_WORLD_ACTION]: 'Real-World Action',
    [ActivityTier.ON_PLATFORM_INNOVATION]: 'On-Platform Innovation',
    [ActivityTier.NEVER_DONE_BEFORE]: 'Never Done Before',
  };
  return names[tier] ?? 'Unknown';
}

/**
 * Get tier description
 */
export function getTierDescription(tier: ActivityTier): string {
  const descriptions: Record<ActivityTier, string> = {
    [ActivityTier.PASSIVE]:
      'Posting a photo with no context, reposting, screenshot',
    [ActivityTier.REFLECTION]:
      'Sharing about your day, describing a project, teaching something',
    [ActivityTier.SKILL_DEVELOPMENT]:
      'Documenting practice over time, learning a new trick, showing improvement',
    [ActivityTier.ON_PLATFORM_CREATION]:
      'Building a game, composing music, running experiments, designing art',
    [ActivityTier.REAL_WORLD_ACTION]:
      'Skating a spot, performing live, building something physical, exploring',
    [ActivityTier.ON_PLATFORM_INNOVATION]:
      'Discovering new physics, creating novel Engin combinations',
    [ActivityTier.NEVER_DONE_BEFORE]:
      'A trick never landed, an original invention, a scientific discovery',
  };
  return descriptions[tier] ?? '';
}

/**
 * Get verification method display name
 */
export function getVerificationMethodDisplayName(
  method: VerificationMethod,
): string {
  const names: Record<VerificationMethod, string> = {
    [VerificationMethod.VIDEO]: 'Video Evidence',
    [VerificationMethod.AUDIO]: 'Audio Recording',
    [VerificationMethod.PHOTO]: 'Photo Evidence',
    [VerificationMethod.ON_PLATFORM]: 'On-Platform Project',
    [VerificationMethod.TEXT]: 'Text Description',
  };
  return names[method] ?? 'Unknown';
}

/**
 * Validate tier selection based on activity type
 */
export function validateTierForActivityType(
  tier: ActivityTier,
  activityType: string,
): boolean {
  // On-platform creation must be Tier 3 or 5
  if (activityType.includes('game') || activityType.includes('music') || activityType.includes('lab')) {
    return tier === ActivityTier.ON_PLATFORM_CREATION || tier === ActivityTier.ON_PLATFORM_INNOVATION;
  }

  // Physical activities should be Tier 4 or 6
  if (activityType.includes('skate') || activityType.includes('perform') || activityType.includes('build')) {
    return tier === ActivityTier.REAL_WORLD_ACTION || tier === ActivityTier.NEVER_DONE_BEFORE;
  }

  // Allow any tier for generic activities
  return true;
}

/**
 * Calculate decay date (30 days from now)
 */
export function calculateDecayDate(): Date {
  const decayDate = new Date();
  decayDate.setDate(decayDate.getDate() + 30);
  return decayDate;
}

/**
 * Check if points are decayed
 */
export function isDecayed(decayTimestamp: string | Date): boolean {
  const now = new Date();
  const decay = new Date(decayTimestamp);
  return now >= decay;
}
