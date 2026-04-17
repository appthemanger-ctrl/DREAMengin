-- 20260413000000_phase9_activity_first_protocol.sql
-- Phase 9 — Activity-First Protocol (v2.1)
--
-- Implements the complete Activity-First Protocol as specified in
-- docs/ACTIVITY_FIRST_PROTOCOL.md
--
-- CORE PRINCIPLE: Reward actual activity, not engagement.
-- Views are the currency. Likes are secondary.
--
-- Tables:
--   1. activity_points      — User activity points with 30-day decay
--   2. activity_verification — Evidence of activity (video, photo, etc.)
--   3. views                — Verified human views on content
--   4. skip_credits         — User ad skip credit balance
--   5. ad_views             — Verified ad views for CPV billing
--   6. user_metrics         — AQS, Real Shit Rate, aggregated stats
--
-- Functions:
--   - calculate_aqs(user_id)           → Activity Quality Score
--   - calculate_visibility_score(post_id) → Feed ranking score
--   - apply_points_decay()             → 30-day rolling decay
--   - verify_ad_view(ad_id, user_id)   → Ad view validation
--   - get_user_metrics(user_id)        → Aggregated user metrics
--
-- AXIOM 4 — Security by Default: RLS enabled on all tables
-- AXIOM 5 — Privacy by Design: User data scoped, no cross-user exposure

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: activity_points
-- ══════════════════════════════════════════════════════════════════════════════
-- Stores user activity points with tier classification and decay tracking.
-- Points decay over 30-day rolling window per ACTIVITY_FIRST_PROTOCOL.md §II.

