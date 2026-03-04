-- =====================================================
-- DREAMengin Enhanced Schema Upgrade
-- Adds: Revenue Sharing, Physics Lab, Profile Images
-- =====================================================

-- Add avatar storage and profile enhancements
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_storage_path TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS creator_tier TEXT DEFAULT 'standard', -- standard, pro, elite
ADD COLUMN IF NOT EXISTS revenue_share_override NUMERIC; -- optional custom revenue share

-- Revenue sharing configuration table
CREATE TABLE IF NOT EXISTS revenue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_share NUMERIC DEFAULT 0.15, -- 15% platform, 85% creator
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default revenue config
INSERT INTO revenue_config (platform_share) 
VALUES (0.15) 
ON CONFLICT DO NOTHING;

-- Creator earnings tracking
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- ad_revenue, merch_sale, music_sale, tip
  source_id UUID, -- reference to ad_order, merch sale, etc.
  gross_amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processed, paid
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id, created_at DESC);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);

-- Physics Lab: Experiments table
CREATE TABLE IF NOT EXISTS physics_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  methodology JSONB, -- structured experiment design
  parameters JSONB, -- CCC parameters: layers, coherence thresholds, etc.
  visibility TEXT DEFAULT 'private', -- private, public, collaborative
  status TEXT DEFAULT 'draft', -- draft, running, completed, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_physics_experiments_creator ON physics_experiments(creator_id, created_at DESC);
CREATE INDEX idx_physics_experiments_status ON physics_experiments(status);

-- Physics Lab: Experiment runs (simulations/tests)
CREATE TABLE IF NOT EXISTS experiment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES physics_experiments(id) ON DELETE CASCADE,
  run_number INTEGER NOT NULL,
  input_data JSONB, -- initial conditions
  output_data JSONB, -- results
  metrics JSONB, -- coherence scores, entropy measures, etc.
  visualization_data JSONB, -- data for charts/graphs
  duration_ms INTEGER,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_experiment_runs_experiment ON experiment_runs(experiment_id, run_number DESC);

-- Physics Lab: Collaborative workspace
CREATE TABLE IF NOT EXISTS experiment_collaborators (
  experiment_id UUID REFERENCES physics_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer', -- viewer, contributor, co-owner
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (experiment_id, user_id)
);

-- Physics Lab: Shared theoretical frameworks
CREATE TABLE IF NOT EXISTS physics_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  equations JSONB, -- LaTeX or structured math
  parameters JSONB,
  category TEXT, -- CCC, quantum, relativity, unified
  tags TEXT[],
  visibility TEXT DEFAULT 'public',
  citations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_physics_frameworks_category ON physics_frameworks(category);
CREATE INDEX idx_physics_frameworks_creator ON physics_frameworks(creator_id);

-- Enhanced ad revenue sharing
ALTER TABLE ad_orders 
ADD COLUMN IF NOT EXISTS creator_share NUMERIC DEFAULT 0.85,
ADD COLUMN IF NOT EXISTS platform_share NUMERIC DEFAULT 0.15,
ADD COLUMN IF NOT EXISTS gross_revenue NUMERIC,
ADD COLUMN IF NOT EXISTS creator_payout NUMERIC,
ADD COLUMN IF NOT EXISTS platform_payout NUMERIC;

-- Content engagement tracking for better analytics
CREATE TABLE IF NOT EXISTS content_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- post, experiment, music, merch
  content_id UUID NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  engagement_type TEXT NOT NULL, -- view, like, share, comment, deep_view
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_engagement_content ON content_engagement(content_id, created_at DESC);
CREATE INDEX idx_content_engagement_creator ON content_engagement(creator_id, created_at DESC);

-- Storage bucket policies
-- Note: Execute these in Supabase dashboard
-- 1. Create bucket: avatars (public)
-- 2. Create bucket: covers (public)
-- 3. Create bucket: experiment-data (private)

-- RLS Policies for new tables
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE physics_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE physics_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_engagement ENABLE ROW LEVEL SECURITY;

-- Creator earnings: Users can view their own earnings
CREATE POLICY "Users can view own earnings"
  ON creator_earnings FOR SELECT
  USING (auth.uid() = creator_id);

