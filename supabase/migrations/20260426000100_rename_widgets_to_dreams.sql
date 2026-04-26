-- Phase 0 — stop calling them widgets: database compatibility migration.
-- Existing data is preserved by renaming tables when present and by leaving
-- backward-compatible views for legacy clients.

DO $$
BEGIN
  IF to_regclass('public.widget_definitions') IS NOT NULL
     AND to_regclass('public.dream_definitions') IS NULL THEN
    ALTER TABLE public.widget_definitions RENAME TO dream_definitions;
  END IF;

  IF to_regclass('public.widget_instances') IS NOT NULL
     AND to_regclass('public.dream_instances') IS NULL THEN
    ALTER TABLE public.widget_instances RENAME TO dream_instances;
  END IF;

  IF to_regclass('public.widget_content') IS NOT NULL
     AND to_regclass('public.dream_content') IS NULL THEN
    ALTER TABLE public.widget_content RENAME TO dream_content;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.platform_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'client',
  message TEXT NOT NULL,
  stack TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_errors ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_layout JSONB NOT NULL DEFAULT
    '{"home":{"dreams":[]},"dreamspace":{"dreams":[]}}'::jsonb;

CREATE TABLE IF NOT EXISTS public.user_dream_layout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  surface TEXT NOT NULL CHECK (surface IN ('home', 'dreamspace', 'profile', 'dock')),
  surface_key INTEGER NOT NULL DEFAULT 0,
  layout JSONB NOT NULL DEFAULT '{"dreams":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, surface, surface_key)
);

ALTER TABLE public.user_dream_layout ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own dream layout" ON public.user_dream_layout;
CREATE POLICY "Users can manage own dream layout"
  ON public.user_dream_layout
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF to_regclass('public.dream_instances') IS NOT NULL
     AND to_regclass('public.widget_instances') IS NULL THEN
    EXECUTE 'CREATE VIEW public.widget_instances AS SELECT * FROM public.dream_instances';
  END IF;

  IF to_regclass('public.dream_definitions') IS NOT NULL
     AND to_regclass('public.widget_definitions') IS NULL THEN
    EXECUTE 'CREATE VIEW public.widget_definitions AS SELECT * FROM public.dream_definitions';
  END IF;

  IF to_regclass('public.dream_content') IS NOT NULL
     AND to_regclass('public.widget_content') IS NULL THEN
    EXECUTE 'CREATE VIEW public.widget_content AS SELECT * FROM public.dream_content';
  END IF;
END $$;