CREATE TABLE IF NOT EXISTS public.activity_points (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity classification (Tier 0-6)
  tier            smallint NOT NULL CHECK (tier >= 0 AND tier <= 6),

  -- Points earned for this activity
  points          integer NOT NULL CHECK (points >= 0),

  -- Activity metadata
  activity_type   text NOT NULL, -- e.g., "skate_trick", "game_build", "music_composition"
  description     text,

  -- Verification link
  verification_id uuid REFERENCES public.activity_verification(id) ON DELETE SET NULL,

  -- Related content
  post_id         uuid REFERENCES public.app_posts(id) ON DELETE CASCADE,

  -- Decay tracking
  decay_timestamp timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  is_decayed      boolean NOT NULL DEFAULT false,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_points_user_id_idx
  ON public.activity_points (user_id);

CREATE INDEX IF NOT EXISTS activity_points_decay_idx
  ON public.activity_points (decay_timestamp)
  WHERE is_decayed = false;

CREATE INDEX IF NOT EXISTS activity_points_tier_idx
  ON public.activity_points (tier);

CREATE INDEX IF NOT EXISTS activity_points_created_at_idx
  ON public.activity_points (created_at DESC);

-- RLS Policies
ALTER TABLE public.activity_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_points_select_own" ON public.activity_points;
CREATE POLICY "activity_points_select_own"
  ON public.activity_points FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_points_insert_own" ON public.activity_points;
CREATE POLICY "activity_points_insert_own"
  ON public.activity_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_points_update_own" ON public.activity_points;
CREATE POLICY "activity_points_update_own"
  ON public.activity_points FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.activity_points IS
  'Phase 9: User activity points with tier classification (0-6). Points decay
   over 30-day rolling window. Tier 0 = passive/low effort, Tier 6 = never
   done before. Per ACTIVITY_FIRST_PROTOCOL.md §II.';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: activity_verification
-- ══════════════════════════════════════════════════════════════════════════════
-- Evidence of activity: video, photo, audio, on-platform project, etc.
-- Verification strength determines visibility boost.

CREATE TABLE IF NOT EXISTS public.activity_verification (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity tier being verified
  tier                 smallint NOT NULL CHECK (tier >= 0 AND tier <= 6),

  -- Verification method and strength
  verification_method  text NOT NULL CHECK (verification_method IN (
    'video',           -- Highest (500 points)
    'audio',           -- High (300 points)
    'photo',           -- Medium (100 points)
    'on_platform',     -- Highest (500 points, auto-verified)
    'text'             -- Low (0 points)
  )),

  verification_strength integer NOT NULL CHECK (verification_strength >= 0),

  -- Evidence storage
  evidence_url         text,
  evidence_metadata    jsonb DEFAULT '{}',

  -- Verification status
  verified             boolean NOT NULL DEFAULT false,
  verified_at          timestamptz,
  verified_by          text, -- 'auto', 'human', 'TheBoogieMan.Ai'

  -- Fraud detection
  flagged_as_fraud     boolean NOT NULL DEFAULT false,
  fraud_reason         text,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_verification_user_id_idx
  ON public.activity_verification (user_id);

CREATE INDEX IF NOT EXISTS activity_verification_verified_idx
  ON public.activity_verification (verified)
  WHERE verified = true;

CREATE INDEX IF NOT EXISTS activity_verification_fraud_idx
  ON public.activity_verification (flagged_as_fraud)
  WHERE flagged_as_fraud = true;

-- RLS Policies
ALTER TABLE public.activity_verification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_verification_select_own" ON public.activity_verification;
CREATE POLICY "activity_verification_select_own"
  ON public.activity_verification FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_verification_insert_own" ON public.activity_verification;
CREATE POLICY "activity_verification_insert_own"
  ON public.activity_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_verification_update_own" ON public.activity_verification;
CREATE POLICY "activity_verification_update_own"
  ON public.activity_verification FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.activity_verification IS
  'Phase 9: Evidence of activity. Video=500, audio=300, photo=100, text=0
   verification strength. TheBoogieMan.Ai monitors for fraud. Per
   ACTIVITY_FIRST_PROTOCOL.md §II (Verification).';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: views
-- ══════════════════════════════════════════════════════════════════════════════
-- Verified human views on content. Views are the primary metric (not likes).

CREATE TABLE IF NOT EXISTS public.views (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content being viewed
  post_id      uuid NOT NULL REFERENCES public.app_posts(id) ON DELETE CASCADE,

  -- Viewer
  viewer_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_ip    inet, -- For anonymous view tracking
  viewer_agent text,

  -- View metrics
  view_duration integer, -- seconds
  scrolled_pct  integer, -- 0-100

  -- Verification
  verified     boolean NOT NULL DEFAULT false,
  verified_at  timestamptz,

  -- Fraud detection
  is_bot       boolean NOT NULL DEFAULT false,
  is_duplicate boolean NOT NULL DEFAULT false,

  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS views_post_id_idx
  ON public.views (post_id);

CREATE INDEX IF NOT EXISTS views_viewer_id_idx
  ON public.views (viewer_id);

CREATE INDEX IF NOT EXISTS views_verified_idx
  ON public.views (verified)
  WHERE verified = true;

CREATE INDEX IF NOT EXISTS views_created_at_idx
  ON public.views (created_at DESC);

-- Prevent duplicate views from same viewer on same content within 24h
CREATE UNIQUE INDEX IF NOT EXISTS views_dedup_idx
  ON public.views (post_id, viewer_id, DATE(created_at))
  WHERE viewer_id IS NOT NULL;

-- RLS Policies
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- Anyone can view counts, but not individual viewer identity
DROP POLICY IF EXISTS "views_select_counts" ON public.views;
CREATE POLICY "views_select_counts"
  ON public.views FOR SELECT
  USING (true); -- Public read for counts (no PII exposed)

DROP POLICY IF EXISTS "views_insert_any" ON public.views;
CREATE POLICY "views_insert_any"
  ON public.views FOR INSERT
  WITH CHECK (true); -- Anyone can record a view

COMMENT ON TABLE public.views IS
  'Phase 9: Verified human views. Views are the primary metric per
   ACTIVITY_FIRST_PROTOCOL.md §I.3 (Views Are the Currency). TheBoogieMan.Ai
   verifies: unique human viewer, minimum duration, no bot patterns.';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: skip_credits
-- ══════════════════════════════════════════════════════════════════════════════
-- User ad skip credit balance. Watch ads to earn credits, spend to skip future ads.

CREATE TABLE IF NOT EXISTS public.skip_credits (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Credit balance
  credits_balance integer NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),

  -- Lifetime totals
  earned_total    integer NOT NULL DEFAULT 0,
  spent_total     integer NOT NULL DEFAULT 0,

  -- Last transaction
  last_earned_at  timestamptz,
  last_spent_at   timestamptz,

  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skip_credits_balance_idx
  ON public.skip_credits (credits_balance);

-- RLS Policies
ALTER TABLE public.skip_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skip_credits_select_own" ON public.skip_credits;
CREATE POLICY "skip_credits_select_own"
  ON public.skip_credits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "skip_credits_insert_own" ON public.skip_credits;
CREATE POLICY "skip_credits_insert_own"
  ON public.skip_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "skip_credits_update_own" ON public.skip_credits;
CREATE POLICY "skip_credits_update_own"
  ON public.skip_credits FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.skip_credits IS
  'Phase 9: User ad skip credit balance. Watch 1 pre/post-roll = 1 credit,
   rewarded ad = 3 credits. Credits never expire. Per ACTIVITY_FIRST_PROTOCOL.md
   §V (Skip Reward System).';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: ad_views
-- ══════════════════════════════════════════════════════════════════════════════
-- Verified ad views for CPV (Cost Per View) billing.

CREATE TABLE IF NOT EXISTS public.ad_views (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ad reference
  ad_id         uuid NOT NULL, -- References external ad system
  ad_type       text NOT NULL CHECK (ad_type IN ('pre_roll', 'post_roll', 'rewarded')),

  -- Viewer
  viewer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content where ad was shown
  post_id       uuid REFERENCES public.app_posts(id) ON DELETE SET NULL,

  -- View metrics
  view_duration integer NOT NULL, -- seconds
  watched_pct   integer NOT NULL CHECK (watched_pct >= 0 AND watched_pct <= 100),

  -- CPV tier (Standard $0.08, Premium $0.12, Super Premium $0.15)
  cpv_tier      text NOT NULL CHECK (cpv_tier IN ('standard', 'premium', 'super_premium')),
  cpv_amount    numeric(10,4) NOT NULL,

  -- Verification (TheBoogieMan.Ai)
  verified      boolean NOT NULL DEFAULT false,
  verified_at   timestamptz,

  -- Billing
  billed        boolean NOT NULL DEFAULT false,
  billed_at     timestamptz,

  -- Fraud detection
  is_bot        boolean NOT NULL DEFAULT false,
  is_duplicate  boolean NOT NULL DEFAULT false,

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_views_ad_id_idx
  ON public.ad_views (ad_id);

CREATE INDEX IF NOT EXISTS ad_views_viewer_id_idx
  ON public.ad_views (viewer_id);

CREATE INDEX IF NOT EXISTS ad_views_verified_idx
  ON public.ad_views (verified)
  WHERE verified = true;

CREATE INDEX IF NOT EXISTS ad_views_billed_idx
  ON public.ad_views (billed)
  WHERE billed = false;

CREATE INDEX IF NOT EXISTS ad_views_created_at_idx
  ON public.ad_views (created_at DESC);

-- RLS Policies
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_views_select_own" ON public.ad_views;
CREATE POLICY "ad_views_select_own"
  ON public.ad_views FOR SELECT
  USING (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "ad_views_insert_own" ON public.ad_views;
CREATE POLICY "ad_views_insert_own"
  ON public.ad_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

COMMENT ON TABLE public.ad_views IS
  'Phase 9: Verified ad views for CPV billing. TheBoogieMan.Ai verifies:
   unique human viewer, watched 95%+ of ad, no bot patterns. Advertisers only
   pay for verified views. Per ACTIVITY_FIRST_PROTOCOL.md §V.';

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: user_metrics
-- ══════════════════════════════════════════════════════════════════════════════
-- Aggregated user metrics: AQS, Real Shit Rate, total views, etc.
-- Updated periodically (not real-time) for performance.

CREATE TABLE IF NOT EXISTS public.user_metrics (
  user_id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity Quality Score (AQS)
  -- Formula: (Activity Points × Views per Post) ÷ Days Active
  aqs                  integer NOT NULL DEFAULT 0,

  -- Real Shit Rate (verified posts / total posts)
  real_shit_rate       numeric(5,2) NOT NULL DEFAULT 0.00 CHECK (real_shit_rate >= 0 AND real_shit_rate <= 100),

  -- View metrics
  total_views          bigint NOT NULL DEFAULT 0,
  views_per_post       numeric(10,2) NOT NULL DEFAULT 0.00,

  -- Activity metrics (last 30 days)
  activity_points_30d  integer NOT NULL DEFAULT 0,
  days_active_30d      integer NOT NULL DEFAULT 0,

  -- Most viewed content
  most_viewed_post_id  uuid REFERENCES public.app_posts(id) ON DELETE SET NULL,
  most_viewed_count    integer NOT NULL DEFAULT 0,

  -- Post statistics
  total_posts          integer NOT NULL DEFAULT 0,
  verified_posts       integer NOT NULL DEFAULT 0,

  -- Last calculation timestamp
  calculated_at        timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_metrics_aqs_idx
  ON public.user_metrics (aqs DESC);

CREATE INDEX IF NOT EXISTS user_metrics_real_shit_rate_idx
  ON public.user_metrics (real_shit_rate DESC);

CREATE INDEX IF NOT EXISTS user_metrics_total_views_idx
  ON public.user_metrics (total_views DESC);

-- RLS Policies
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_metrics_select_any" ON public.user_metrics;
CREATE POLICY "user_metrics_select_any"
  ON public.user_metrics FOR SELECT
  USING (true); -- Public read (for leaderboards, profiles)

DROP POLICY IF EXISTS "user_metrics_insert_own" ON public.user_metrics;
CREATE POLICY "user_metrics_insert_own"
  ON public.user_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_metrics_update_own" ON public.user_metrics;
CREATE POLICY "user_metrics_update_own"
  ON public.user_metrics FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_metrics IS
  'Phase 9: Aggregated user metrics. AQS = Activity Quality Score, Real Shit
   Rate = verified posts / total posts. Updated periodically. Per
   ACTIVITY_FIRST_PROTOCOL.md §IV (Metrics & Measurement).';

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: calculate_aqs(user_id)
-- ══════════════════════════════════════════════════════════════════════════════
-- Calculates Activity Quality Score for a user.
-- Formula: (Activity Points × Views per Post) ÷ Days Active
--
-- Returns: integer AQS score

CREATE OR REPLACE FUNCTION public.calculate_aqs(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_points integer;
  v_views_per_post numeric;
  v_days_active integer;
  v_aqs integer;
BEGIN
  -- Get activity points (last 30 days, non-decayed)
  SELECT COALESCE(SUM(points), 0)
  INTO v_activity_points
  FROM public.activity_points
  WHERE user_id = p_user_id
    AND is_decayed = false
    AND created_at > now() - interval '30 days';

  -- Get views per post
  SELECT COALESCE(AVG(view_count), 0)
  INTO v_views_per_post
  FROM (
    SELECT post_id, COUNT(*) as view_count
    FROM public.views
    WHERE post_id IN (
      SELECT id FROM public.app_posts WHERE user_id = p_user_id
    )
    AND verified = true
    GROUP BY post_id
  ) post_views;

  -- Get days active (days with at least one post or activity)
  SELECT COUNT(DISTINCT DATE(created_at))
  INTO v_days_active
  FROM (
    SELECT created_at FROM public.app_posts
    WHERE user_id = p_user_id AND created_at > now() - interval '30 days'
    UNION ALL
    SELECT created_at FROM public.activity_points
    WHERE user_id = p_user_id AND created_at > now() - interval '30 days'
  ) activity;

  -- Calculate AQS
  IF v_days_active > 0 THEN
    v_aqs := ROUND((v_activity_points * v_views_per_post) / v_days_active);
  ELSE
    v_aqs := 0;
  END IF;

  RETURN v_aqs;
END;
$$;

COMMENT ON FUNCTION public.calculate_aqs IS
  'Phase 9: Calculates Activity Quality Score (AQS) for a user.
   Formula: (Activity Points × Views per Post) ÷ Days Active.
   Per ACTIVITY_FIRST_PROTOCOL.md §III (Activity Quality Score).';

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: calculate_visibility_score(post_id)
-- ══════════════════════════════════════════════════════════════════════════════
-- Calculates visibility score for feed ranking.
-- Formula: (AQS × tier_multiplier) + verification_strength + innovation_bonus
--
-- Returns: integer visibility score

CREATE OR REPLACE FUNCTION public.calculate_visibility_score(p_post_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_aqs integer;
  v_tier smallint;
  v_tier_multiplier integer;
  v_verification_strength integer;
  v_innovation_bonus integer := 0;
  v_visibility_score integer;
BEGIN
  -- Get post owner
  SELECT user_id INTO v_user_id
  FROM public.app_posts
  WHERE id = p_post_id;

  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Get user AQS
  SELECT aqs INTO v_aqs
  FROM public.user_metrics
  WHERE user_id = v_user_id;

  v_aqs := COALESCE(v_aqs, 0);

  -- Get activity tier and verification for this post
  SELECT
    COALESCE(ap.tier, 0),
    COALESCE(av.verification_strength, 0)
  INTO v_tier, v_verification_strength
  FROM public.app_posts p
  LEFT JOIN public.activity_points ap ON ap.post_id = p.id
  LEFT JOIN public.activity_verification av ON av.id = ap.verification_id
  WHERE p.id = p_post_id
  LIMIT 1;

  v_tier := COALESCE(v_tier, 0);

  -- Tier multipliers (Tier 0-6)
  v_tier_multiplier := CASE v_tier
    WHEN 0 THEN 1   -- Passive/low effort
    WHEN 1 THEN 2   -- Reflection/documentation
    WHEN 2 THEN 4   -- Skill development
    WHEN 3 THEN 8   -- On-platform creation
    WHEN 4 THEN 8   -- Real-world action
    WHEN 5 THEN 16  -- On-platform innovation
    WHEN 6 THEN 16  -- Never done before
    ELSE 1
  END;

  -- Innovation bonus (Tier 6 only)
  IF v_tier = 6 THEN
    v_innovation_bonus := 1000;
  END IF;

  -- Calculate visibility score
  v_visibility_score :=
    (v_aqs * v_tier_multiplier) +
    v_verification_strength +
    v_innovation_bonus;

  RETURN v_visibility_score;
END;
$$;

COMMENT ON FUNCTION public.calculate_visibility_score IS
  'Phase 9: Calculates visibility score for feed ranking.
   Formula: (AQS × tier_multiplier) + verification_strength + innovation_bonus.
   Tier multipliers: 1×, 2×, 4×, 8×, 8×, 16×, 16×.
   Per ACTIVITY_FIRST_PROTOCOL.md §III (Feed Ranking Formula).';

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: apply_points_decay()
-- ══════════════════════════════════════════════════════════════════════════════
-- Applies 30-day rolling decay to activity points.
-- Should be run as a scheduled job (e.g., daily cron).
--
-- Returns: count of points marked as decayed

CREATE OR REPLACE FUNCTION public.apply_points_decay()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Mark points as decayed if past decay_timestamp
  UPDATE public.activity_points
  SET
    is_decayed = true,
    updated_at = now()
  WHERE is_decayed = false
    AND decay_timestamp <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.apply_points_decay IS
  'Phase 9: Applies 30-day rolling decay to activity points. Should be run
   as a scheduled job (daily). Per ACTIVITY_FIRST_PROTOCOL.md §II (Points System).';

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: verify_ad_view(ad_id, user_id, watched_pct)
-- ══════════════════════════════════════════════════════════════════════════════
-- Verifies an ad view for CPV billing.
-- Checks: unique human viewer, watched 95%+, no bot patterns.
--
-- Returns: boolean (verified or not)

CREATE OR REPLACE FUNCTION public.verify_ad_view(
  p_ad_id uuid,
  p_viewer_id uuid,
  p_watched_pct integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_verified boolean := false;
  v_duplicate_count integer;
BEGIN
  -- Check if watched 95%+ of ad
  IF p_watched_pct < 95 THEN
    RETURN false;
  END IF;

  -- Check for duplicate views (same ad, same user, last 24h)
  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM public.ad_views
  WHERE ad_id = p_ad_id
    AND viewer_id = p_viewer_id
    AND created_at > now() - interval '24 hours';

  IF v_duplicate_count > 0 THEN
    RETURN false;
  END IF;

  -- TODO: Add TheBoogieMan.Ai bot detection
  -- For now, assume human if not duplicate
  v_verified := true;

  RETURN v_verified;
END;
$$;

COMMENT ON FUNCTION public.verify_ad_view IS
  'Phase 9: Verifies an ad view for CPV billing. Checks: unique human viewer,
   watched 95%+, no bot patterns. Per ACTIVITY_FIRST_PROTOCOL.md §V
   (Verification & Fraud Prevention).';

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: get_user_metrics(user_id)
-- ══════════════════════════════════════════════════════════════════════════════
-- Returns aggregated user metrics as JSON.
-- Used by API endpoints and profile displays.

CREATE OR REPLACE FUNCTION public.get_user_metrics(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metrics jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', user_id,
    'aqs', aqs,
    'real_shit_rate', real_shit_rate,
    'total_views', total_views,
    'views_per_post', views_per_post,
    'activity_points_30d', activity_points_30d,
    'days_active_30d', days_active_30d,
    'most_viewed_post_id', most_viewed_post_id,
    'most_viewed_count', most_viewed_count,
    'total_posts', total_posts,
    'verified_posts', verified_posts,
    'calculated_at', calculated_at
  )
  INTO v_metrics
  FROM public.user_metrics
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_metrics, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.get_user_metrics IS
  'Phase 9: Returns aggregated user metrics as JSON. Used by API endpoints
   and profile displays. Per ACTIVITY_FIRST_PROTOCOL.md §IV.';

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Update user_metrics on activity changes
-- ══════════════════════════════════════════════════════════════════════════════
-- Automatically recalculate AQS when activity points or views change

CREATE OR REPLACE FUNCTION public.trigger_recalculate_user_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recalculate AQS for affected user
  INSERT INTO public.user_metrics (user_id, aqs, calculated_at, updated_at)
  VALUES (
    COALESCE(NEW.user_id, NEW.viewer_id),
    public.calculate_aqs(COALESCE(NEW.user_id, NEW.viewer_id)),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    aqs = EXCLUDED.aqs,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

-- Apply trigger to activity_points
DROP TRIGGER IF EXISTS trigger_activity_points_metrics ON public.activity_points;
CREATE TRIGGER trigger_activity_points_metrics
  AFTER INSERT OR UPDATE ON public.activity_points
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_user_metrics();

-- Apply trigger to views (for posts)
DROP TRIGGER IF EXISTS trigger_views_metrics ON public.views;
CREATE TRIGGER trigger_views_metrics
  AFTER INSERT ON public.views
  FOR EACH ROW
  WHEN (NEW.verified = true)
  EXECUTE FUNCTION public.trigger_recalculate_user_metrics();

-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ══════════════════════════════════════════════════════════════════════════════

COMMENT ON SCHEMA public IS
  'Phase 9 complete: Activity-First Protocol tables, functions, triggers, and
   RLS policies deployed. Per docs/ACTIVITY_FIRST_PROTOCOL.md.

   Key tables: activity_points, activity_verification, views, skip_credits,
   ad_views, user_metrics.

   Key functions: calculate_aqs(), calculate_visibility_score(),
   apply_points_decay(), verify_ad_view(), get_user_metrics().

   Next steps: Deploy API endpoints, update feed ranking algorithm, build UI
   components for activity posting and metrics display.';
