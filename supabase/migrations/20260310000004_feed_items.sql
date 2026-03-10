-- 20260310000004_feed_items.sql
-- Phase 5 — Feed & Friends Connections
-- Creates the feed_items table for storing normalised cross-provider feed content.
--
-- AXIOM 4 — Security by Default:
--   RLS enabled. Users see only their own feed items.
--
-- AXIOM 5 — Privacy by Design:
--   Feed items are user-scoped. No cross-user exposure.
--   Dedup key: (user_id, provider, external_id) prevents duplicate inserts.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS is safe to re-run.

-- ── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feed_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider     text NOT NULL,
  external_id  text NOT NULL,
  -- Full UnifiedFeedItem serialised as jsonb.
  -- See types/connector.ts for the exact shape.
  payload      jsonb NOT NULL DEFAULT '{}',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate inserts for the same post/item per user.
  UNIQUE (user_id, provider, external_id)
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS feed_items_user_id_idx
  ON public.feed_items (user_id);

CREATE INDEX IF NOT EXISTS feed_items_user_provider_idx
  ON public.feed_items (user_id, provider);

CREATE INDEX IF NOT EXISTS feed_items_published_at_idx
  ON public.feed_items (published_at DESC NULLS LAST);

-- ── Row-Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_items_select_own" ON public.feed_items;
CREATE POLICY "feed_items_select_own"
  ON public.feed_items
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_items_insert_own" ON public.feed_items;
CREATE POLICY "feed_items_insert_own"
  ON public.feed_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_items_delete_own" ON public.feed_items;
CREATE POLICY "feed_items_delete_own"
  ON public.feed_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Feed items are immutable once stored — no UPDATE policy intentionally.
-- To refresh, delete and re-insert (handled by the sync route).

-- ── Comments ───────────────────────────────────────────────────────────────

COMMENT ON TABLE public.feed_items IS
  'Normalised cross-provider feed items. One row per (user_id, provider, external_id).
   payload contains the full UnifiedFeedItem JSON (see types/connector.ts).
   Items are stored by the /api/connectors/[provider]/sync route after normalisation.
   Items are user-private by default — no public sharing of feed content.';

COMMENT ON COLUMN public.feed_items.payload IS
  'Serialised UnifiedFeedItem. Shape:
   { provider, external_id, author_handle, author_name, content_text,
     content_html?, media[], permalink, published_at, raw }';

COMMENT ON COLUMN public.feed_items.external_id IS
  'Stable ID assigned by the source provider (e.g. Mastodon post ID, GitHub event ID).
   Combined with (user_id, provider) forms the dedup key.';
