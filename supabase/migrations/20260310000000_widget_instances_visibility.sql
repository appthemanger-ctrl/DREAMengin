-- 20260310000000_widget_instances_visibility.sql
-- IDARi Batch 4: Add per-instance visibility column to widget_instances.
--
-- AXIOM 4 — Security by Default:
--   Default is 'private' — nothing public unless the user explicitly sets it
--   (LAW.md §2: nothing is public by default).
--   Existing UPDATE RLS policy "widget_instances_update" already uses
--   USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id),
--   so the new column is automatically covered — no extra policy needed.
--
-- AXIOM 5 — Privacy by Design:
--   The column is NOT NULL with default 'private' so new rows are always
--   private unless the user actively promotes them.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe to re-run.

ALTER TABLE public.widget_instances
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CONSTRAINT widget_instances_visibility_check
      CHECK (visibility IN ('private', 'public', 'followers'));

-- Back-fill any existing rows (covers rows added before this migration).
UPDATE public.widget_instances
  SET visibility = 'private'
  WHERE visibility IS NULL;

COMMENT ON COLUMN public.widget_instances.visibility IS
  'Audience tier for this widget instance on the profile output surface.
   private   → hidden from public ViewProfile (default)
   public    → visible to everyone ("everyone" in the shell UI)
   followers → visible only to confirmed followers ("followers-only" in the shell UI)
   Maps to WidgetShellVisibilityTier via tierToDbVisibility() in types/widgets.ts.';
