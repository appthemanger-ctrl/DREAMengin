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

CREATE OR REPLACE FUNCTION public.swap_user_dream_runtimes(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changed_count INTEGER := 0;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.dream_instances
    SET surface = CASE
      WHEN surface = 0 THEN 1
      WHEN surface = 1 THEN 0
      ELSE surface
    END,
    updated_at = NOW()
  WHERE owner_id = p_user_id
    AND surface IN (0, 1);

  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_layout JSONB NOT NULL DEFAULT
    '{"home":{"dreams":[]},"dreamspace":{"dreams":[]},"hidden":[]}'::jsonb;

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
    EXECUTE 'CREATE VIEW public.widget_instances WITH (security_invoker=true) AS SELECT * FROM public.dream_instances';
  END IF;

  IF to_regclass('public.dream_definitions') IS NOT NULL
     AND to_regclass('public.widget_definitions') IS NULL THEN
    EXECUTE 'CREATE VIEW public.widget_definitions WITH (security_invoker=true) AS SELECT * FROM public.dream_definitions';
  END IF;

  IF to_regclass('public.dream_content') IS NOT NULL
     AND to_regclass('public.widget_content') IS NULL THEN
    EXECUTE 'CREATE VIEW public.widget_content WITH (security_invoker=true) AS SELECT * FROM public.dream_content';
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dream_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dream_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dream_content TO authenticated;
GRANT SELECT ON public.widget_instances TO authenticated;
GRANT SELECT ON public.widget_definitions TO authenticated;
GRANT SELECT ON public.widget_content TO authenticated;
