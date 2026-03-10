-- 20260310000001_profiles_widget_config.sql
-- Store profile widget layout + visibility as a simple JSONB column on profiles.
-- Avoids coupling to the complex V2 widget_instances placement system.
-- Privacy: nothing in widget_config is public by default — the ViewProfile page
--          reads it and filters to visibility != 'private' at render time.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS widget_config JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.widget_config IS
  'Ordered list of ProfileWidgetGrid Widget objects with visibility tier.
   Shape: [{ id: string, type: string, size?: string, config?: object, visibility?: "private"|"public"|"followers" }]
   Default is an empty list (no widgets configured).
   ViewProfile renders only items where visibility != "private".';

-- Also add missing columns used by the profile editor (banner, location, website).
-- These were used in the API but never formally migrated.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url  TEXT,
  ADD COLUMN IF NOT EXISTS location    TEXT,
  ADD COLUMN IF NOT EXISTS website     TEXT;
