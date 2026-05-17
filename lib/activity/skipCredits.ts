// lib/activity/skipCredits.ts
// Pure skip-credit helpers for the Activity-First ad system.

import { AdType, SKIP_CREDIT_REWARDS } from './types';

export const SKIP_CREDIT_SPEND_PER_AD = 1;
export const MIN_WATCHED_PERCENT_FOR_CREDIT = 95;

export function calculateSkipCreditsEarned(params: {
  adType: AdType;
  verified: boolean;
  watchedPct: number;
}): number {
  if (!params.verified) return 0;
  if (params.watchedPct < MIN_WATCHED_PERCENT_FOR_CREDIT) return 0;
  return SKIP_CREDIT_REWARDS[params.adType] ?? 0;
}

export function canSpendSkipCredit(balance: number: boolean {
  return Number.isFinite(balance) && balance >= SKIP_CREDIT_SPEND_PER_AD;
}

export function spendSkipCredit(balance: number: number {
  if (!canSpendSkipCredit(balance)) return Math.max(0, Math.floor(balance || 0));
  return Math.floor(balance) - SKIP_CREDIT_SPEND_PER_AD;
}

export function addSkipCredits(balance: number, creditsEarned: number: number {
  const safeBalance = Number.isFinite(balance) && balance > 0 ? Math.floor(balance) : 0;
  const safeEarned =
    Number.isFinite(creditsEarned) && creditsEarned > 0
      ? Math.floor(creditsEarned)
      : 0;
  return safeBalance + safeEarned;
}
