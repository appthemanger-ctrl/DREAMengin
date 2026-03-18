-- 20260320000000_scheduled_posts.sql
-- DREAMengin: Add scheduled_posts table for the ContentScheduler surface.
--
-- Architecture justification:
--   docs/AXIOMS.md §3 — every visible action must do something real.
--   ContentScheduler previously used hardcoded demo data and a "Schedule"
--   button with no handler. This table backs the real persistence layer.
--
--   docs/LAW.md §2 — nothing is public by default.
--   Scheduled posts are private to the owning user until explicitly published.
--
-- RLS: owner-only (read + write). Nothing is public.
-- Idempotent: all statements use IF NOT EXISTS / DROP POLICY IF EXISTS.

-- ─────────────────────────────────────────────
-- 1. scheduled_posts
--    Stores posts queued for future publication.
--    Private to the owning user at all times.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL DEFAULT '',
  content        TEXT        NOT NULL,
  scheduled_for  TIMESTAMPTZ NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'scheduled'
                              CHECK (status IN ('scheduled','publishing','published','failed')),
  platforms      TEXT[]      NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scheduled_posts_select_own" ON public.scheduled_posts;
DROP POLICY IF EXISTS "scheduled_posts_insert_own" ON public.scheduled_posts;
DROP POLICY IF EXISTS "scheduled_posts_update_own" ON public.scheduled_posts;
DROP POLICY IF EXISTS "scheduled_posts_delete_own" ON public.scheduled_posts;

CREATE POLICY "scheduled_posts_select_own" ON public.scheduled_posts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "scheduled_posts_insert_own" ON public.scheduled_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "scheduled_posts_update_own" ON public.scheduled_posts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "scheduled_posts_delete_own" ON public.scheduled_posts
  FOR DELETE USING (user_id = auth.uid());

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.touch_scheduled_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scheduled_posts_updated_at ON public.scheduled_posts;
CREATE TRIGGER trg_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_scheduled_posts_updated_at();
