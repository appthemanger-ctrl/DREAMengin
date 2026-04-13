// lib/activity/types.ts
// Phase 9 — Activity-First Protocol Types
//
// TypeScript types for the Activity-First Protocol system.
// Matches database schema in supabase/migrations/20260413000000_phase9_activity_first_protocol.sql

/**
 * Activity Tier Classification (0-6)
 * Per ACTIVITY_FIRST_PROTOCOL.md §II
 */
export enum ActivityTier {
  /** Tier 0: Passive / Low Effort (posting a photo with no context) */
  PASSIVE = 0,

  /** Tier 1: Reflection / Documentation (sharing about your day) */
  REFLECTION = 1,

  /** Tier 2: Skill Development (documenting practice over time) */
  SKILL_DEVELOPMENT = 2,

  /** Tier 3: On-Platform Creation (building a game, composing music) */
  ON_PLATFORM_CREATION = 3,

  /** Tier 4: Real-World Action (skating a spot, performing live) */
  REAL_WORLD_ACTION = 4,

  /** Tier 5: On-Platform Innovation (discovering new physics) */
  ON_PLATFORM_INNOVATION = 5,

  /** Tier 6: Never Done Before (a trick never landed, original invention) */
  NEVER_DONE_BEFORE = 6,
}

/**
 * Verification Method
 * Per ACTIVITY_FIRST_PROTOCOL.md §II (Verification)
 */
export enum VerificationMethod {
  /** Video evidence (highest weight: 500) */
  VIDEO = 'video',

  /** Audio recording (high weight: 300) */
  AUDIO = 'audio',

  /** Photo with timestamp/location (medium weight: 100) */
  PHOTO = 'photo',

  /** On-platform project (highest weight: 500, auto-verified) */
  ON_PLATFORM = 'on_platform',

  /** Text-only (low weight: 0) */
  TEXT = 'text',
}

/**
 * CPV (Cost Per View) Tier
 * Per ACTIVITY_FIRST_PROTOCOL.md §V
 */
export enum CPVTier {
  /** Standard: $0.08 (any verified view) */
  STANDARD = 'standard',

  /** Premium: $0.12 (view from user with AQS > 500) */
  PREMIUM = 'premium',

  /** Super Premium: $0.15 (view from user who watched full 30s and engaged) */
  SUPER_PREMIUM = 'super_premium',
}

/**
 * Ad Type
 * Per ACTIVITY_FIRST_PROTOCOL.md §V
 */
export enum AdType {
  /** Pre-Roll: 15-30s before content (1 credit) */
  PRE_ROLL = 'pre_roll',

  /** Post-Roll: 15-30s after content (1 credit) */
  POST_ROLL = 'post_roll',

  /** Rewarded: 30s user-initiated (3 credits) */
  REWARDED = 'rewarded',
}

// ══════════════════════════════════════════════════════════════════════════════
// Database Row Types
// ══════════════════════════════════════════════════════════════════════════════

