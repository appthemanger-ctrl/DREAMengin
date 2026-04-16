// lib/ai/parentalControls.ts
// TheBoogieMan.Ai — Parental Controls & Minor Protection
//
// Implements parental controls per ACTIVITY_FIRST_PROTOCOL.md §VIII
// and BOOGIEMAN_POLICY.md §MINORS.
//
// Rules:
//   - Users under 18 (is_minor = true) are blocked from harmful content categories
//   - Content categories blocked for minors: SEXUAL, VIOLENCE, SELF-HARM, ILLEGAL
//   - age_verified flag tracks whether age was explicitly verified
//   - Unverified users default to MINOR-safe mode (conservative)
//   - Parents/guardians can enable additional restrictions
//
// Per COPPA: users under 13 are completely blocked from data collection.
// DREAMengin minimum age is 13.

import { createClient } from '@/lib/supabase/client';
import type { PolicyCategoryValue } from '@/lib/policy/boogiePolicy';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Content categories that minors are always blocked from */
export const MINOR_BLOCKED_CATEGORIES: PolicyCategoryValue[] = [
  'SEXUAL',
  'VIOLENCE',
  'SELF-HARM',
  'ILLEGAL',
  'MALWARE/ABUSE',
];

/** Minimum age to use DREAMengin (COPPA compliance) */
export const MINIMUM_AGE = 13;

/** Age at which a user is considered an adult */
export const ADULT_AGE = 18;

// ─── User Age Profile ─────────────────────────────────────────────────────

export interface UserAgeProfile {
  userId: string;
  isMinor: boolean;
  ageVerified: boolean;
  /** Birthdate if collected, or null */
  birthdate?: string | null;
}

/**
 * Fetch the age profile for a user from the database.
 * If not found or not verified, defaults to minor-safe mode.
 *
 * @param userId - User ID to look up
 */
export async function getUserAgeProfile(userId: string): Promise<UserAgeProfile> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, is_minor, age_verified, birthdate')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Default: treat as minor (conservative)
      return { userId, isMinor: true, ageVerified: false };
    }

    const profile = data as {
      id: string;
      is_minor: boolean | null;
      age_verified: boolean | null;
      birthdate: string | null;
    };

    // If age not verified, default to minor-safe
    if (!profile.age_verified) {
      return { userId, isMinor: true, ageVerified: false, birthdate: null };
    }

    return {
      userId,
      isMinor: profile.is_minor ?? true,
      ageVerified: profile.age_verified ?? false,
      birthdate: profile.birthdate,
    };
  } catch (err) {
    console.error('[parentalControls] getUserAgeProfile error:', err);
    // Default: treat as minor
    return { userId, isMinor: true, ageVerified: false };
  }
}

// ─── Content Gate ──────────────────────────────────────────────────────────

export interface ContentGateResult {
  /** Whether the content is allowed for this user */
  allowed: boolean;
  /** Reason content was blocked, if blocked */
  blockedReason?: string;
  /** The category that triggered the block */
  blockedCategory?: PolicyCategoryValue;
}

/**
 * Check whether content is allowed for a user based on their age profile.
 *
 * This is the gate TheBoogieMan calls before serving any feed content
 * to a user whose is_minor flag is true or age is unverified.
 *
 * @param userId           User who wants to see the content
 * @param contentCategory  Detected category of the content
 */
export async function checkContentGate(
  userId: string,
  contentCategory: PolicyCategoryValue,
): Promise<ContentGateResult> {
  const ageProfile = await getUserAgeProfile(userId);

  if (!ageProfile.isMinor) {
    return { allowed: true };
  }

  const blocked = MINOR_BLOCKED_CATEGORIES.includes(contentCategory);

  if (blocked) {
    return {
      allowed: false,
      blockedReason: 'This content is not available for users under 18.',
      blockedCategory: contentCategory,
    };
  }

  return { allowed: true };
}

/**
 * Synchronous content gate — for use in rendering contexts where you already
 * have the age profile loaded.
 *
 * @param ageProfile       Pre-fetched age profile
 * @param contentCategory  Detected category of the content
 */
export function checkContentGateSync(
  ageProfile: UserAgeProfile,
  contentCategory: PolicyCategoryValue,
): ContentGateResult {
  if (!ageProfile.isMinor) {
    return { allowed: true };
  }

  const blocked = MINOR_BLOCKED_CATEGORIES.includes(contentCategory);

  if (blocked) {
    return {
      allowed: false,
      blockedReason: 'This content is not available for users under 18.',
      blockedCategory: contentCategory,
    };
  }

  return { allowed: true };
}

// ─── Age Verification ────────────────────────────────────────────────────

/**
 * Determine if a user is a minor based on their birthdate.
 *
 * @param birthdate  ISO date string (YYYY-MM-DD)
 * @returns true if the user is under 18
 */
export function isMinorFromBirthdate(birthdate: string): boolean {
  const birth = new Date(birthdate);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();

  const fullAge =
    monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  return fullAge < ADULT_AGE;
}

/**
 * Determine if a user is below minimum age (COPPA gate).
 *
 * @param birthdate  ISO date string (YYYY-MM-DD)
 * @returns true if the user is under 13
 */
export function isBelowMinimumAge(birthdate: string): boolean {
  const birth = new Date(birthdate);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();

  const fullAge =
    monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  return fullAge < MINIMUM_AGE;
}

/**
 * Mark a user's age as verified and set their is_minor flag.
 * Called after age verification is completed.
 *
 * @param userId    User ID
 * @param birthdate Verified birthdate (ISO YYYY-MM-DD)
 */
export async function markAgeVerified(
  userId: string,
  birthdate: string,
): Promise<{ success: boolean; isMinor: boolean; belowMinimumAge: boolean }> {
  const supabase = createClient();

  const belowMin = isBelowMinimumAge(birthdate);
  const isMinor = belowMin || isMinorFromBirthdate(birthdate);

  // Block users under minimum age — COPPA compliance
  if (belowMin) {
    return { success: false, isMinor: true, belowMinimumAge: true };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        age_verified: true,
        is_minor: isMinor,
        birthdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[parentalControls] markAgeVerified error:', error);
      return { success: false, isMinor, belowMinimumAge: false };
    }

    return { success: true, isMinor, belowMinimumAge: false };
  } catch (err) {
    console.error('[parentalControls] markAgeVerified exception:', err);
    return { success: false, isMinor, belowMinimumAge: false };
  }
}

// ─── Feed Filter ──────────────────────────────────────────────────────────

/**
 * Filter a feed array to remove content blocked for a minor.
 *
 * Content items must have a `category` field or will be treated as safe.
 *
 * @param userId   User ID (used to fetch age profile)
 * @param feed     Array of content items
 */
export async function filterFeedForUser<T extends { category?: string | null }>(
  userId: string,
  feed: T[],
): Promise<T[]> {
  const ageProfile = await getUserAgeProfile(userId);

  if (!ageProfile.isMinor) return feed;

  return feed.filter((item) => {
    if (!item.category) return true; // No category = assume safe
    const result = checkContentGateSync(
      ageProfile,
      item.category as PolicyCategoryValue,
    );
    return result.allowed;
  });
}
