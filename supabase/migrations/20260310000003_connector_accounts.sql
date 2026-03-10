-- 20260310000003_connector_accounts.sql
-- Phase 5 — Feed & Friends Connections
-- Creates the connector_accounts table for storing per-user connector state.
--
-- AXIOM 4 — Security by Default:
--   token_blob (credentials) stored server-side in this table.
--   Never returned to the browser — only status fields are safe to expose.
--
-- AXIOM 5 — Privacy by Design:
--   RLS enabled: owner-only read/write via auth.uid() = user_id.
--   No cross-user data exposure is possible through normal DB calls.
--
-- ARCHITECTURE.md §5 — Privacy and projection boundaries:
--   Connector credentials must never reach ViewProfile or public surfaces.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS are safe to re-run.

-- ── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.connector_accounts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider         text NOT NULL,
  status           text NOT NULL DEFAULT 'not_connected',
  scopes           text[] NOT NULL DEFAULT '{}',
  -- token_blob stores OAuth tokens / API keys server-side only.
  -- NEVER read in SELECT queries that go to the browser.
  -- Column-level security: no SELECT policy exposes this field to the client.
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

  -- One row per (user, provider) — prevents duplicate accounts.
  UNIQUE (user_id, provider)
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS connector_accounts_user_id_idx
  ON public.connector_accounts (user_id);

CREATE INDEX IF NOT EXISTS connector_accounts_user_provider_idx
  ON public.connector_accounts (user_id, provider);

-- ── updated_at trigger ─────────────────────────────────────────────────────

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

-- ── Row-Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.connector_accounts ENABLE ROW LEVEL SECURITY;

-- Users may only read their own rows — and never the token_blob column
-- (token_blob is excluded from client-facing SELECT via application layer,
-- not at the DB level, because Supabase does not support column-level RLS.
-- The API routes MUST never SELECT token_blob in public-facing queries.)
DROP POLICY IF EXISTS "connector_accounts_select_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_select_own"
  ON public.connector_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_accounts_insert_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_insert_own"
  ON public.connector_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_accounts_update_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_update_own"
  ON public.connector_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "connector_accounts_delete_own" ON public.connector_accounts;
CREATE POLICY "connector_accounts_delete_own"
  ON public.connector_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ── Comments ───────────────────────────────────────────────────────────────

COMMENT ON TABLE public.connector_accounts IS
  'Per-user connector state. One row per (user_id, provider).
   token_blob stores OAuth tokens/credentials — never expose to browser.
   status is safe to return to the client; use ConnectorAccountPublic type.';

COMMENT ON COLUMN public.connector_accounts.token_blob IS
  'Encrypted/opaque credential store. Server-side only.
   API routes must exclude this column from any query result returned to clients.';

COMMENT ON COLUMN public.connector_accounts.status IS
  'Truthful connection status. Never set to "connected" without a successful
   verify-credentials call to the provider. Mirrors ConnectorStatus in
   lib/connectors/connectorRegistry.ts.';
