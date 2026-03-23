-- Migration: message_boards table
-- Public discussion boards searchable from DreamDM and the search bar.
-- Distinct from the generic `boards` table (which stores user content boards).
-- message_boards are platform-wide discussion areas, optionally owned by a user.
--
-- AXIOM 4 — Security by Default: RLS enabled; public read, owner write.
-- AXIOM 5 — Privacy by Design: boards are public by default (discussion areas).

CREATE TABLE IF NOT EXISTS public.message_boards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  is_public   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_boards_title_idx
  ON public.message_boards USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS message_boards_owner_id_idx
  ON public.message_boards (owner_id);

CREATE OR REPLACE FUNCTION public.set_message_boards_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS message_boards_updated_at ON public.message_boards;
CREATE TRIGGER message_boards_updated_at
  BEFORE UPDATE ON public.message_boards
  FOR EACH ROW EXECUTE FUNCTION public.set_message_boards_updated_at();

ALTER TABLE public.message_boards ENABLE ROW LEVEL SECURITY;

-- Public boards are readable by all authenticated users
DROP POLICY IF EXISTS "message_boards_select_public" ON public.message_boards;
CREATE POLICY "message_boards_select_public"
  ON public.message_boards FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

-- Only owners can insert their own boards
DROP POLICY IF EXISTS "message_boards_insert_own" ON public.message_boards;
CREATE POLICY "message_boards_insert_own"
  ON public.message_boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their boards
DROP POLICY IF EXISTS "message_boards_update_own" ON public.message_boards;
CREATE POLICY "message_boards_update_own"
  ON public.message_boards FOR UPDATE
  USING (auth.uid() = owner_id);

-- Only owners can delete their boards
DROP POLICY IF EXISTS "message_boards_delete_own" ON public.message_boards;
CREATE POLICY "message_boards_delete_own"
  ON public.message_boards FOR DELETE
  USING (auth.uid() = owner_id);
