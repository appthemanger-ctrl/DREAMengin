// lib/ads/skipCredits.ts
// Phase 9 — Skip Credit System
//
// Skip credits are earned by watching ads and spent to skip future ads.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Skip Reward System)
//
// Earn rates (per AdType):
//   Pre-Roll  → 1 credit
//   Post-Roll → 1 credit
//   Rewarded  → 3 credits
//
// Skip credits auto-apply: the system checks balance before showing an ad
// and skips automatically if the user has credits (unless Rewarded ad).

import { createClient } from '@/lib/supabase/client';
import type { SkipCredit } from '@/lib/activity/types';
import { AdType, SKIP_CREDIT_REWARDS } from '@/lib/activity/types';

// ─── Balance ───────────────────────────────────────────────────────────────

/**
 * Fetch the current user's skip credit balance.
 * Returns null if not authenticated or no record exists yet.
 */
export async function getSkipCreditBalance(
  userId: string,
): Promise<SkipCredit | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('skip_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = row not found; that just means 0 balance
      if (error.code !== 'PGRST116') {
        console.error('[SkipCredits] getBalance error:', error);
      }
      return null;
    }
    return data as SkipCredit;
  } catch (err) {
    console.error('[SkipCredits] getBalance exception:', err);
    return null;
  }
}

/**
 * Returns the raw credit count for a user. 0 if none.
 */
export async function getBalance(userId: string): Promise<number> {
  const record = await getSkipCreditBalance(userId);
  return record?.credits_balance ?? 0;
}

// ─── Earn ──────────────────────────────────────────────────────────────────

/**
 * Award skip credits to a user after they watch an ad.
 *
 * @param userId    - The user who watched the ad
 * @param adType    - The type of ad watched
 * @param adViewId  - The verified ad_view record id (for idempotency)
 * @returns Updated SkipCredit record and the number of credits earned
 */
export async function earnSkipCredits(
  userId: string,
  adType: AdType,
  adViewId: string,
): Promise<{ skipCredit: SkipCredit; creditsEarned: number }> {
  const supabase = createClient();
  const creditsEarned = SKIP_CREDIT_REWARDS[adType] ?? 1;

  try {
    // Try DB RPC first
    const { data, error } = await supabase.rpc('earn_skip_credits', {
      p_user_id: userId,
      p_credits: creditsEarned,
      p_ad_view_id: adViewId,
    });

    if (error) {
      console.error('[SkipCredits] earn rpc error:', error);
      return clientSideEarn(supabase, userId, creditsEarned);
    }

    return { skipCredit: data as SkipCredit, creditsEarned };
  } catch (err) {
    console.error('[SkipCredits] earn exception:', err);
    return clientSideEarn(supabase, userId, creditsEarned);
  }
}

/** Fallback client-side upsert when DB RPC is not available */
async function clientSideEarn(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  creditsEarned: number,
): Promise<{ skipCredit: SkipCredit; creditsEarned: number }> {
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('skip_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const currentBalance = (existing as SkipCredit | null)?.credits_balance ?? 0;
  const currentEarned = (existing as SkipCredit | null)?.earned_total ?? 0;

  const { data, error } = await supabase
    .from('skip_credits')
    .upsert(
      {
        user_id: userId,
        credits_balance: currentBalance + creditsEarned,
        earned_total: currentEarned + creditsEarned,
        spent_total: (existing as SkipCredit | null)?.spent_total ?? 0,
        last_earned_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return { skipCredit: data as SkipCredit, creditsEarned };
}

// ─── Use / Spend ───────────────────────────────────────────────────────────

/**
 * Spend one skip credit to skip an ad.
 * Returns null if the user does not have enough credits.
 *
 * @param userId - The user attempting to skip
 * @param adId   - The ad being skipped (for audit log)
 */
export async function useSkipCredit(
  userId: string,
  adId: string,
): Promise<{ skipCredit: SkipCredit; creditsSpent: number } | null> {
  const supabase = createClient();

  try {
    // Optimistic check
    const current = await getSkipCreditBalance(userId);
    if (!current || current.credits_balance < 1) return null;

    const { data, error } = await supabase.rpc('use_skip_credit', {
      p_user_id: userId,
      p_ad_id: adId,
    });

    if (error) {
      console.error('[SkipCredits] use rpc error:', error);
      return clientSideUse(supabase, userId);
    }

    return { skipCredit: data as SkipCredit, creditsSpent: 1 };
  } catch (err) {
    console.error('[SkipCredits] use exception:', err);
    return clientSideUse(supabase, userId);
  }
}

/** Fallback client-side decrement when DB RPC is not available */
async function clientSideUse(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ skipCredit: SkipCredit; creditsSpent: number } | null> {
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('skip_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing || (existing as SkipCredit).credits_balance < 1) return null;

  const currentBalance = (existing as SkipCredit).credits_balance;
  const currentSpent = (existing as SkipCredit).spent_total ?? 0;

  const { data, error } = await supabase
    .from('skip_credits')
    .update({
      credits_balance: currentBalance - 1,
      spent_total: currentSpent + 1,
      last_spent_at: now,
      updated_at: now,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return { skipCredit: data as SkipCredit, creditsSpent: 1 };
}

// ─── Auto-Apply ────────────────────────────────────────────────────────────

/**
 * Check whether a given ad should be auto-skipped for this user.
 *
 * Rewarded ads are NEVER auto-skipped (the user explicitly opts in for 3 credits).
 * Pre-Roll and Post-Roll are auto-skipped if the user has credits.
 *
 * @param userId  - The user who would see the ad
 * @param adType  - The type of ad
 * @param adId    - The ad ID
 * @returns true if the ad was skipped (and a credit was spent)
 */
export async function autoApplySkipCredit(
  userId: string,
  adType: AdType,
  adId: string,
): Promise<boolean> {
  // Rewarded ads are always shown; user opted in to earn credits
  if (adType === AdType.REWARDED) return false;

  const balance = await getBalance(userId);
  if (balance < 1) return false;

  const result = await useSkipCredit(userId, adId);
  return result !== null;
}

// ─── Credits Display Helpers ───────────────────────────────────────────────

/**
 * Format skip credit balance for display.
 * e.g.  0 → "0 skips"  |  1 → "1 skip"  |  5 → "5 skips"
 */
export function formatSkipCredits(balance: number): string {
  return `${balance} ${balance === 1 ? 'skip' : 'skips'}`;
}

/**
 * Returns the credit reward for watching a specific ad type.
 */
export function creditsForAdType(adType: AdType): number {
  return SKIP_CREDIT_REWARDS[adType] ?? 1;
}
