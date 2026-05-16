-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: agent_sessions + forge_rate_limits
-- Replaces in-memory Maps with persistent Supabase tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- Agent sessions (CodeEngin AI co-pilot)
-- Previously stored in a server-side Map — lost on every cold start.
CREATE TABLE IF NOT EXISTS agent_sessions (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL DEFAULT '{}',
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically clean up expired sessions
CREATE INDEX IF NOT EXISTS agent_sessions_expires_at_idx ON agent_sessions(expires_at);

-- RLS: users can only see their own sessions; service role bypasses for server-side ops
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own agent sessions"
  ON agent_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Forge rate limits
-- Prevents more than 1 ForgeEngin build per day per user/IP.
-- Previously stored in a server-side Map — reset on every Vercel cold start.
CREATE TABLE IF NOT EXISTS forge_rate_limits (
  token       TEXT  PRIMARY KEY,  -- IP or x-build-token header
  built_date  DATE  NOT NULL DEFAULT CURRENT_DATE
);

-- RLS: service role only (server-side reads/writes)
ALTER TABLE forge_rate_limits ENABLE ROW LEVEL SECURITY;

-- No user-facing SELECT — all access is via the service-role key
-- (no policies needed; the service role bypasses RLS)
