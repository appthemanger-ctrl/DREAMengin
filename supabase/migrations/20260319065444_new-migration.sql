-- 20260319065444_new-migration.sql
-- Adds missing tables referenced by API routes:
--   likes, widget_content, widget_events, connector_configs, page_configs
-- Also adds the increment_likes RPC helper used by the likes API.
--
-- AXIOM 4 — Security by Default:
--   RLS enabled on every table; owner-only read/write throughout.
-- AXIOM 5 — Privacy by Design:
--   Nothing is public unless explicitly declared (likes SELECT is public for counts).
-- Idempotent: CREATE TABLE IF NOT EXISTS + DROP/CREATE POLICY are safe to re-run.

-- ── likes ──────────────────────────────────────────────────────────────────
-- Generic content-like table. Supports any content_type (post, music, project, …).
-- Composite primary key prevents duplicate likes per (user, type, content).

CREATE TABLE IF NOT EXISTS likes (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text        NOT NULL,
  content_id   text        NOT NULL,
  post_id      uuid        REFERENCES app_posts(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS likes_content_idx
  ON likes (content_type, content_id);

CREATE INDEX IF NOT EXISTS likes_user_id_idx
  ON likes (user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Public SELECT allows anyone to read like counts.
DROP POLICY IF EXISTS "likes_select_public" ON likes;
CREATE POLICY "likes_select_public"
  ON likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ── increment_likes RPC ────────────────────────────────────────────────────
-- Best-effort helper called by the likes API to bump likes_count on the
-- source content table (e.g. app_posts). Silently no-ops if the column
-- is absent so callers never need to guard the RPC call themselves.
-- Only operates on an explicit allowlist of content tables to prevent
-- callers from targeting arbitrary tables via the dynamic SQL.

CREATE OR REPLACE FUNCTION public.increment_likes(table_name text, row_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Allowlist: only permit known content tables that carry a likes_count column.
  IF table_name NOT IN ('app_posts', 'music_releases', 'merch') THEN
    RAISE EXCEPTION 'increment_likes: table % is not in the permitted allowlist', table_name;
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1',
    table_name
  ) USING row_id;
EXCEPTION
  WHEN raise_exception THEN RAISE; -- Re-raise allowlist violations
  WHEN others THEN
    NULL; -- Silently ignore — column may not exist yet on every allowed table.
END;
$$;

-- ── widget_content ─────────────────────────────────────────────────────────
-- Stores compressed widget payload blobs. content_hash provides deduplication
-- so identical payloads are stored only once (upload API checks hash first).

CREATE TABLE IF NOT EXISTS widget_content (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  content_hash     text        UNIQUE,
  content_encoding text,
  content_body     text,
  content          jsonb       NOT NULL DEFAULT '{}',
  metadata         jsonb,
  widget_id        uuid,       -- optional FK to a future widgets table
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS widget_content_owner_id_idx
  ON widget_content (owner_id);

CREATE INDEX IF NOT EXISTS widget_content_hash_idx
  ON widget_content (content_hash);

CREATE OR REPLACE FUNCTION public.set_widget_content_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS widget_content_updated_at ON widget_content;
CREATE TRIGGER widget_content_updated_at
  BEFORE UPDATE ON widget_content
  FOR EACH ROW EXECUTE FUNCTION public.set_widget_content_updated_at();

ALTER TABLE widget_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "widget_content_select_own" ON widget_content;
CREATE POLICY "widget_content_select_own"
  ON widget_content FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "widget_content_insert_own" ON widget_content;
CREATE POLICY "widget_content_insert_own"
  ON widget_content FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "widget_content_update_own" ON widget_content;
CREATE POLICY "widget_content_update_own"
  ON widget_content FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "widget_content_delete_own" ON widget_content;
CREATE POLICY "widget_content_delete_own"
  ON widget_content FOR DELETE
  USING (auth.uid() = owner_id);

-- ── widget_events ──────────────────────────────────────────────────────────
-- Audit log of widget content operations (content.created, content.referenced, …).

CREATE TABLE IF NOT EXISTS widget_events (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_instance_id uuid,       -- references widget_instances.instance_id; nullable
  event_type         text,
  payload            jsonb,
  type               text,
  channel            text,
  timestamp          timestamptz NOT NULL DEFAULT now(),
  widget_id          uuid        -- optional FK to a future widgets table
);

CREATE INDEX IF NOT EXISTS widget_events_actor_id_idx
  ON widget_events (actor_id);

CREATE INDEX IF NOT EXISTS widget_events_timestamp_idx
  ON widget_events (timestamp DESC);

ALTER TABLE widget_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "widget_events_insert_own" ON widget_events;
CREATE POLICY "widget_events_insert_own"
  ON widget_events FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "widget_events_select_own" ON widget_events;
CREATE POLICY "widget_events_select_own"
  ON widget_events FOR SELECT
  USING (auth.uid() = actor_id);

-- ── connector_configs ──────────────────────────────────────────────────────
-- Per-user connector configuration. Stores non-credential settings for each
-- provider integration (distinct from connector_accounts which stores tokens).

CREATE TABLE IF NOT EXISTS connector_configs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider   text        NOT NULL,
  config     jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS connector_configs_user_id_idx
  ON connector_configs (user_id);

CREATE OR REPLACE FUNCTION public.set_connector_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connector_configs_updated_at ON connector_configs;
CREATE TRIGGER connector_configs_updated_at
  BEFORE UPDATE ON connector_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_connector_configs_updated_at();

ALTER TABLE connector_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connector_configs_select_own" ON connector_configs;
CREATE POLICY "connector_configs_select_own"
  ON connector_configs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_configs_insert_own" ON connector_configs;
CREATE POLICY "connector_configs_insert_own"
  ON connector_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_configs_update_own" ON connector_configs;
CREATE POLICY "connector_configs_update_own"
  ON connector_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_configs_delete_own" ON connector_configs;
CREATE POLICY "connector_configs_delete_own"
  ON connector_configs FOR DELETE
  USING (auth.uid() = user_id);

-- ── page_configs ───────────────────────────────────────────────────────────
-- Per-user page configuration keyed by page_key.
-- Used by delete-dream and delete-data endpoints to clean up page settings.

CREATE TABLE IF NOT EXISTS page_configs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key   text        NOT NULL,
  config     jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, page_key)
);

CREATE INDEX IF NOT EXISTS page_configs_user_id_idx
  ON page_configs (user_id);

CREATE OR REPLACE FUNCTION public.set_page_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS page_configs_updated_at ON page_configs;
CREATE TRIGGER page_configs_updated_at
  BEFORE UPDATE ON page_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_page_configs_updated_at();

ALTER TABLE page_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_configs_select_own" ON page_configs;
CREATE POLICY "page_configs_select_own"
  ON page_configs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "page_configs_insert_own" ON page_configs;
CREATE POLICY "page_configs_insert_own"
  ON page_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "page_configs_update_own" ON page_configs;
CREATE POLICY "page_configs_update_own"
  ON page_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "page_configs_delete_own" ON page_configs;
CREATE POLICY "page_configs_delete_own"
  ON page_configs FOR DELETE
  USING (auth.uid() = user_id);
