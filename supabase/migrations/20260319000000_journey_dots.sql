-- Journey Trail data layer
-- Stores private per-user journey dots (the "connecting the dots" narrative)
-- Architecture: docs/LAW.md §2 — nothing public by default.
-- All dots are owner-read/owner-insert only; no public SELECT ever.
-- CONSTITUTION Art. I Rule 1: private by default, projection requires explicit confirmation.

CREATE TABLE IF NOT EXISTS journey_dots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind          text NOT NULL,
  surface       text NOT NULL DEFAULT '',
  label         text NOT NULL DEFAULT '',
  significance  numeric(3,2) NOT NULL DEFAULT 0.5
                  CHECK (significance >= 0 AND significance <= 1),
  domain_color  text NOT NULL DEFAULT '#c8981a',
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Chronological query index per user (newest-first — "looking backwards")
CREATE INDEX IF NOT EXISTS idx_journey_dots_user_created
  ON journey_dots (user_id, created_at DESC);

-- Deduplication index for first-ever dot kinds
CREATE INDEX IF NOT EXISTS idx_journey_dots_user_kind
  ON journey_dots (user_id, kind);

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE journey_dots ENABLE ROW LEVEL SECURITY;

-- Users may only read their own dots — no cross-user visibility
CREATE POLICY "journey_dots_select_own"
  ON journey_dots FOR SELECT
  USING (auth.uid() = user_id);

-- Users may only insert their own dots
CREATE POLICY "journey_dots_insert_own"
  ON journey_dots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies — dots are an immutable historical record.
-- Admin service-role bypass is the only way to modify data (for GDPR deletion
-- which is handled by the ON DELETE CASCADE on auth.users).
