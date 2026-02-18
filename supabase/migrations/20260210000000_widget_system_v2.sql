-- =====================================================
-- Widget System V2 - Maximum Technical Hosting Spec
-- Separates WidgetDefinition (identity + behavior) from WidgetInstance (placement + transform)
-- Implements Feed as a bindable host mode with SELF/FOLLOW scopes
-- =====================================================

-- =====================================================
-- 1. WIDGET DEFINITIONS (immutable identity + bindable behavior)
-- =====================================================

CREATE TABLE IF NOT EXISTS widget_definitions (
  widget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  host_kind SMALLINT NOT NULL, -- uint16: HOST_FEED_VIEW=1, HOST_COMPOSITE=2, etc.
  host_config JSONB NOT NULL DEFAULT '{}', -- validated, canonicalized config
  settings JSONB NOT NULL DEFAULT '{}', -- validated, canonicalized settings
  policy INTEGER NOT NULL DEFAULT 0, -- uint32 flags: placement, permissions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_widget_definitions_owner ON widget_definitions(owner_id, updated_at DESC);
CREATE INDEX idx_widget_definitions_host_kind ON widget_definitions(host_kind);

-- =====================================================
-- 2. WIDGET INSTANCES (placement + transform + presentation)
-- =====================================================

-- Drop old widget_instances if it exists and recreate with new schema
DROP TABLE IF EXISTS widget_instances CASCADE;

CREATE TABLE widget_instances (
  instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES widget_definitions(widget_id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Surface placement
  surface SMALLINT NOT NULL, -- uint8 enum: HOME=0, FACE=1, PROFILE=2, DOCK=3
  surface_key INTEGER NOT NULL DEFAULT 0, -- faceIndex or profileSpaceId or 0 for home
  slot_index SMALLINT NOT NULL DEFAULT -1, -- 0..7 for slotted surfaces, -1 for free placement
  
  -- Presentation and transform
  presentation SMALLINT NOT NULL DEFAULT 0, -- uint8 enum: TILE=0, WINDOW=1, DOCKED=2, FULL=3
  transform_x REAL NOT NULL DEFAULT 0,
  transform_y REAL NOT NULL DEFAULT 0,
  transform_scale REAL NOT NULL DEFAULT 1,
  transform_rotation REAL NOT NULL DEFAULT 0,
  transform_opacity REAL NOT NULL DEFAULT 1,
  
  -- Z-ordering and focus
  z_index INTEGER NOT NULL DEFAULT 0,
  focus_rank INTEGER NOT NULL DEFAULT 0,
  
  -- Runtime state
  runtime_flags INTEGER NOT NULL DEFAULT 0, -- uint32
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: slot_index valid for slotted surfaces
  CONSTRAINT valid_slot_index CHECK (
    (slot_index >= -1 AND slot_index <= 7)
  ),
  
  -- Constraint: transform values within bounds
  CONSTRAINT valid_transform_opacity CHECK (transform_opacity >= 0 AND transform_opacity <= 1),
  CONSTRAINT valid_transform_scale CHECK (transform_scale > 0 AND transform_scale <= 10)
);

CREATE INDEX idx_widget_instances_owner ON widget_instances(owner_id, surface, z_index DESC);
CREATE INDEX idx_widget_instances_widget ON widget_instances(widget_id);
CREATE INDEX idx_widget_instances_surface ON widget_instances(surface, surface_key);

-- =====================================================
-- 3. HOST KIND CONSTANTS (documented in code)
-- =====================================================

-- Host kinds are defined as constants in the application:
-- HOST_FEED_VIEW = 1
-- HOST_COMPOSITE = 2
-- (Additional host kinds can be added as needed)

-- =====================================================
-- 4. FEED SCOPE VERIFICATION FUNCTION
-- =====================================================

-- Function to verify FOLLOW scope relationship
-- Returns TRUE if user can access target's feed, FALSE otherwise
CREATE OR REPLACE FUNCTION verify_follow_scope(
  p_owner_id UUID,
  p_target_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- SELF scope: owner can always view their own feed
  IF p_owner_id = p_target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- FOLLOW scope: verify relationship exists
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_owner_id
    AND followed_id = p_target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FEED HOST CONFIG VALIDATION
-- =====================================================

-- Function to normalize and validate feed host config
CREATE OR REPLACE FUNCTION normalize_feed_host_config(
  p_config JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_scope SMALLINT;
  v_target_user_id UUID;
  v_normalized JSONB;
BEGIN
  -- Extract and validate scope (default to SELF=0)
  v_scope := COALESCE((p_config->>'scope')::SMALLINT, 0);
  
  -- Validate scope is either SELF=0 or FOLLOW=1
  IF v_scope NOT IN (0, 1) THEN
    v_scope := 0; -- Default to SELF if invalid
  END IF;
  
  -- Extract target_user_id
  v_target_user_id := (p_config->>'target_user_id')::UUID;
  
  -- Enforce: target_user_id must be null if scope is SELF
  IF v_scope = 0 THEN
    v_target_user_id := NULL;
  END IF;
  
  -- Build normalized config
  v_normalized := jsonb_build_object(
    'scope', v_scope,
    'target_user_id', v_target_user_id,
    'filters', COALESCE(p_config->'filters', '{}'::jsonb),
    'sort', COALESCE((p_config->>'sort')::SMALLINT, 0), -- RECENT=0 default
    'limit', LEAST(GREATEST(COALESCE((p_config->>'limit')::SMALLINT, 25), 5), 200), -- clamp 5-200
    'realtime', COALESCE((p_config->>'realtime')::BOOLEAN, true),
    'include_media', COALESCE((p_config->>'include_media')::BOOLEAN, true),
    'include_reposts', COALESCE((p_config->>'include_reposts')::BOOLEAN, false)
  );
  
  RETURN v_normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. TRIGGER TO AUTO-NORMALIZE HOST CONFIG
-- =====================================================

CREATE OR REPLACE FUNCTION normalize_widget_definition_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Only normalize for HOST_FEED_VIEW (host_kind = 1)
  IF NEW.host_kind = 1 THEN
    NEW.host_config := normalize_feed_host_config(NEW.host_config);
  END IF;
  
  -- Update timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_config_on_insert
  BEFORE INSERT ON widget_definitions
  FOR EACH ROW
  EXECUTE FUNCTION normalize_widget_definition_config();

CREATE TRIGGER normalize_config_on_update
  BEFORE UPDATE ON widget_definitions
  FOR EACH ROW
  EXECUTE FUNCTION normalize_widget_definition_config();

-- =====================================================
-- 7. TRIGGER TO UPDATE widget_instances timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_widget_instance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instance_timestamp
  BEFORE UPDATE ON widget_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_instance_timestamp();

-- =====================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE widget_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_instances ENABLE ROW LEVEL SECURITY;

-- Widget Definitions: Users can view their own
CREATE POLICY "Users can view own widget definitions"
  ON widget_definitions FOR SELECT
  USING (auth.uid() = owner_id);

-- Widget Definitions: Users can create their own
CREATE POLICY "Users can create own widget definitions"
  ON widget_definitions FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Widget Definitions: Users can update their own
CREATE POLICY "Users can update own widget definitions"
  ON widget_definitions FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Widget Definitions: Users can delete their own
CREATE POLICY "Users can delete own widget definitions"
  ON widget_definitions FOR DELETE
  USING (auth.uid() = owner_id);

-- Widget Instances: Users can view their own
CREATE POLICY "Users can view own widget instances"
  ON widget_instances FOR SELECT
  USING (auth.uid() = owner_id);

-- Widget Instances: Users can create their own
CREATE POLICY "Users can create own widget instances"
  ON widget_instances FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Widget Instances: Users can update their own
CREATE POLICY "Users can update own widget instances"
  ON widget_instances FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Widget Instances: Users can delete their own
CREATE POLICY "Users can delete own widget instances"
  ON widget_instances FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- 9. DEFAULT FEED WIDGET FOR NEW USERS
-- =====================================================

-- Function to create default feed widget for new users
CREATE OR REPLACE FUNCTION create_default_feed_widget()
RETURNS TRIGGER AS $$
DECLARE
  v_widget_id UUID;
BEGIN
  -- Create default feed widget definition
  INSERT INTO widget_definitions (
    owner_id,
    name,
    host_kind,
    host_config,
    policy
  ) VALUES (
    NEW.id,
    'My Feed',
    1, -- HOST_FEED_VIEW
    jsonb_build_object(
      'scope', 0, -- SELF
      'target_user_id', NULL,
      'filters', '{}'::jsonb,
      'sort', 0, -- RECENT
      'limit', 25,
      'realtime', true,
      'include_media', true,
      'include_reposts', false
    ),
    0 -- Default policy
  ) RETURNING widget_id INTO v_widget_id;
  
  -- Create default widget instance on HOME surface
  INSERT INTO widget_instances (
    widget_id,
    owner_id,
    surface,
    surface_key,
    slot_index,
    presentation,
    transform_x,
    transform_y,
    transform_scale,
    transform_rotation,
    transform_opacity,
    z_index
  ) VALUES (
    v_widget_id,
    NEW.id,
    0, -- HOME
    0,
    -1, -- Free placement
    0, -- TILE
    0,
    0,
    1,
    0,
    1,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default feed widget for new users
DROP TRIGGER IF EXISTS create_default_widgets ON profiles;
CREATE TRIGGER create_default_widgets
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_feed_widget();

-- =====================================================
-- 10. FEED RESOLVER VIEW (for efficient queries)
-- =====================================================

-- View to resolve feed items for widgets
CREATE OR REPLACE VIEW widget_feed_items AS
SELECT
  wi.instance_id,
  wi.widget_id,
  wi.owner_id,
  wd.host_config,
  fi.id as item_id,
  fi.user_id as author_id,
  fi.ts as created_at,
  fi.title,
  fi.summary as text_preview,
  fi.url,
  fi.media_json,
  fi.tags_json,
  fi.visibility,
  fi.importance_score
FROM widget_instances wi
JOIN widget_definitions wd ON wi.widget_id = wd.widget_id
JOIN feed_items fi ON (
  -- SELF scope: owner's own feed items
  (wd.host_config->>'scope')::SMALLINT = 0 AND fi.user_id = wi.owner_id
  OR
  -- FOLLOW scope: followed user's feed items
  (
    (wd.host_config->>'scope')::SMALLINT = 1 
    AND fi.user_id = (wd.host_config->>'target_user_id')::UUID
    AND verify_follow_scope(wi.owner_id, (wd.host_config->>'target_user_id')::UUID)
  )
)
WHERE wd.host_kind = 1 -- HOST_FEED_VIEW only
  AND wi.owner_id = auth.uid(); -- RLS: only current user's widgets

-- Grant access to the view
GRANT SELECT ON widget_feed_items TO authenticated;
