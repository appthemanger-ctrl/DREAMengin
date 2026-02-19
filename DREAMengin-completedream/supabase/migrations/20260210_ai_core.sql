-- Migration: AI Core Infrastructure
-- Created: 2026-02-10
-- Description: Add user_roles, audit_log, idempotency, memories, and rate limiting tables

-- ============================================================================
-- 1. USER ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role queries
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- RLS policies for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles
CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 2. IS_ADMIN() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 3. ADMIN AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON public.admin_audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action, created_at DESC);

-- RLS policies for audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit entries
CREATE POLICY admin_audit_log_select_own ON public.admin_audit_log
  FOR SELECT
  USING (auth.uid() = actor_user_id);

-- Admins can read all audit entries
CREATE POLICY admin_audit_log_select_admin ON public.admin_audit_log
  FOR SELECT
  USING (public.is_admin());

-- System/authenticated users can insert (for logging)
CREATE POLICY admin_audit_log_insert ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = actor_user_id);

-- ============================================================================
-- 4. IDEMPOTENCY KEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON public.idempotency_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user ON public.idempotency_keys(user_id);

-- RLS policies for idempotency_keys
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own keys
CREATE POLICY idempotency_keys_own ON public.idempotency_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. AI MEMORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL CHECK (agent IN ('dr_eams', 'idari', 'boogieman')),
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index on (user_id, agent, scope, key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_memories_unique ON public.ai_memories(user_id, agent, scope, key);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_ai_memories_user_agent ON public.ai_memories(user_id, agent);

-- RLS policies for ai_memories
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own memories
CREATE POLICY ai_memories_own ON public.ai_memories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all memories
CREATE POLICY ai_memories_admin_read ON public.ai_memories
  FOR SELECT
  USING (public.is_admin());

-- ============================================================================
-- 6. RATE LIMIT COUNTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_window ON public.rate_limit_counters(window_start);

-- No RLS on rate_limit_counters - it's managed by security definer functions

-- ============================================================================
-- 7. RATE_LIMIT_HIT() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rate_limit_hit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
  v_allowed BOOLEAN;
  v_rpm INTEGER;
  v_retry_after INTEGER;
BEGIN
  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_key));
  
  -- Calculate window start (align to window_seconds boundaries)
  v_window_start := date_trunc('minute', v_now) - 
    (EXTRACT(EPOCH FROM date_trunc('minute', v_now))::INTEGER % p_window_seconds || ' seconds')::INTERVAL;
  
  -- Get or create counter
  INSERT INTO public.rate_limit_counters (key, window_start, count, updated_at)
  VALUES (p_key, v_window_start, 1, v_now)
  ON CONFLICT (key) DO UPDATE
  SET 
    count = CASE
      WHEN rate_limit_counters.window_start = v_window_start THEN rate_limit_counters.count + 1
      ELSE 1
    END,
    window_start = v_window_start,
    updated_at = v_now
  RETURNING count INTO v_count;
  
  -- Check if allowed
  v_allowed := v_count <= p_limit;
  
  -- Calculate RPM (requests per minute)
  v_rpm := ROUND((v_count::FLOAT / p_window_seconds) * 60)::INTEGER;
  
  -- Calculate retry_after in seconds (time until window ends)
  v_retry_after := GREATEST(0, EXTRACT(EPOCH FROM (v_window_start + (p_window_seconds || ' seconds')::INTERVAL - v_now))::INTEGER);
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'rpm', v_rpm,
    'retry_after_seconds', v_retry_after
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- 8. CLEANUP FUNCTION (Optional - for periodic cleanup)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limit_counters
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- 9. CLEANUP FUNCTION FOR IDEMPOTENCY KEYS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_idempotency_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete keys older than 24 hours
  DELETE FROM public.idempotency_keys
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_roles IS 'DB-backed user role assignments for admin checks';
COMMENT ON TABLE public.admin_audit_log IS 'Audit log for admin actions and AI system operations';
COMMENT ON TABLE public.idempotency_keys IS 'Prevents duplicate intent execution';
COMMENT ON TABLE public.ai_memories IS 'Agent memory storage for personalization';
COMMENT ON TABLE public.rate_limit_counters IS 'Sliding window rate limiting counters';
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user is admin';
COMMENT ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) IS 'Sliding window rate limiter with advisory locks';
