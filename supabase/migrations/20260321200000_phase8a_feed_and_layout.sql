-- 20260321200000_phase8a_feed_and_layout.sql
-- Phase 8 Section A — HomeDream Surface: Real Feed & Real Customization
--
-- Changes:
--   1. Add feed_preferences JSONB column to profiles — persists feed algorithm
--      and source-selection settings per user (Point 3).
--   2. Add home_layout JSONB column to profiles — persists Dream Window layout
--      configuration per user (Point 4).
--
-- Privacy (AXIOM 5):
--   Both columns live inside the profiles row, which is protected by existing
--   RLS. feed_preferences and home_layout are never exposed to other users.
--
-- Architecture: docs/ARCHITECTURE.md §3 — all persistent user settings live
-- in Supabase; no client-only state for anything that must survive sessions.

-- ── feed_preferences ──────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feed_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.feed_preferences IS
  'User feed algorithm and source-selection settings persisted per user.
   Shape: {
     showDreamenginUpdates?: boolean,
     autoRefresh?: boolean,
     showEmptyStateGuides?: boolean,
     enabledProviders?: string[],
     sortOrder?: "recent" | "trending"
   }
   Default is empty object — falls back to application defaults.
   Saves and restores automatically on session load (Phase 8 §A Point 3).';

-- ── home_layout ───────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_layout JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.home_layout IS
  'Dream Window layout configuration for the HomeDream Surface per user.
   Shape: {
     slots: Array<{
       id: string,
       type: string,
       title?: string,
       position: number,
       config?: Record<string, unknown>
     }>
   }
   Persisted on every confirmed layout change. Restores on session load.
   Phase 8 §A Point 4.';
