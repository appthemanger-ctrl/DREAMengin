-- supabase/migrations/20260402000002_game_assets.sql
--
-- Game Assets: Wasm-generated 3D mesh, rig, and DNA blobs
--
-- Stores assets produced by the Wasm engine (mesh + rig binary blobs and
-- config DNA) when a user "scans" an image in Create Daydream.
--
-- An AFTER INSERT trigger automatically registers every new asset in the
-- global_registry table so DreamDMBar and the GAL can discover it.
--
-- Security: Row-Level Security enforces owner-only read/write.

CREATE TABLE IF NOT EXISTS game_assets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label            TEXT        NOT NULL,
  source_image_url TEXT,
  asset_type       TEXT        NOT NULL DEFAULT 'mechanical',
  config_dna       JSONB,
  wasm_mesh_data   BYTEA,
  wasm_rig_data    BYTEA,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_assets_owner
  ON game_assets(owner_id, created_at DESC);

ALTER TABLE game_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_assets_owner_select"
  ON game_assets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "game_assets_owner_insert"
  ON game_assets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "game_assets_owner_update"
  ON game_assets FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "game_assets_owner_delete"
  ON game_assets FOR DELETE
  USING (auth.uid() = owner_id);

-- ── Global Registry trigger ───────────────────────────────────────────────────
-- Automatically registers each new game_asset in global_registry so the GAL
-- and DreamDMBar can discover it without a manual second insert.

CREATE OR REPLACE FUNCTION register_game_asset()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO global_registry (object_type, internal_id, label, owner_id)
  VALUES ('game_asset', NEW.id::TEXT, NEW.label, NEW.owner_id)
  ON CONFLICT (object_type, internal_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_register_game_asset
  AFTER INSERT ON game_assets
  FOR EACH ROW
  EXECUTE FUNCTION register_game_asset();
