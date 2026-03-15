-- supabase/migrations/20260315000000_content_drafts.sql
--
-- Creates the content_drafts table used by:
--   app/api/drafts/route.ts       (GET / POST)
--   app/api/drafts/[id]/route.ts  (DELETE / PATCH)
--
-- This table stores content-creation drafts (posts, videos, stories, threads,
-- captions, tweet threads, bios, scripts) created via ContentEngin.
--
-- It is DISTINCT from the `drafts` table (DreamDM message drafts).
--
-- Privacy model:
--   - Drafts are private by default (LAW.md §2 — nothing is public by default)
--   - user_id is always set from auth, never from request body (AXIOM 4)
--   - RLS enforces owner-only access (AXIOM 5 — privacy by design)
--
-- Architecture justification: ARCHITECTURE.md §5 (privacy/projection boundaries),
-- ARCHITECTURE.md §10 (Supabase for database).

CREATE TABLE IF NOT EXISTS public.content_drafts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       text        NOT NULL,
  content_type  text        NOT NULL DEFAULT 'post'
                CHECK (content_type IN ('post','video','story','thread','caption','tweet_thread','bio','script')),
  title         text,
  scheduled_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user lookups ordered by most recent
CREATE INDEX IF NOT EXISTS content_drafts_user_updated
  ON public.content_drafts (user_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies: owner-only access
DROP POLICY IF EXISTS "content_drafts_select_own" ON public.content_drafts;
DROP POLICY IF EXISTS "content_drafts_insert_own" ON public.content_drafts;
DROP POLICY IF EXISTS "content_drafts_update_own" ON public.content_drafts;
DROP POLICY IF EXISTS "content_drafts_delete_own" ON public.content_drafts;

CREATE POLICY "content_drafts_select_own"
  ON public.content_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "content_drafts_insert_own"
  ON public.content_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_drafts_update_own"
  ON public.content_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_drafts_delete_own"
  ON public.content_drafts FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.content_drafts IS
  'ContentEngin draft storage — private content creation drafts per user. '
  'Distinct from the `drafts` table which stores DreamDM message drafts.';
