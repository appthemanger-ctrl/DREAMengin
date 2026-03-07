-- 20260307000000_readme_gaps.sql
-- DREAMengin: Add tables required by README spec but missing from schema.
-- Tables: daydream_states, daydreamengin_states, marketplace_items, favorites, boards, board_posts
-- All tables follow AXIOM 4 (Security by Default) and AXIOM 5 (Privacy by Design):
--   - RLS enabled on every table
--   - owner-only writes unless explicitly public
--   - nothing public by default (LAW.md §2)
-- Idempotent: all statements use IF NOT EXISTS / DROP POLICY IF EXISTS.

-- ─────────────────────────────────────────────
-- 1. daydream_states
--    Persists per-user Daydream engine state (Side A).
--    Private to the owning user — never public.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daydream_states (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daydream_type TEXT        NOT NULL,
  side          TEXT        NOT NULL DEFAULT 'A' CHECK (side IN ('A', 'B')),
  last_visited  TIMESTAMPTZ NOT NULL DEFAULT now(),
  state         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, daydream_type)
);

ALTER TABLE public.daydream_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daydream_states_select_own"  ON public.daydream_states;
DROP POLICY IF EXISTS "daydream_states_insert_own"  ON public.daydream_states;
DROP POLICY IF EXISTS "daydream_states_update_own"  ON public.daydream_states;
DROP POLICY IF EXISTS "daydream_states_delete_own"  ON public.daydream_states;

CREATE POLICY "daydream_states_select_own" ON public.daydream_states
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "daydream_states_insert_own" ON public.daydream_states
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daydream_states_update_own" ON public.daydream_states
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "daydream_states_delete_own" ON public.daydream_states
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 2. daydreamengin_states
--    Persists per-user DaydreamEngin engine state (Side B).
--    Separate table from daydream_states to keep Side A/B state independent.
--    Same schema and RLS rules as daydream_states.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daydreamengin_states (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daydream_type TEXT        NOT NULL,
  side          TEXT        NOT NULL DEFAULT 'B' CHECK (side IN ('A', 'B')),
  last_visited  TIMESTAMPTZ NOT NULL DEFAULT now(),
  state         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, daydream_type)
);

ALTER TABLE public.daydreamengin_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daydreamengin_states_select_own"  ON public.daydreamengin_states;
DROP POLICY IF EXISTS "daydreamengin_states_insert_own"  ON public.daydreamengin_states;
DROP POLICY IF EXISTS "daydreamengin_states_update_own"  ON public.daydreamengin_states;
DROP POLICY IF EXISTS "daydreamengin_states_delete_own"  ON public.daydreamengin_states;

CREATE POLICY "daydreamengin_states_select_own" ON public.daydreamengin_states
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "daydreamengin_states_insert_own" ON public.daydreamengin_states
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daydreamengin_states_update_own" ON public.daydreamengin_states
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "daydreamengin_states_delete_own" ON public.daydreamengin_states
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 3. marketplace_items
--    DreamMarketplace listings. Sellers own their rows.
--    Only published items are visible to the public (LAW.md §2: nothing public by default).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  category      TEXT        NOT NULL DEFAULT 'widget',
  price_cents   INTEGER     NOT NULL DEFAULT 0,
  file_url      TEXT,
  preview_url   TEXT,
  is_published  BOOLEAN     NOT NULL DEFAULT false,
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_items_select_published" ON public.marketplace_items;
DROP POLICY IF EXISTS "marketplace_items_select_own"       ON public.marketplace_items;
DROP POLICY IF EXISTS "marketplace_items_insert_own"       ON public.marketplace_items;
DROP POLICY IF EXISTS "marketplace_items_update_own"       ON public.marketplace_items;
DROP POLICY IF EXISTS "marketplace_items_delete_own"       ON public.marketplace_items;

-- Anyone (including anon) may read published items
CREATE POLICY "marketplace_items_select_published" ON public.marketplace_items
  FOR SELECT USING (is_published = true OR seller_id = auth.uid());

-- Seller manages their own rows
CREATE POLICY "marketplace_items_insert_own" ON public.marketplace_items
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "marketplace_items_update_own" ON public.marketplace_items
  FOR UPDATE USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

CREATE POLICY "marketplace_items_delete_own" ON public.marketplace_items
  FOR DELETE USING (seller_id = auth.uid());

-- ─────────────────────────────────────────────
-- 4. favorites
--    Polymorphic user-owned bookmark store.
--    target_type distinguishes 'widget', 'user', 'post', 'item', etc.
--    Unique per (user, type, target) to prevent duplicates.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT        NOT NULL,
  target_id   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorites_unique_target UNIQUE (user_id, target_type, target_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own"  ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own"  ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own"  ON public.favorites;

CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 5. boards
--    User-created pin/inspiration boards.
--    Private by default; owner may flip is_public = true.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.boards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boards_select"      ON public.boards;
DROP POLICY IF EXISTS "boards_insert_own"  ON public.boards;
DROP POLICY IF EXISTS "boards_update_own"  ON public.boards;
DROP POLICY IF EXISTS "boards_delete_own"  ON public.boards;

-- Owner always sees their boards; anyone can see public boards
CREATE POLICY "boards_select" ON public.boards
  FOR SELECT USING (owner_id = auth.uid() OR is_public = true);

CREATE POLICY "boards_insert_own" ON public.boards
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "boards_update_own" ON public.boards
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "boards_delete_own" ON public.boards
  FOR DELETE USING (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- 6. board_posts
--    Posts (text content) attached to a board.
--    Visibility derives from the parent board:
--      - anyone may SELECT posts on public boards
--      - authors manage their own posts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.board_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID        NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  is_pinned  BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_posts_select"       ON public.board_posts;
DROP POLICY IF EXISTS "board_posts_insert_own"   ON public.board_posts;
DROP POLICY IF EXISTS "board_posts_update_own"   ON public.board_posts;
DROP POLICY IF EXISTS "board_posts_delete_own"   ON public.board_posts;

-- Visible if the parent board is public, or the viewer is the author, or the viewer owns the board
CREATE POLICY "board_posts_select" ON public.board_posts
  FOR SELECT USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id
        AND (b.is_public = true OR b.owner_id = auth.uid())
    )
  );

CREATE POLICY "board_posts_insert_own" ON public.board_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "board_posts_update_own" ON public.board_posts
  FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "board_posts_delete_own" ON public.board_posts
  FOR DELETE USING (author_id = auth.uid());
