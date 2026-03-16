-- 20260316000000_visibility_mappings.sql
-- IDARi Phase 6: Create visibility_mappings table.
--
-- Phase 6 spec point 13:
--   "The visibility_mappings table must be consulted before any content is
--    rendered on ViewProfile or /profile/[handle]."
--
-- Phase 6 spec point 17:
--   "A successful explicit share action must update the visibility_mappings
--    record and only then trigger a ViewProfile projection refresh."
--
-- AXIOM 4 — Security by Default / AXIOM 5 — Privacy by Design:
--   Default is 'private' — nothing public unless the user explicitly sets it.
--   (LAW.md §2: nothing is public by default.)
--
-- This table is the authoritative source of truth for what content a user
-- has explicitly chosen to share on their public ViewProfile surface.
-- It decouples "editing in EditProfileDream" from "what is visible to the world."

CREATE TABLE IF NOT EXISTS public.visibility_mappings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Content identifier — e.g. a Dream Window id or 'profile_info'
  content_id    TEXT NOT NULL,
  -- Content type — e.g. 'dream_window', 'profile_info', 'post'
  content_type  TEXT NOT NULL,
  -- Visibility tier: private (default), followers, public
  visibility    TEXT NOT NULL DEFAULT 'private'
                  CONSTRAINT visibility_mappings_visibility_check
                    CHECK (visibility IN ('private', 'followers', 'public')),
  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One record per user+content pair
  UNIQUE (user_id, content_id)
);

-- Index for fast per-user lookup (ViewProfile render path)
CREATE INDEX IF NOT EXISTS visibility_mappings_user_idx
  ON public.visibility_mappings (user_id, visibility);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_visibility_mappings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visibility_mappings_updated_at_trigger ON public.visibility_mappings;
CREATE TRIGGER visibility_mappings_updated_at_trigger
  BEFORE UPDATE ON public.visibility_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_visibility_mappings_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.visibility_mappings ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own visibility records.
CREATE POLICY "visibility_mappings_select_own"
  ON public.visibility_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "visibility_mappings_insert_own"
  ON public.visibility_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visibility_mappings_update_own"
  ON public.visibility_mappings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visibility_mappings_delete_own"
  ON public.visibility_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- ViewProfile public read: anyone can read records with visibility = 'public'.
-- This enables the server-side ViewProfile query to render public output
-- without requiring the viewer to be authenticated.
CREATE POLICY "visibility_mappings_public_read"
  ON public.visibility_mappings FOR SELECT
  USING (visibility = 'public');

COMMENT ON TABLE public.visibility_mappings IS
  'Authoritative per-content visibility records. Consulted before any content
   is rendered on ViewProfile or /profile/[handle]. EditProfileDream writes
   to this table only when the user performs an explicit share action — never
   on a private save/draft. Privacy by design: default is private.';
