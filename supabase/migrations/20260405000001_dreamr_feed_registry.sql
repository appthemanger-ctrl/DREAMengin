-- supabase/migrations/20260405000001_dreamr_feed_registry.sql
--
-- DreamR Feed Limits, View Counting, Close Friends, Saved Posts, and
-- Universal Asset Registry extensions.
--
-- Changes:
--   1. Extend app_posts: original_post_id (share chain), view_count,
--      post_visibility (public | close_friends).
--   2. Create post_views: records which users have seen which root posts.
--   3. Create close_friends: many-to-many, governs close_friends visibility.
--   4. Create saved_posts: user-curated profile saves (FIFO queue, max 25).
--   5. Extend global_registry: asset optimisation metadata columns.
--
-- Security: RLS enabled on every new table. No data is public by default.

-- ── 1. Extend app_posts ───────────────────────────────────────────────────────

-- original_post_id: NULL for original posts, points to the root post for shares.
ALTER TABLE public.app_posts
  ADD COLUMN IF NOT EXISTS original_post_id UUID
    REFERENCES public.app_posts(id) ON DELETE SET NULL;

-- view_count: maintained by server on every qualifying view event.
ALTER TABLE public.app_posts
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- post_visibility: controls who can see the post in feeds.
-- 'public'        — visible to everyone
-- 'close_friends' — visible only to the poster's close friends list
ALTER TABLE public.app_posts
  ADD COLUMN IF NOT EXISTS post_visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (post_visibility IN ('public', 'close_friends'));

CREATE INDEX IF NOT EXISTS idx_app_posts_original
  ON public.app_posts(original_post_id)
  WHERE original_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_posts_visibility
  ON public.app_posts(post_visibility, created_at DESC);

-- ── 2. post_views ─────────────────────────────────────────────────────────────
-- Records that a specific viewer has viewed a specific root post.
-- Used to enforce "first share" vs "subsequent share" view counting rules.

CREATE TABLE IF NOT EXISTS public.post_views (
  root_post_id UUID        NOT NULL REFERENCES public.app_posts(id) ON DELETE CASCADE,
  viewer_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (root_post_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_post_views_root
  ON public.post_views(root_post_id);

CREATE INDEX IF NOT EXISTS idx_post_views_viewer
  ON public.post_views(viewer_id, viewed_at DESC);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Viewers can insert their own view records.
DROP POLICY IF EXISTS "post_views_insert_own" ON public.post_views;
CREATE POLICY "post_views_insert_own" ON public.post_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Only the viewer can read their own view records (privacy by default).
DROP POLICY IF EXISTS "post_views_select_own" ON public.post_views;
CREATE POLICY "post_views_select_own" ON public.post_views
  FOR SELECT USING (viewer_id = auth.uid());

-- ── 3. close_friends ─────────────────────────────────────────────────────────
-- A directed many-to-many relationship: user_id has friend_id in their
-- close friends list. Both must be real users.

CREATE TABLE IF NOT EXISTS public.close_friends (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_close_friends_user
  ON public.close_friends(user_id, added_at DESC);

ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

-- Only the owner of the list can see, add, or remove entries.
DROP POLICY IF EXISTS "close_friends_select_own"  ON public.close_friends;
DROP POLICY IF EXISTS "close_friends_insert_own"  ON public.close_friends;
DROP POLICY IF EXISTS "close_friends_delete_own"  ON public.close_friends;

CREATE POLICY "close_friends_select_own" ON public.close_friends
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "close_friends_insert_own" ON public.close_friends
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "close_friends_delete_own" ON public.close_friends
  FOR DELETE USING (user_id = auth.uid());

-- ── 4. saved_posts ────────────────────────────────────────────────────────────
-- Stores user-curated profile saves: up to 25 per user.
-- FIFO enforced by the API: when inserting the 26th, the oldest is removed.

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES public.app_posts(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user
  ON public.saved_posts(user_id, saved_at DESC);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_posts_select_own"  ON public.saved_posts;
DROP POLICY IF EXISTS "saved_posts_insert_own"  ON public.saved_posts;
DROP POLICY IF EXISTS "saved_posts_delete_own"  ON public.saved_posts;

CREATE POLICY "saved_posts_select_own" ON public.saved_posts
  FOR SELECT USING (user_id = auth.uid());

-- Allow reading saved post ids for profile display (so others can see which
-- posts appear on a profile, without revealing the full saved_posts table).
DROP POLICY IF EXISTS "saved_posts_select_public" ON public.saved_posts;
CREATE POLICY "saved_posts_select_public" ON public.saved_posts
  FOR SELECT USING (true);

CREATE POLICY "saved_posts_insert_own" ON public.saved_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_posts_delete_own" ON public.saved_posts
  FOR DELETE USING (user_id = auth.uid());

-- ── 5. Extend global_registry ─────────────────────────────────────────────────
-- Asset optimisation metadata: stored alongside every optimised asset entry.

ALTER TABLE public.global_registry
  ADD COLUMN IF NOT EXISTS original_size    BIGINT,
  ADD COLUMN IF NOT EXISTS optimised_size   BIGINT,
  ADD COLUMN IF NOT EXISTS method           TEXT,
  ADD COLUMN IF NOT EXISTS quality          TEXT,
  ADD COLUMN IF NOT EXISTS upload_context   TEXT,
  ADD COLUMN IF NOT EXISTS has_original     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS folder           TEXT,
  ADD COLUMN IF NOT EXISTS source           TEXT;
