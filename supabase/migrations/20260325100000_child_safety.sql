-- Migration: child_safety_incidents + child_safety_hash_registry tables
-- Zero-tolerance child safety enforcement for TheBoogieMan.Ai
--
-- AXIOM 4 — Security by Default: RLS enabled; no user access to these tables.
-- AXIOM 5 — Privacy by Design: only service role may read/write.
-- Append-only: no DELETE policy; incidents are permanent records.
--
-- Referenced by:
--   lib/child-safety/ncmecReporter.ts
--   app/api/ai/boogieman/child-safety/route.ts
--   app/api/admin/child-safety/route.ts

-- ============================================================================
-- child_safety_incidents
-- Append-only audit trail for every CSAM / grooming detection.
-- Each row corresponds to one TheBoogieMan enforcement event.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.child_safety_incidents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Accused account
  reported_user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Account that submitted the report (null = auto-detected by BoogieMan)
  reporter_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Detection metadata
  rule_code         TEXT        NOT NULL CHECK (rule_code IN ('C22_CSAM', 'C31_GROOMING')),
  category          TEXT        NOT NULL CHECK (category IN ('CSAM', 'GROOMING')),
  severity          NUMERIC(4,3) NOT NULL CHECK (severity BETWEEN 0 AND 1),
  confidence        NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  signal_count      INTEGER     NOT NULL DEFAULT 0,
  hash_match        BOOLEAN     NOT NULL DEFAULT false,

  -- Content location (opaque references — raw content is never stored here)
  surface           TEXT        NOT NULL, -- 'post' | 'message' | 'comment' | 'profile' | 'upload'
  content_ref       TEXT        NOT NULL, -- post_id, message_id, etc.
  content_hash      TEXT,                 -- SHA-256 of offending content (optional)
  client_ip         TEXT,                 -- submitting client IP (for NCMEC report)

  -- Lifecycle
  status            TEXT        NOT NULL DEFAULT 'PENDING_REVIEW'
                    CHECK (status IN (
                      'PENDING_REVIEW',
                      'NCMEC_SUBMITTED',
                      'NCMEC_SUBMISSION_FAILED',
                      'REVIEWED_ACTIONED',
                      'REVIEWED_DISMISSED'
                    )),
  reported_at       TIMESTAMPTZ,          -- when NCMEC submission was made
  ncmec_report_id   TEXT,                 -- NCMEC CyberTipline report ID (if submitted)
  ncmec_error       TEXT,                 -- error detail if NCMEC submission failed

  -- Admin notes
  reviewer_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes    TEXT
);

-- Fast lookup by user (for per-user strike history)
CREATE INDEX IF NOT EXISTS child_safety_incidents_user_idx
  ON public.child_safety_incidents (reported_user_id, created_at DESC);

-- Fast lookup by status (for admin review queue)
CREATE INDEX IF NOT EXISTS child_safety_incidents_status_idx
  ON public.child_safety_incidents (status, created_at DESC);

-- Fast lookup by rule code (for CSAM vs grooming dashboards)
CREATE INDEX IF NOT EXISTS child_safety_incidents_rule_idx
  ON public.child_safety_incidents (rule_code, created_at DESC);

-- RLS: no end-user access; only service role can read/write
ALTER TABLE public.child_safety_incidents ENABLE ROW LEVEL SECURITY;

-- Admins may read (for review queue UI)
DROP POLICY IF EXISTS "child_safety_incidents_admin_select" ON public.child_safety_incidents;
CREATE POLICY "child_safety_incidents_admin_select"
  ON public.child_safety_incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'owner')
    )
  );

-- Admins may update status / reviewer_notes (for review workflow)
DROP POLICY IF EXISTS "child_safety_incidents_admin_update" ON public.child_safety_incidents;
CREATE POLICY "child_safety_incidents_admin_update"
  ON public.child_safety_incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'owner')
    )
  );

-- No INSERT policy for users — only service role inserts via backend
-- No DELETE policy — incidents are permanent records

-- ============================================================================
-- child_safety_hash_registry
-- Known-bad SHA-256 content hashes loaded from NCMEC / industry sources.
-- These are NEVER the actual CSAM files — only cryptographic hashes.
-- Loaded by admins via /api/admin/child-safety/hashes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.child_safety_hash_registry (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- SHA-256 hex hash of the known-bad content
  hash_sha256  TEXT        NOT NULL UNIQUE,

  -- Source of the hash (e.g. 'NCMEC', 'IWF', 'INHOPE', 'internal')
  source       TEXT        NOT NULL DEFAULT 'NCMEC',

  -- Content type the hash identifies
  content_type TEXT        NOT NULL DEFAULT 'image' CHECK (content_type IN ('image', 'video', 'audio', 'file')),

  -- Admin who added this entry
  added_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Optional notes (e.g. case reference, batch ID) — no content description
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS child_safety_hash_registry_hash_idx
  ON public.child_safety_hash_registry (hash_sha256);

ALTER TABLE public.child_safety_hash_registry ENABLE ROW LEVEL SECURITY;

-- Only admins/owners may read the hash registry
DROP POLICY IF EXISTS "child_safety_hash_registry_admin_select" ON public.child_safety_hash_registry;
CREATE POLICY "child_safety_hash_registry_admin_select"
  ON public.child_safety_hash_registry FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'owner')
    )
  );

-- Only admins/owners may insert hashes
DROP POLICY IF EXISTS "child_safety_hash_registry_admin_insert" ON public.child_safety_hash_registry;
CREATE POLICY "child_safety_hash_registry_admin_insert"
  ON public.child_safety_hash_registry FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'owner')
    )
  );

-- No DELETE — hashes are permanent
-- No user access whatsoever
