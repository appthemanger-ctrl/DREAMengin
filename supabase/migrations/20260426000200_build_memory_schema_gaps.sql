-- Adds schema for tables that build-memory found referenced by code but absent
-- from generated Supabase types and migrations.

-- ── forge_assemblies ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forge_assemblies (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  assembly    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  visibility  text        NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forge_assemblies_user_updated_idx
  ON public.forge_assemblies (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS forge_assemblies_visibility_updated_idx
  ON public.forge_assemblies (visibility, updated_at DESC);

ALTER TABLE public.forge_assemblies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forge_assemblies_select_visible" ON public.forge_assemblies;
CREATE POLICY "forge_assemblies_select_visible"
  ON public.forge_assemblies FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "forge_assemblies_insert_own" ON public.forge_assemblies;
CREATE POLICY "forge_assemblies_insert_own"
  ON public.forge_assemblies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forge_assemblies_update_own" ON public.forge_assemblies;
CREATE POLICY "forge_assemblies_update_own"
  ON public.forge_assemblies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forge_assemblies_delete_own" ON public.forge_assemblies;
CREATE POLICY "forge_assemblies_delete_own"
  ON public.forge_assemblies FOR DELETE
  USING (auth.uid() = user_id);

-- ── user_actions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_actions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type  text        NOT NULL,
  ip_hash      text,
  metadata     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_actions_user_created_idx
  ON public.user_actions (user_id, created_at DESC);

ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_actions_select_own" ON public.user_actions;
CREATE POLICY "user_actions_select_own"
  ON public.user_actions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_actions_insert_own" ON public.user_actions;
CREATE POLICY "user_actions_insert_own"
  ON public.user_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── voice_profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.voice_profiles (
  id          text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voice_profiles_user_created_idx
  ON public.voice_profiles (user_id, created_at DESC);

ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voice_profiles_select_own" ON public.voice_profiles;
CREATE POLICY "voice_profiles_select_own"
  ON public.voice_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "voice_profiles_insert_own" ON public.voice_profiles;
CREATE POLICY "voice_profiles_insert_own"
  ON public.voice_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "voice_profiles_delete_own" ON public.voice_profiles;
CREATE POLICY "voice_profiles_delete_own"
  ON public.voice_profiles FOR DELETE
  USING (auth.uid() = user_id);