export interface ActivityPoint {
  id: string;
  user_id: string;
  tier: ActivityTier;
  points: number;
  activity_type: string;
  description?: string;
  verification_id?: string;
  post_id?: string;
  decay_timestamp: string; // ISO date
  is_decayed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityVerification {
  id: string;
  user_id: string;
  tier: ActivityTier;
  verification_method: VerificationMethod;
  verification_strength: number;
  evidence_url?: string;
  evidence_metadata?: Record<string, unknown>;
  verified: boolean;
  verified_at?: string;
  verified_by?: string; // 'auto', 'human', 'TheBoogieMan.Ai'
  flagged_as_fraud: boolean;
  fraud_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface View {
  id: string;
  post_id: string;
  viewer_id?: string;
  viewer_ip?: string;
  viewer_agent?: string;
  view_duration?: number; // seconds
  scrolled_pct?: number; // 0-100
  verified: boolean;
  verified_at?: string;
  is_bot: boolean;
  is_duplicate: boolean;
  created_at: string;
}

export interface SkipCredit {
  user_id: string;
  credits_balance: number;
  earned_total: number;
  spent_total: number;
  last_earned_at?: string;
  last_spent_at?: string;
  updated_at: string;
}

export interface AdView {
  id: string;
  ad_id: string;
  ad_type: AdType;
  viewer_id: string;
  post_id?: string;
  view_duration: number; // seconds
  watched_pct: number; // 0-100
  cpv_tier: CPVTier;
  cpv_amount: number;
  verified: boolean;
  verified_at?: string;
  billed: boolean;
  billed_at?: string;
  is_bot: boolean;
  is_duplicate: boolean;
  created_at: string;
}

export interface UserMetrics {
  user_id: string;
  aqs: number; // Activity Quality Score
  real_shit_rate: number; // 0-100
  total_views: number;
  views_per_post: number;
  activity_points_30d: number;
  days_active_30d: number;
  most_viewed_post_id?: string;
  most_viewed_count: number;
  total_posts: number;
  verified_posts: number;
  calculated_at: string;
  updated_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// API Request/Response Types
// ══════════════════════════════════════════════════════════════════════════════

export interface TrackActivityRequest {
  tier: ActivityTier;
  activity_type: string;
  description?: string;
  post_id?: string;
  verification_method?: VerificationMethod;
  evidence_url?: string;
  evidence_metadata?: Record<string, unknown>;
}

export interface TrackActivityResponse {
  activity_point: ActivityPoint;
  verification?: ActivityVerification;
  points_earned: number;
}

export interface TrackViewRequest {
  post_id: string;
  view_duration?: number;
  scrolled_pct?: number;
}

export interface TrackViewResponse {
  view: View;
  verified: boolean;
}

export interface TrackAdViewRequest {
  ad_id: string;
  ad_type: AdType;
  view_duration: number;
  watched_pct: number;
  post_id?: string;
}

export interface TrackAdViewResponse {
  ad_view: AdView;
  verified: boolean;
  credits_earned: number;
}

export interface EarnSkipCreditsRequest {
  ad_view_id: string;
}

export interface EarnSkipCreditsResponse {
  skip_credit: SkipCredit;
  credits_earned: number;
  new_balance: number;
}

export interface UseSkipCreditsRequest {
  ad_id: string;
}

export interface UseSkipCreditsResponse {
  skip_credit: SkipCredit;
  credits_spent: number;
  new_balance: number;
}

export interface GetUserMetricsResponse {
  metrics: UserMetrics;
}

export interface GetPlatformMetricsResponse {
  real_shit_rate: number; // target: > 90%
  creation_to_consumption_ratio: number; // target: > 0.5
  outside_activity_rate: number; // target: > 50%
  ad_view_rate: number; // target: > 40%
  harmful_content_rate: number; // target: < 0.05%
  average_aqs: number; // target: > 500
  total_active_users: number;
  total_verified_views: number;
  calculated_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Helper Types
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Tier multipliers for visibility score calculation
 * Per ACTIVITY_FIRST_PROTOCOL.md §III
 */
export const TIER_MULTIPLIERS: Record<ActivityTier, number> = {
  [ActivityTier.PASSIVE]: 1,
  [ActivityTier.REFLECTION]: 2,
  [ActivityTier.SKILL_DEVELOPMENT]: 4,
  [ActivityTier.ON_PLATFORM_CREATION]: 8,
  [ActivityTier.REAL_WORLD_ACTION]: 8,
  [ActivityTier.ON_PLATFORM_INNOVATION]: 16,
  [ActivityTier.NEVER_DONE_BEFORE]: 16,
};

/**
 * Verification strength points
 * Per ACTIVITY_FIRST_PROTOCOL.md §II
 */
export const VERIFICATION_STRENGTH: Record<VerificationMethod, number> = {
  [VerificationMethod.VIDEO]: 500,
  [VerificationMethod.AUDIO]: 300,
  [VerificationMethod.PHOTO]: 100,
  [VerificationMethod.ON_PLATFORM]: 500,
  [VerificationMethod.TEXT]: 0,
};

/**
 * CPV pricing
 * Per ACTIVITY_FIRST_PROTOCOL.md §V
 */
export const CPV_PRICING: Record<CPVTier, number> = {
  [CPVTier.STANDARD]: 0.08,
  [CPVTier.PREMIUM]: 0.12,
  [CPVTier.SUPER_PREMIUM]: 0.15,
};

/**
 * Skip credit rewards
 * Per ACTIVITY_FIRST_PROTOCOL.md §V
 */
export const SKIP_CREDIT_REWARDS: Record<AdType, number> = {
  [AdType.PRE_ROLL]: 1,
  [AdType.POST_ROLL]: 1,
  [AdType.REWARDED]: 3,
};

/**
 * Innovation bonus (Tier 6 only)
 * Per ACTIVITY_FIRST_PROTOCOL.md §III
 */
export const INNOVATION_BONUS = 1000;

/**
 * Platform health targets
 * Per ACTIVITY_FIRST_PROTOCOL.md §IX
 */
export const PLATFORM_HEALTH_TARGETS = {
  real_shit_rate: 90, // > 90%
  creation_to_consumption_ratio: 0.5, // > 0.5
  outside_activity_rate: 50, // > 50%
  ad_view_rate: 40, // > 40%
  harmful_content_rate: 0.05, // < 0.05%
  average_aqs: 500, // > 500
};
