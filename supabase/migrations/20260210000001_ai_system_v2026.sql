-- =====================================================
-- DREAMENGIN AI SYSTEM v2026.0 - Database Schema
-- Three-agent AI system with Boogie Man verifier
-- =====================================================

-- ============================================================================
-- USER ROLES (RBAC Foundation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user', 'admin', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert/update roles
CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- AI MEMORIES (3-Tier Memory Model)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL CHECK(agent IN ('dr_eams', 'idari')),
  scope TEXT NOT NULL CHECK(scope IN ('preferences', 'nav_habits', 'drafts')),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent, scope, key)
);

CREATE INDEX idx_ai_memories_user ON ai_memories(user_id, agent, scope);
CREATE INDEX idx_ai_memories_key ON ai_memories(user_id, key);

-- Enable RLS
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

-- Users can only access their own memories
CREATE POLICY "Users can manage own memories"
  ON ai_memories FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- IDEMPOTENCY KEYS (Write-Once Semantics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_type TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_idempotency_user ON idempotency_keys(user_id, created_at DESC);
CREATE INDEX idx_idempotency_created ON idempotency_keys(created_at);

-- Enable RLS
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own idempotency keys
CREATE POLICY "Users can view own idempotency keys"
  ON idempotency_keys FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert (via service role)
-- No UPDATE allowed - write-once semantics

-- ============================================================================
-- AI AUDIT LOG (Every Effectful Operation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  intent_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL CHECK(agent IN ('dr_eams', 'idari', 'boogieman')),
  intent_type TEXT,
  decision TEXT CHECK(decision IN ('ALLOW', 'DENY', 'CONFIRM', 'MODIFY')),
  payload_hash TEXT,
  ok BOOLEAN NOT NULL,
  error_code TEXT,
  latency_ms INTEGER,
  risk_score NUMERIC,
  reason_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_audit_request ON ai_audit_log(request_id);
CREATE INDEX idx_ai_audit_user ON ai_audit_log(user_id, created_at DESC);
CREATE INDEX idx_ai_audit_agent ON ai_audit_log(agent, created_at DESC);
CREATE INDEX idx_ai_audit_decision ON ai_audit_log(decision, created_at DESC);
CREATE INDEX idx_ai_audit_intent_type ON ai_audit_log(intent_type, created_at DESC);

-- Enable RLS
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON ai_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON ai_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert (via service role)

-- ============================================================================
-- POLICY VERSIONS (Boogie Man Policy Engine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  rules_json JSONB NOT NULL,
  weights JSONB NOT NULL, -- Risk scoring weights
  thresholds JSONB NOT NULL, -- Risk thresholds for ALLOW/CONFIRM/DENY
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_policy_versions_active ON policy_versions(active, created_at DESC);

-- Enable RLS
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active policy (for transparency)
CREATE POLICY "Anyone can view active policy"
  ON policy_versions FOR SELECT
  USING (active = TRUE);

-- Only admins can manage policies
CREATE POLICY "Admins can manage policies"
  ON policy_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- CONFIRM TOKENS (Two-Phase Commit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS confirm_tokens (
  token TEXT PRIMARY KEY,
  request_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_ids UUID[] NOT NULL,
  ui_snapshot JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_confirm_tokens_user ON confirm_tokens(user_id, created_at DESC);
CREATE INDEX idx_confirm_tokens_request ON confirm_tokens(request_id);
CREATE INDEX idx_confirm_tokens_expires ON confirm_tokens(expires_at);

-- Enable RLS
ALTER TABLE confirm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own confirm tokens
CREATE POLICY "Users can view own confirm tokens"
  ON confirm_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert/update (via service role)

-- ============================================================================
-- RATE LIMITING (Per-User Request Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, -- '/api/dr-eams/run', '/api/ai/execute', etc.
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX idx_ai_rate_limits_user ON ai_rate_limits(user_id, endpoint, window_start DESC);

-- Enable RLS
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limit status
CREATE POLICY "Users can view own rate limits"
  ON ai_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert/update (via service role)

-- ============================================================================
-- INTENT CACHE (Pending/Proposed Intents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS intent_cache (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL CHECK(agent IN ('dr_eams', 'idari')),
  intent_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  requires_confirmation BOOLEAN NOT NULL,
  rationale TEXT,
  idempotency_key TEXT,
  boogie_decision TEXT CHECK(boogie_decision IN ('ALLOW', 'DENY', 'CONFIRM', 'MODIFY')),
  risk_score NUMERIC,
  reason_code TEXT,
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_intent_cache_request ON intent_cache(request_id);
CREATE INDEX idx_intent_cache_user ON intent_cache(user_id, created_at DESC);
CREATE INDEX idx_intent_cache_expires ON intent_cache(expires_at);

-- Enable RLS
ALTER TABLE intent_cache ENABLE ROW LEVEL SECURITY;

-- Users can view their own cached intents
CREATE POLICY "Users can view own intent cache"
  ON intent_cache FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert/update (via service role)

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean up expired tokens and cache
CREATE OR REPLACE FUNCTION cleanup_expired_ai_data()
RETURNS void AS $$
BEGIN
  -- Delete expired confirm tokens
  DELETE FROM confirm_tokens WHERE expires_at < NOW();
  
  -- Delete expired intent cache
  DELETE FROM intent_cache WHERE expires_at < NOW();
  
  -- Delete old rate limit windows (> 7 days)
  DELETE FROM ai_rate_limits WHERE window_start < NOW() - INTERVAL '7 days';
  
  -- Delete old audit logs (> 90 days) - optional, adjust retention as needed
  -- DELETE FROM ai_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_ai_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- Calculate current window start (floor to window boundary)
  v_window_start := DATE_TRUNC('minute', NOW()) - 
    (EXTRACT(MINUTE FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
  
  -- Get or create rate limit record
  INSERT INTO ai_rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET 
    request_count = ai_rate_limits.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO v_current_count;
  
  -- Return TRUE if within limit, FALSE if exceeded
  RETURN v_current_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- Function to get user capabilities based on role and memberships
CREATE OR REPLACE FUNCTION get_user_capabilities(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  v_role TEXT;
  v_caps TEXT[];
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id;
  
  -- Default to 'user' if no role found
  IF v_role IS NULL THEN
    v_role := 'user';
  END IF;
  
  -- Base capabilities by role
  CASE v_role
    WHEN 'system' THEN
      v_caps := ARRAY['*']; -- System has all capabilities
    WHEN 'admin' THEN
      v_caps := ARRAY[
        'read:all',
        'write:all',
        'admin:diagnostics',
        'admin:proposals',
        'admin:moderate',
        'user:follow',
        'user:post',
        'user:dream_manage'
      ];
    ELSE -- 'user'
      v_caps := ARRAY[
        'user:follow',
        'user:post',
        'user:dream_manage'
      ];
  END CASE;
  
  -- Could extend with space memberships, ownership, etc.
  
  RETURN v_caps;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default policy version (v1.0)
INSERT INTO policy_versions (version, rules_json, weights, thresholds, active)
VALUES (
  'v1.0',
  '{
    "hard_deny_rules": [
      "intent_type_not_allowlisted",
      "admin_intent_from_user",
      "service_key_in_payload",
      "raw_sql_in_payload"
    ],
    "allowlists": {
      "dr_eams": [
        "NAV_DELTA",
        "HOME_ANCHOR_SET_STATE",
        "HOME_MENU_OPEN",
        "DREAM_PREVIEW",
        "DREAM_OPEN",
        "DREAM_CONFIG_PATCH",
        "DREAM_REORDER",
        "DREAM_ADD_FROM_PRESET",
        "DREAM_REMOVE",
        "POST_CREATE",
        "POST_LIKE",
        "FOLLOW_USER",
        "SEARCH",
        "DRAFT_SAVE"
      ],
      "idari": [
        "DIAG_SCHEMA_SNAPSHOT",
        "DIAG_RLS_SNAPSHOT",
        "DIAG_CODE_REFERENCE_SCAN",
        "DIAG_ENV_CHECKLIST",
        "ADMIN_PATCH_PROPOSAL",
        "ADMIN_MIGRATION_PROPOSAL",
        "MODERATION_FLAG_CONTENT"
      ]
    }
  }'::jsonb,
  '{
    "tries_admin": 6,
    "cross_user_target": 6,
    "destructive": 5,
    "mass_write": 4,
    "rpm_factor": 2,
    "jailbreak": 4,
    "secret_like": 4,
    "tool_override": 5,
    "external_side_effect": 4
  }'::jsonb,
  '{
    "deny": 10,
    "confirm": 6,
    "allow": 0
  }'::jsonb,
  TRUE
)
ON CONFLICT (version) DO NOTHING;

-- Seed admin user role if exists in profiles
-- This is a placeholder - actual admin assignment should be done manually
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'admin' FROM profiles WHERE handle = 'admin'
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_roles IS 'RBAC foundation - never use user_metadata for authorization';
COMMENT ON TABLE ai_memories IS 'Durable AI memory storage with RLS - agents can store preferences, habits, drafts';
COMMENT ON TABLE idempotency_keys IS 'Write-once semantics - prevents duplicate executions';
COMMENT ON TABLE ai_audit_log IS 'Every AI operation is logged here for compliance and debugging';
COMMENT ON TABLE policy_versions IS 'Versioned policy rules for Boogie Man verifier';
COMMENT ON TABLE confirm_tokens IS 'Two-phase commit tokens for CONFIRM-required intents';
COMMENT ON TABLE ai_rate_limits IS 'Per-user, per-endpoint rate limiting';
COMMENT ON TABLE intent_cache IS 'Temporary storage for proposed intents before execution';
