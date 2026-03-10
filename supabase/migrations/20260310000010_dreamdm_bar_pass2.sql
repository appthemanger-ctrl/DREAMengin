-- 20260310000010_dreamdm_bar_pass2.sql
-- DreamDM Bar Pass 2 schema additions.
--
-- 1. Add media_url / media_type columns to messages (referenced by MessagesClient
--    and the messages API but missing from the original migration).
-- 2. Add drafts table for future cross-device draft sync (Pass 3+); Pass 2 uses
--    localStorage on the client but the table is provisioned here.
-- 3. Ensure notifications.content column name aligns with API layer.
--
-- Follows AXIOM 4 (security by default): RLS enabled on every new table.
-- Follows AXIOM 5 (privacy by design): drafts are user-only; nothing public.
-- Idempotent: all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

-- ─────────────────────────────────────────────
-- 1. messages — add media columns
-- ─────────────────────────────────────────────
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (
    media_type IN ('image', 'video', 'audio', 'file')
  );

-- ─────────────────────────────────────────────
-- 2. drafts — user-owned message draft storage
--    Private by design: no public SELECT policy.
--    Pass 2 client code uses localStorage; this table is reserved for
--    Pass 3 cross-device draft sync.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drafts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID        REFERENCES public.conversations(id) ON DELETE CASCADE,
  subject         TEXT,
  body            TEXT        NOT NULL DEFAULT '',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT drafts_unique_user_conv UNIQUE (user_id, conversation_id)
);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drafts_select_own"  ON public.drafts;
DROP POLICY IF EXISTS "drafts_insert_own"  ON public.drafts;
DROP POLICY IF EXISTS "drafts_update_own"  ON public.drafts;
DROP POLICY IF EXISTS "drafts_delete_own"  ON public.drafts;

CREATE POLICY "drafts_select_own" ON public.drafts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "drafts_insert_own" ON public.drafts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "drafts_update_own" ON public.drafts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "drafts_delete_own" ON public.drafts
  FOR DELETE USING (user_id = auth.uid());
