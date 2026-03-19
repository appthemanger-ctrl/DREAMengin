-- 20260321000000_ads_platform_promotions.sql
-- Phase 6 item 11: Separate user-owned DreamAds from platform promotions.
--
-- Phase 6 spec point 27 (dreamengin_phase6.md):
--   "DreamAds must separate user-owned ad spaces from platform promotions in
--    both code and UI language; no component may use the label 'DreamAds' to
--    refer to platform promotional inventory."
--
-- ARCHITECTURE.md §7 (DreamAds separation):
--   "DreamAds = user-controlled ad space attached to their surfaces"
--   "Platform promotions = platform-run promotional inventory"
--   "These must remain separate in docs and code language."
--
-- This migration adds:
--   1. is_platform_promotion BOOLEAN on ad_listings
--      - false (default) = user-owned DreamAds listing
--      - true            = platform promotional inventory
--   2. A partial index for fast platform promotion queries
--   3. A partial index for fast user-owned listing queries

ALTER TABLE public.ad_listings
  ADD COLUMN IF NOT EXISTS is_platform_promotion BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.ad_listings.is_platform_promotion IS
  'When TRUE this listing represents platform promotional inventory, not a
   user-owned DreamAds slot. Per ARCHITECTURE.md §7: user DreamAds and
   platform promotions must remain separate in code and UI language.';

-- Index for fast platform promotion queries (DreamAds surface "Promoted" tab)
CREATE INDEX IF NOT EXISTS ad_listings_platform_idx
  ON public.ad_listings (is_platform_promotion)
  WHERE is_platform_promotion = TRUE;

-- Index for fast user-listing queries (DreamAds surface "Available Slots" tab)
CREATE INDEX IF NOT EXISTS ad_listings_user_idx
  ON public.ad_listings (is_platform_promotion)
  WHERE is_platform_promotion = FALSE;
