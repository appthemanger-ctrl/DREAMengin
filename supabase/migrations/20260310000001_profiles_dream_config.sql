-- 20260310000001_profiles_dream_config.sql
-- IDARi Pass 4: Add profile_dreams JSONB column to profiles table.
--
-- This column stores the user's Dream configuration for their public profile.
-- Stored as a Widget[] JSON array (matches ProfileWidgetGrid Widget type).
-- Each element includes: id, type, size, config, visibilityTier, instanceId.
--
-- AXIOM 5 — Privacy by Design:
--   Default is an empty array — no Dreams are public until the owner
--   explicitly promotes them in EditProfileDream (LAW.md §2 / AXIOM 5).
--
-- The public ViewProfile page reads this column server-side and passes it
-- to ProfileWidgetGrid as initialWidgets. The component already filters
-- to only render Dreams with visibilityTier==='everyone'.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe to re-run.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_dreams JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.profile_dreams IS
  'Dream configuration for the public profile (ViewProfile surface).
   Stored as Widget[] JSON (ProfileWidgetGrid Widget type).
   Each item: { id, type, size?, config?, visibilityTier?, instanceId? }.
   visibilityTier values: ''everyone'' | ''followers-only'' | ''hidden''.
   Only Dreams with visibilityTier=''everyone'' are rendered on the public page.
   Defaults to empty array — nothing public by default (LAW.md §2 / AXIOM 5).';
