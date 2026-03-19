-- 20260319120000_connector_accounts_schema_reload.sql
-- Ensures connector_accounts table is present and triggers PostgREST schema reload.
-- This migration is idempotent: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── Table (idempotent) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.connector_accounts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider         text NOT NULL,
  status           text NOT NULL DEFAULT 'not_connected',
  scopes           text[] NOT NULL DEFAULT '{}',
  token_blob       jsonb NOT NULL DEFAULT '{}',
  last_verified_at timestamptz,
  last_error       text,
  last_synced_at   timestamptz,
  last_sync_count  integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT connector_accounts_status_check CHECK (
    status IN (
      'not_connected',
      'connected',
      'needs_reauth',
      'requires_approval',
      'unsupported',
      'error',
      'needs_admin_setup'
    )
  ),

  UNIQUE (user_id, provider)
);

-- ── Indexes (idempotent) ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS connector_accounts_user_id_idx
  ON public.connector_accounts (user_id);

CREATE INDEX IF NOT EXISTS connector_accounts_user_provider_idx
  ON public.connector_accounts (user_id, provider);

-- ── updated_at trigger (idempotent) ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_connector_accounts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connector_accounts_updated_at ON public.connector_accounts;
CREATE TRIGGER connector_accounts_updated_at
  BEFORE UPDATE ON public.connector_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_connector_accounts_updated_at();

-- ── Row-Level Security (idempotent) ───────────────────────────────────────

ALTER TABLE public.connector_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connector_accounts_select_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_select_own"
  ON public.connector_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_accounts_insert_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_insert_own"
  ON public.connector_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_accounts_update_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_update_own"
  ON public.connector_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_accounts_delete_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_delete_own"
  ON public.connector_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ── Notify PostgREST to reload schema cache ────────────────────────────────
-- This ensures the table appears immediately in the REST API without
-- requiring a full Supabase restart.

NOTIFY pgrst, 'reload schema';
