-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  theme JSONB DEFAULT '{}',
  links JSONB DEFAULT '[]',
  privacy JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_handle ON profiles(handle);

-- Create follows table
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  followed_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id)
);

-- Create app_posts table
CREATE TABLE app_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_json JSONB,
  visibility TEXT DEFAULT 'followers',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_app_posts_user_ts ON app_posts(user_id, created_at DESC);

-- Create feed_items table
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_account_id TEXT,
  external_id TEXT,
  ts TIMESTAMPTZ NOT NULL,
  title TEXT,
  summary TEXT,
  url TEXT,
  media_json JSONB,
  tags_json JSONB,
  importance_score FLOAT DEFAULT 0,
  visibility TEXT DEFAULT 'private',
  dedupe_hash TEXT UNIQUE
);
CREATE INDEX idx_feed_items_user_ts ON feed_items(user_id, ts DESC);
CREATE INDEX idx_feed_items_dedupe ON feed_items(dedupe_hash);

-- Create feed_rules table
CREATE TABLE feed_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT, -- mute/boost/digest/budget
  target TEXT,
  value JSONB
);
CREATE INDEX idx_feed_rules_user ON feed_rules(user_id);

-- Create widget_instances table
CREATE TABLE widget_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- notifications/promo/next_stream/watch/messages/lab/machine
  config_json JSONB,
  "order" INTEGER,
  enabled BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_widget_instances_user ON widget_instances(user_id);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT,
  content JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- Create ad_slots table
CREATE TABLE ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  placement TEXT,
  price_day NUMERIC,
  price_week NUMERIC,
  active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_ad_slots_owner ON ad_slots(owner_id);

-- Create ad_listings table
CREATE TABLE ad_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES ad_slots(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'available'
);

-- Create ad_orders table
CREATE TABLE ad_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES ad_listings(id) ON DELETE CASCADE,
  creative_id UUID, -- ref ad_creatives
  payment_status TEXT DEFAULT 'pending',
  revenue_share NUMERIC DEFAULT 0.7 -- owner cut stub
);

-- Create ad_creatives table
CREATE TABLE ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  link TEXT
);

-- Create ad_events table
CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES ad_orders(id) ON DELETE CASCADE,
  type TEXT, -- impression/click
  ts TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT, -- ad_performance
  data JSONB
);

-- Create admin_audit_log table
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT,
  details JSONB,
  ts TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notebooks table
CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT, -- markdown
  version INTEGER DEFAULT 1
);

-- Create attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT,
  name TEXT
);

-- Create project_members table
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer',
  PRIMARY KEY (project_id, user_id)
);

-- Create merch table
CREATE TABLE merch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  stock INTEGER
);

-- Create music_releases table
CREATE TABLE music_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  embed_url TEXT,
  upload_path TEXT,
  visibility TEXT DEFAULT 'public'
);

-- Create settings table
CREATE TABLE settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}'
);

-- Create connectors_tokens table
CREATE TABLE connectors_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT,
  token JSONB,
  revoked BOOLEAN DEFAULT FALSE
);