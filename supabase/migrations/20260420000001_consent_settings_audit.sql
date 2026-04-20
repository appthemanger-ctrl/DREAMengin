-- Pass 7: Consent + Settings + Audit tables
-- Architecture: docs/ARCHITECTURE.md §7 (Pass 7 — consent + settings + audit)
-- Decision #7 from COOP_AND_SOLO_ROADMAP.md:
--   auto-accept for in-session peers, prompt outside-session.

-- ── dream_consent ─────────────────────────────────────────────────────────────
-- Per-user content/network consent decisions.
-- Rows are upserted on every consent change from the ConsentManager.

CREATE TABLE IF NOT EXISTS public.dream_consent (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain      text NOT NULL,                -- ConsentDomain value
  decision    text NOT NULL CHECK (decision IN ('granted', 'denied', 'prompt')),
  decided_at  timestamptz NOT NULL DEFAULT now(),
  session_id  text,                         -- runtimeChannel session ID, nullable
  UNIQUE (user_id, domain)
);

-- Row-level security: users can only read/write their own rows.
ALTER TABLE public.dream_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dream_consent_self" ON public.dream_consent
  FOR ALL USING (auth.uid() = user_id);

-- ── dream_settings ────────────────────────────────────────────────────────────
-- Per-user feature settings (key/value pairs).
-- Mirrors the ConsentManager._settings in-memory map.

CREATE TABLE IF NOT EXISTS public.dream_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key         text NOT NULL,
  value       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

ALTER TABLE public.dream_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dream_settings_self" ON public.dream_settings
  FOR ALL USING (auth.uid() = user_id);

-- ── dream_audit_log ───────────────────────────────────────────────────────────
-- Immutable log of consent changes and co-op actions.
-- No UPDATE or DELETE allowed — only INSERT via RLS.

CREATE TABLE IF NOT EXISTS public.dream_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type      text NOT NULL CHECK (event_type IN (
                    'consent_change', 'coop_action', 'transfer', 'setting_change'
                  )),
  domain          text,
  previous_value  text,
  new_value       text,
  session_id      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dream_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own audit rows; nobody can update or delete.
CREATE POLICY "dream_audit_insert" ON public.dream_audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dream_audit_select" ON public.dream_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_dream_consent_user ON public.dream_consent (user_id);
CREATE INDEX IF NOT EXISTS idx_dream_settings_user ON public.dream_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_dream_audit_user ON public.dream_audit_log (user_id, created_at DESC);
