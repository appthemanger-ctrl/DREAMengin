-- supabase/migrations/20260323100000_embed_feed_items.sql
--
-- Public embed-feed items table.
--
-- Populated by the GitHub Actions `update-embed-feed` workflow using the
-- service-role key (server-side CI — no user session).
-- Read by the /api/embed-feed route and the EmbedFeedWidget component.
--
-- This is a system-level, non-user-scoped table:
--   • All rows are publicly readable (the embed feed is public content).
--   • Only the service role may insert / update / delete rows.
--
-- Architecture justification: render-on-demand / static bake pattern —
-- docs/ARCHITECTURE.md §10. CI does the heavy API work; the app reads
-- pre-fetched rows with zero external latency.

CREATE TABLE IF NOT EXISTS public.embed_feed_items (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  provider       text    NOT NULL,                -- 'youtube' | 'instagram'
  external_id    text    NOT NULL,                -- YouTube videoId / Instagram media id
  title          text    NOT NULL DEFAULT '',
  permalink      text    NOT NULL DEFAULT '',
  published_at   timestamptz,
  view_count     bigint  NOT NULL DEFAULT 0,
  tags           text[]  NOT NULL DEFAULT '{}',
  embed_html     text    NOT NULL DEFAULT '',
  thumbnail_url  text    NOT NULL DEFAULT '',
  channel_title  text    NOT NULL DEFAULT '',
  generated_at   timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT embed_feed_items_provider_external_id_key UNIQUE (provider, external_id)
);

-- Index for fast ordered reads (newest first per provider)
CREATE INDEX IF NOT EXISTS embed_feed_items_provider_published_idx
  ON public.embed_feed_items (provider, published_at DESC NULLS LAST);

-- Row-level security
ALTER TABLE public.embed_feed_items ENABLE ROW LEVEL SECURITY;

-- Public: anyone may read embed feed items (they are public social content)
CREATE POLICY "embed_feed_items_public_read"
  ON public.embed_feed_items
  FOR SELECT
  TO public
  USING (true);

-- Write: service role only (bypasses RLS entirely — policy below is a safeguard
-- for any authenticated inserts that go through the anon key)
CREATE POLICY "embed_feed_items_service_write"
  ON public.embed_feed_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
