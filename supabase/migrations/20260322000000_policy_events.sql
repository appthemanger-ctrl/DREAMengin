-- Migration: policy_events table
-- Stores per-user policy enforcement events logged by TheBoogieMan.Ai.
-- Used by the Policy & Safety settings page to surface the user's safety log.
--
-- AXIOM 4 — Security by Default: RLS enabled; owner-only read.
-- AXIOM 5 — Privacy by Design: only the affected user can read their own events.

CREATE TABLE IF NOT EXISTS public.policy_events (
  event_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now(),
  action         TEXT        NOT NULL,  -- e.g. 'warn', 'restrict', 'block', 'dismiss'
  rule_code      TEXT        NOT NULL,  -- e.g. 'HATE_SPEECH', 'SPAM', 'PRIVACY_VIOLATION'
  category       TEXT        NOT NULL,  -- e.g. 'content', 'privacy', 'safety'
  expiry         TIMESTAMPTZ,           -- null = permanent; future date = temporary restriction
  policy_version TEXT        NOT NULL DEFAULT '1.0',
  metadata       JSONB       NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS policy_events_user_id_idx
  ON public.policy_events (user_id, timestamp DESC);

ALTER TABLE public.policy_events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own policy events
DROP POLICY IF EXISTS "policy_events_select_own" ON public.policy_events;
CREATE POLICY "policy_events_select_own"
  ON public.policy_events FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role (TheBoogieMan backend) inserts policy events
-- No INSERT/UPDATE/DELETE policy for regular users — enforced via service role key