-- Physics experiments: Owners and collaborators can view
CREATE POLICY "Experiment visibility"
  ON physics_experiments FOR SELECT
  USING (
    visibility = 'public' 
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM experiment_collaborators 
      WHERE experiment_id = id AND user_id = auth.uid()
    )
  );

-- Physics experiments: Owners can modify
CREATE POLICY "Owners can modify experiments"
  ON physics_experiments FOR ALL
  USING (creator_id = auth.uid());

-- Experiment runs: Same as parent experiment
CREATE POLICY "Experiment runs visibility"
  ON experiment_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM physics_experiments
      WHERE physics_experiments.id = experiment_runs.experiment_id
      AND (
        visibility = 'public'
        OR creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM experiment_collaborators
          WHERE experiment_id = physics_experiments.id 
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Frameworks: Public or owner
CREATE POLICY "Framework visibility"
  ON physics_frameworks FOR SELECT
  USING (visibility = 'public' OR creator_id = auth.uid());

-- Frameworks: Owners can modify
CREATE POLICY "Owners can modify frameworks"
  ON physics_frameworks FOR ALL
  USING (creator_id = auth.uid());

-- Content engagement: Anyone can record engagement
CREATE POLICY "Anyone can record engagement"
  ON content_engagement FOR INSERT
  WITH CHECK (true);

-- Content engagement: Creators can view their content engagement
CREATE POLICY "Creators view their engagement"
  ON content_engagement FOR SELECT
  USING (creator_id = auth.uid());

-- Function to calculate and distribute revenue
CREATE OR REPLACE FUNCTION calculate_creator_revenue(
  p_gross_amount NUMERIC,
  p_creator_id UUID
)
RETURNS TABLE(
  platform_fee NUMERIC,
  net_amount NUMERIC
) AS $$
DECLARE
  v_platform_share NUMERIC;
  v_creator_override NUMERIC;
BEGIN
  -- Check for custom revenue share
  SELECT revenue_share_override INTO v_creator_override
  FROM profiles WHERE id = p_creator_id;
  
  IF v_creator_override IS NOT NULL THEN
    v_platform_share := v_creator_override;
  ELSE
    -- Get default platform share
    SELECT platform_share INTO v_platform_share
    FROM revenue_config
    ORDER BY updated_at DESC
    LIMIT 1;
  END IF;
  
  RETURN QUERY SELECT
    ROUND(p_gross_amount * v_platform_share, 2) as platform_fee,
    ROUND(p_gross_amount * (1 - v_platform_share), 2) as net_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update ad order with revenue split
CREATE OR REPLACE FUNCTION record_ad_revenue()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_owner UUID;
  v_revenue RECORD;
BEGIN
  -- Get slot owner
  SELECT owner_id INTO v_slot_owner
  FROM ad_slots ads
  JOIN ad_listings al ON al.slot_id = ads.id
  WHERE al.id = NEW.listing_id;
  
  -- Calculate revenue split
  SELECT * INTO v_revenue
  FROM calculate_creator_revenue(NEW.gross_revenue, v_slot_owner);
  
  -- Update order with revenue split
  UPDATE ad_orders SET
    creator_share = 1 - (
      SELECT platform_share FROM revenue_config 
      ORDER BY updated_at DESC LIMIT 1
    ),
    platform_share = (
      SELECT platform_share FROM revenue_config 
      ORDER BY updated_at DESC LIMIT 1
    ),
    creator_payout = v_revenue.net_amount,
    platform_payout = v_revenue.platform_fee
  WHERE id = NEW.id;
  
  -- Record creator earnings
  INSERT INTO creator_earnings (
    creator_id, source_type, source_id,
    gross_amount, platform_fee, net_amount
  ) VALUES (
    v_slot_owner, 'ad_revenue', NEW.id,
    NEW.gross_revenue, v_revenue.platform_fee, v_revenue.net_amount
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ad revenue calculation
DROP TRIGGER IF EXISTS calculate_ad_revenue ON ad_orders;
CREATE TRIGGER calculate_ad_revenue
  AFTER UPDATE OF gross_revenue ON ad_orders
  FOR EACH ROW
  WHEN (NEW.gross_revenue IS NOT NULL AND OLD.gross_revenue IS DISTINCT FROM NEW.gross_revenue)
  EXECUTE FUNCTION record_ad_revenue();
