-- 20260322000000_phase8b_dream_windows.sql
-- Phase 8 Section B — Dream Window System: Full Lifecycle Activation
--
-- Creates the dream_windows table and enforces all visibility/ownership
-- policies via Row Level Security.
--
-- Privacy (AXIOM 5 — Privacy by Design):
--   visibility defaults to 'private' — nothing is public without explicit
--   user intent (docs/LAW.md §2, docs/AXIOMS.md §product integrity rules).
--
-- Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
--   Four required fields enforced at DB level; full 10-field set validated
--   at the API layer (Point 12).
--
-- Ownership: every row is owned by exactly one auth user (owner_id).
--   Owner-only writes enforced by RLS; non-owners get 403 at the API layer
--   and are blocked by RLS at the DB layer (Point 15).
--
-- Point 14: RLS policies
--   private  → owner-only read
--   shared   → owner + authenticated users who follow the owner
--   public   → any authenticated user
--
-- Point 22: Atomic delete is handled by ON DELETE CASCADE on
--   visibility_mappings(content_id via the application layer). The
--   dream_window_projections table is created here for projection records.

-- ── 1. dream_windows table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dream_windows (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT        NOT NULL,
  owner_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  size              JSONB       NOT NULL DEFAULT '{"width":320,"height":240}'::jsonb,
  position          JSONB       NOT NULL DEFAULT '{"x":0,"y":0}'::jsonb,
  visibility        TEXT        NOT NULL DEFAULT 'private'
                                  CONSTRAINT dream_windows_visibility_check
                                    CHECK (visibility IN ('private', 'shared', 'public')),
  source_bindings   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  destination_rules JSONB       NOT NULL DEFAULT '[]'::jsonb,
  active_state      TEXT        NOT NULL DEFAULT 'Unbound Dream Window'
                                  CONSTRAINT dream_windows_active_state_check
                                    CHECK (active_state IN (
                                      'Unbound Dream Window',
                                      'Bound Dream Window',
                                      'Mounted Dream Window',
                                      'Collapsed Dream Window'
                                    )),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.dream_windows IS
  'Persisted Dream Window lifecycle records.
   One row per Dream Window instance owned by a user.
   active_state tracks the Unbound→Bound→Mounted→Collapsed lifecycle.
   visibility defaults to private (nothing public by default per AXIOMS.md).';

-- ── 2. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS dream_windows_owner_idx
  ON public.dream_windows (owner_id);

CREATE INDEX IF NOT EXISTS dream_windows_visibility_idx
  ON public.dream_windows (visibility);

CREATE INDEX IF NOT EXISTS dream_windows_owner_visibility_idx
  ON public.dream_windows (owner_id, visibility);

-- ── 3. Updated-at trigger ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dream_windows_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dream_windows_updated_at ON public.dream_windows;
CREATE TRIGGER dream_windows_updated_at
  BEFORE UPDATE ON public.dream_windows
  FOR EACH ROW
  EXECUTE FUNCTION public.dream_windows_set_updated_at();

-- ── 4. dream_window_projections table ─────────────────────────────────────
-- Projection records: what is exposed on the View Profile Surface.
-- These are the "saved/shared projection records" that Point 21 requires.
-- Atomically deleted with the parent dream_window (ON DELETE CASCADE).

CREATE TABLE IF NOT EXISTS public.dream_window_projections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        UUID        NOT NULL
                               REFERENCES public.dream_windows(id) ON DELETE CASCADE,
  owner_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  projection_data  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  visibility       TEXT        NOT NULL DEFAULT 'private'
                                  CONSTRAINT dwp_visibility_check
                                    CHECK (visibility IN ('private', 'shared', 'public')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.dream_window_projections IS
  'Saved projection records for Dream Windows.
   Populated when a user explicitly publishes a Dream Window.
   View Profile Surface reads ONLY from this table (not live builder state).
   ON DELETE CASCADE ensures projections are removed when the Dream Window is deleted.';

CREATE INDEX IF NOT EXISTS dwp_source_idx
  ON public.dream_window_projections (source_id);

CREATE INDEX IF NOT EXISTS dwp_owner_visibility_idx
  ON public.dream_window_projections (owner_id, visibility);

-- ── 5. Enable RLS ──────────────────────────────────────────────────────────

ALTER TABLE public.dream_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_window_projections ENABLE ROW LEVEL SECURITY;

-- ── 6. dream_windows RLS policies ─────────────────────────────────────────

-- 6a. Owner can read their own windows (all visibility levels)
DROP POLICY IF EXISTS "dream_windows_owner_read" ON public.dream_windows;
CREATE POLICY "dream_windows_owner_read"
  ON public.dream_windows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- 6b. Authenticated users can read shared Dream Windows from followed users
DROP POLICY IF EXISTS "dream_windows_shared_read" ON public.dream_windows;
CREATE POLICY "dream_windows_shared_read"
  ON public.dream_windows
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'shared'
    AND auth.uid() != owner_id
    AND EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid()
        AND following_id = owner_id
    )
  );

-- 6c. Anyone authenticated can read public Dream Windows
DROP POLICY IF EXISTS "dream_windows_public_read" ON public.dream_windows;
CREATE POLICY "dream_windows_public_read"
  ON public.dream_windows
  FOR SELECT
  TO authenticated
  USING (visibility = 'public' AND auth.uid() != owner_id);

-- 6d. Owner can insert their own windows
DROP POLICY IF EXISTS "dream_windows_owner_insert" ON public.dream_windows;
CREATE POLICY "dream_windows_owner_insert"
  ON public.dream_windows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- 6e. Owner can update their own windows
DROP POLICY IF EXISTS "dream_windows_owner_update" ON public.dream_windows;
CREATE POLICY "dream_windows_owner_update"
  ON public.dream_windows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6f. Owner can delete their own windows
DROP POLICY IF EXISTS "dream_windows_owner_delete" ON public.dream_windows;
CREATE POLICY "dream_windows_owner_delete"
  ON public.dream_windows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ── 7. dream_window_projections RLS policies ───────────────────────────────

-- 7a. Owner can read their own projections
DROP POLICY IF EXISTS "dwp_owner_read" ON public.dream_window_projections;
CREATE POLICY "dwp_owner_read"
  ON public.dream_window_projections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- 7b. Authenticated users can read shared projections from followed users
DROP POLICY IF EXISTS "dwp_shared_read" ON public.dream_window_projections;
CREATE POLICY "dwp_shared_read"
  ON public.dream_window_projections
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'shared'
    AND auth.uid() != owner_id
    AND EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid()
        AND following_id = owner_id
    )
  );

-- 7c. Anyone authenticated can read public projections
DROP POLICY IF EXISTS "dwp_public_read" ON public.dream_window_projections;
CREATE POLICY "dwp_public_read"
  ON public.dream_window_projections
  FOR SELECT
  TO authenticated
  USING (visibility = 'public' AND auth.uid() != owner_id);

-- 7d. Owner can insert projections
DROP POLICY IF EXISTS "dwp_owner_insert" ON public.dream_window_projections;
CREATE POLICY "dwp_owner_insert"
  ON public.dream_window_projections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- 7e. Owner can update projections
DROP POLICY IF EXISTS "dwp_owner_update" ON public.dream_window_projections;
CREATE POLICY "dwp_owner_update"
  ON public.dream_window_projections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 7f. Owner can delete projections
DROP POLICY IF EXISTS "dwp_owner_delete" ON public.dream_window_projections;
CREATE POLICY "dwp_owner_delete"
  ON public.dream_window_projections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
