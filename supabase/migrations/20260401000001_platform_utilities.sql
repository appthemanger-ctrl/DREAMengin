-- supabase/migrations/20260401000001_platform_utilities.sql
--
-- Platform Utilities: Physics Telemetry + Global Association Layer (GAL)
--
-- Changes:
--   1. Adds performance_metrics JSONB column to physics_experiments for WASM
--      tick telemetry snapshots (logPhysicsExperiment).
--   2. Creates the global_registry table — the GAL hub that connects every
--      platform object to every other ("Everything to Everything").
--
-- Security: all tables use Row-Level Security.
-- Architecture: docs/ARCHITECTURE.md §3 — logic layer backed by Supabase.

-- ── 1. Physics Experiments: telemetry snapshot column ────────────────────────

ALTER TABLE physics_experiments
  ADD COLUMN IF NOT EXISTS performance_metrics JSONB;

-- ── 2. Global Registry (GAL) ─────────────────────────────────────────────────
--
-- Records every platform object so it can be associated with any other object.
-- object_type  — e.g. 'post', 'experiment', 'music', 'game', 'widget'
-- internal_id  — UUID of the object in its native table
-- label        — human-readable identifier (handle, title, name, etc.)
-- owner_id     — profile that owns / created the object

CREATE TABLE IF NOT EXISTS global_registry (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type  TEXT        NOT NULL,
  internal_id  TEXT        NOT NULL,
  label        TEXT        NOT NULL,
  owner_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (object_type, internal_id)
);

CREATE INDEX IF NOT EXISTS idx_global_registry_owner
  ON global_registry(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_global_registry_type
  ON global_registry(object_type, created_at DESC);

ALTER TABLE global_registry ENABLE ROW LEVEL SECURITY;

-- Owners can read their own registry entries; admins can read all.
CREATE POLICY "global_registry_owner_select"
  ON global_registry FOR SELECT
  USING (auth.uid() = owner_id);

-- Only the authenticated user may insert entries they own.
CREATE POLICY "global_registry_owner_insert"
  ON global_registry FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners may update their own entries.
CREATE POLICY "global_registry_owner_update"
  ON global_registry FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners may delete their own entries.
CREATE POLICY "global_registry_owner_delete"
  ON global_registry FOR DELETE
  USING (auth.uid() = owner_id);
