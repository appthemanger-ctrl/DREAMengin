-- Migration: conversations and messages tables
-- Adds DreamDM persistence layer per README spec §16 / ARCHITECTURE.md §1 (DreamDM module).
-- Follows AXIOM 4 (security by default) — RLS enabled on both tables.
-- Follows AXIOM 5 (privacy by design) — participants can only access their own conversations.

-- ─────────────────────────────────────────────
-- 1. conversations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_participants_unique UNIQUE (participant1_id, participant2_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Participants can view conversations they are part of
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- Participants can create conversations they belong to
DROP POLICY IF EXISTS "conversations_insert_participant" ON public.conversations;
CREATE POLICY "conversations_insert_participant" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- Participants can update (e.g. updated_at) conversations they are part of
DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;
CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- ─────────────────────────────────────────────
-- 2. messages
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          TEXT        NOT NULL,
  is_read          BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversation participants can read messages
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

-- Only the sender can insert their own messages
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Only the sender can update their own messages
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
CREATE POLICY "messages_update_sender" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Only the sender can delete their own messages
DROP POLICY IF EXISTS "messages_delete_sender" ON public.messages;
CREATE POLICY "messages_delete_sender" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);
