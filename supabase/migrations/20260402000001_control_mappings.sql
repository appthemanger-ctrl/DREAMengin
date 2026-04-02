-- supabase/migrations/20260402000001_control_mappings.sql
--
-- Control Mappings: joystick / input → asset command bindings
--
-- Stores per-asset input mappings that connect a physical input source
-- (e.g. 'left_joystick') to a command target (e.g. 'rotate_x', 'move_forward').
--
-- Security: Row-Level Security enforces owner-only read/write.

CREATE TABLE IF NOT EXISTS control_mappings (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id       UUID        NOT NULL,
  input_source   TEXT        NOT NULL,
  command_target TEXT        NOT NULL,
  sensitivity    NUMERIC     NOT NULL DEFAULT 1.0,
  owner_id       UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, asset_id, input_source)
);

CREATE INDEX IF NOT EXISTS idx_control_mappings_asset
  ON control_mappings(asset_id);

CREATE INDEX IF NOT EXISTS idx_control_mappings_owner
  ON control_mappings(owner_id, created_at DESC);

ALTER TABLE control_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "control_mappings_owner_select"
  ON control_mappings FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "control_mappings_owner_insert"
  ON control_mappings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "control_mappings_owner_update"
  ON control_mappings FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "control_mappings_owner_delete"
  ON control_mappings FOR DELETE
  USING (auth.uid() = owner_id);
