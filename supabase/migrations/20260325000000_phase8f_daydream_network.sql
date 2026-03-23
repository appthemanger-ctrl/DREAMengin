-- Phase 8 §F — Daydream Surface Network Deep Activation
-- Points 47-58: real content, persistence, brand kit, music outputs, multi-connection

-- ── 1. brand_kit_items ──────────────────────────────────────────────────────
-- Stores per-user brand kit entries (colors, fonts, logos, assets).
-- Replaces the in-memory mock array in BrandingEngin (Point 55).

CREATE TABLE IF NOT EXISTS public.brand_kit_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  item_type    TEXT        NOT NULL DEFAULT 'logo'
                           CHECK (item_type IN ('logo', 'color', 'font', 'asset')),
  value        TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_kit_items_user_updated
  ON public.brand_kit_items (user_id, updated_at DESC);

ALTER TABLE public.brand_kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_kit_items_select_own" ON public.brand_kit_items;
DROP POLICY IF EXISTS "brand_kit_items_insert_own" ON public.brand_kit_items;
DROP POLICY IF EXISTS "brand_kit_items_update_own" ON public.brand_kit_items;
DROP POLICY IF EXISTS "brand_kit_items_delete_own" ON public.brand_kit_items;

CREATE POLICY "brand_kit_items_select_own" ON public.brand_kit_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "brand_kit_items_insert_own" ON public.brand_kit_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "brand_kit_items_update_own" ON public.brand_kit_items
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "brand_kit_items_delete_own" ON public.brand_kit_items
  FOR DELETE USING (user_id = auth.uid());

-- ── 2. music_outputs ────────────────────────────────────────────────────────
-- Stores shareable / playable music outputs produced in StarMakerEngin.
-- Each row represents a finalized stem export or track session (Point 51).

CREATE TABLE IF NOT EXISTS public.music_outputs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL DEFAULT 'Untitled Track',
  bpm           INT         NOT NULL DEFAULT 120,
  musical_key   TEXT        NOT NULL DEFAULT 'C',
  key_mode      TEXT        NOT NULL DEFAULT 'major' CHECK (key_mode IN ('major', 'minor')),
  stems         JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- array of stem types ready
  beat_grid     JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- beat grid snapshot
  mixer_state   JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- mixer channel volumes
  share_url     TEXT,                                      -- optional shareable URL
  visibility    TEXT        NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS music_outputs_user_created
  ON public.music_outputs (user_id, created_at DESC);

ALTER TABLE public.music_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "music_outputs_select_own"   ON public.music_outputs;
DROP POLICY IF EXISTS "music_outputs_insert_own"   ON public.music_outputs;
DROP POLICY IF EXISTS "music_outputs_update_own"   ON public.music_outputs;
DROP POLICY IF EXISTS "music_outputs_delete_own"   ON public.music_outputs;
DROP POLICY IF EXISTS "music_outputs_select_public" ON public.music_outputs;

CREATE POLICY "music_outputs_select_own" ON public.music_outputs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "music_outputs_select_public" ON public.music_outputs
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "music_outputs_insert_own" ON public.music_outputs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "music_outputs_update_own" ON public.music_outputs
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "music_outputs_delete_own" ON public.music_outputs
  FOR DELETE USING (user_id = auth.uid());

-- ── 3. Ensure daydream_states has updated_at trigger ────────────────────────
-- The daydream_states table already exists (20260307000000_readme_gaps.sql).
-- Add a trigger to keep updated_at in sync if not already present.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daydream_states_updated_at ON public.daydream_states;
CREATE TRIGGER daydream_states_updated_at
  BEFORE UPDATE ON public.daydream_states
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS brand_kit_items_updated_at ON public.brand_kit_items;
CREATE TRIGGER brand_kit_items_updated_at
  BEFORE UPDATE ON public.brand_kit_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS music_outputs_updated_at ON public.music_outputs;
CREATE TRIGGER music_outputs_updated_at
  BEFORE UPDATE ON public.music_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
