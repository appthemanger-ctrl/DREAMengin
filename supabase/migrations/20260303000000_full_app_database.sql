-- ============================================================
-- DREAMengin — FULL APP DATABASE (fresh install)
-- Supabase / Postgres (public schema + auth.users hook)
-- NO "IF NOT EXISTS" anywhere 

-- ----------------------------
-- CORE UTILITIES
-- ----------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Sync helper for tables that keep both user_id + owner_id (or similar)
CREATE OR REPLACE FUNCTION public.sync_owner_user_ids()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- owner_id / user_id sync (if both columns exist on the table using this trigger)
  IF TG_OP IN ('INSERT','UPDATE') THEN
    IF (NEW.owner_id IS NULL) AND (NEW.user_id IS NOT NULL) THEN
      NEW.owner_id := NEW.user_id;
    ELSIF (NEW.user_id IS NULL) AND (NEW.owner_id IS NOT NULL) THEN
      NEW.user_id := NEW.owner_id;
    ELSIF (NEW.user_id IS NOT NULL) AND (NEW.owner_id IS NOT NULL) AND (NEW.user_id <> NEW.owner_id) THEN
      RAISE EXCEPTION 'owner_id and user_id must match';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ----------------------------
-- PROFILES (auth mirror)
-- ----------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  avatar_storage_path text,
  bio text,
  banner_url text,
  cover_url text,
  cover_image_url text,
  cover_storage_path text,
  website text,
  location text,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  privacy jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified boolean NOT NULL DEFAULT false,
  creator_tier text NOT NULL DEFAULT 'standard',
  revenue_share_override numeric,
  has_seen_intro boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_handle ON public.profiles(handle);

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create a profile row for every new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_handle text;
  v_display text;
  v_avatar text;
BEGIN
  v_handle := 'user_' || substr(replace(NEW.id::text, '-', ''), 1, 8);
  v_display := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');

  INSERT INTO public.profiles (id, handle, display_name, avatar_url)
  VALUES (NEW.id, v_handle, v_display, v_avatar);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------
-- FOLLOWS (supports both following_id and followed_id)
-- ----------------------------
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_pair_unique UNIQUE (follower_id, following_id),
  CONSTRAINT follows_target_match CHECK (following_id = followed_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- ----------------------------
-- PROJECTS (supports owner_id + user_id)
-- ----------------------------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  template text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  views_count int NOT NULL DEFAULT 0,
  forks_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_owner_user_match CHECK (owner_id = user_id)
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_created ON public.projects(created_at DESC);

CREATE TRIGGER projects_sync_owner_user
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_user_ids();

CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------
-- POSTS
-- ----------------------------
CREATE TABLE public.app_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','followers')),
  media_urls text[] NOT NULL DEFAULT '{}'::text[],
  media_json jsonb,
  likes_count int NOT NULL DEFAULT 0,
  comments_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_user_id ON public.app_posts(user_id);
CREATE INDEX idx_posts_created_at ON public.app_posts(created_at DESC);

CREATE TRIGGER app_posts_set_updated_at
BEFORE UPDATE ON public.app_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------
-- LIKES (polymorphic)
-- ----------------------------
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('post','music','project','feed_item','merch','experiment')),
  content_id uuid NOT NULL,
  post_id uuid REFERENCES public.app_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT likes_unique UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX idx_likes_user ON public.likes(user_id, created_at DESC);
CREATE INDEX idx_likes_content ON public.likes(content_type, content_id);

-- Safe RPC for incrementing like counters (only allow known tables/cols)
CREATE OR REPLACE FUNCTION public.increment_likes(table_name text, row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF table_name <> 'app_posts' THEN
    RAISE EXCEPTION 'increment_likes: table not allowed';
  END IF;

  UPDATE public.app_posts
  SET likes_count = likes_count + 1
  WHERE id = row_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_likes(text, uuid) TO authenticated;

-- ----------------------------
-- FEED ITEMS (superset: legacy connector + newer app inserts)
-- ----------------------------
CREATE TABLE public.feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- newer app-style inserts
  type text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- legacy/connector fields
  source text,
  source_account_id text,
  external_id text,

  ts timestamptz NOT NULL DEFAULT now(),
  title text,
  summary text,
  url text,
  media_json jsonb,
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  importance_score double precision NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','followers','private')),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  dedupe_hash text UNIQUE,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_items_user_ts ON public.feed_items(user_id, ts DESC);
CREATE INDEX idx_feed_items_dedupe ON public.feed_items(dedupe_hash);

-- ----------------------------
-- FEED RULES
-- ----------------------------
CREATE TABLE public.feed_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text,
  target text,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_rules_user ON public.feed_rules(user_id);

-- ----------------------------
-- NOTIFICATIONS
-- ----------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ----------------------------
-- MESSAGES / CONVERSATIONS
-- ----------------------------
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_p1 ON public.conversations(participant1_id, updated_at DESC);
CREATE INDEX idx_conversations_p2 ON public.conversations(participant2_id, updated_at DESC);

CREATE TRIGGER conversations_set_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);

-- ----------------------------
-- MUSIC RELEASES (supports user_id + owner_id)
-- ----------------------------
CREATE TABLE public.music_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  embed_url text,
  cover_url text,
  genre text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  plays_count int NOT NULL DEFAULT 0,
  likes_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT music_owner_user_match CHECK (owner_id = user_id)
);

CREATE INDEX idx_music_user ON public.music_releases(user_id, created_at DESC);

CREATE TRIGGER music_sync_owner_user
BEFORE INSERT OR UPDATE ON public.music_releases
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_user_ids();

CREATE TRIGGER music_set_updated_at
BEFORE UPDATE ON public.music_releases
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------
-- MERCH (supports user_id + owner_id; supports title + name)
-- ----------------------------
CREATE TABLE public.merch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  name text,
  description text,
  price numeric(10,2) NOT NULL,
  stock int NOT NULL DEFAULT 0,
  image_url text,
  category text,
  sold_count int NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT merch_owner_user_match CHECK (owner_id = user_id)
);

CREATE INDEX idx_merch_user ON public.merch(user_id, created_at DESC);

CREATE TRIGGER merch_sync_owner_user
BEFORE INSERT OR UPDATE ON public.merch
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_user_ids();

CREATE OR REPLACE FUNCTION public.merch_sync_name_title()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.name IS NULL AND NEW.title IS NOT NULL THEN
    NEW.name := NEW.title;
  ELSIF NEW.title IS NULL AND NEW.name IS NOT NULL THEN
    NEW.title := NEW.name;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER merch_sync_name_title_tr
BEFORE INSERT OR UPDATE ON public.merch
FOR EACH ROW
EXECUTE FUNCTION public.merch_sync_name_title();

CREATE TRIGGER merch_set_updated_at
BEFORE UPDATE ON public.merch
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------
-- CONNECTORS TOKENS (supports source + provider)
-- ----------------------------
CREATE TABLE public.connectors_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source text,
  provider text,
  token jsonb NOT NULL DEFAULT '{}'::jsonb,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_connectors_user ON public.connectors_tokens(user_id, created_at DESC);

-- ----------------------------
-- ADS (slots, listings, orders)
-- ----------------------------
CREATE TABLE public.ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  placement text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  price_day numeric(10,2),
  price_week numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_slots_owner_user_match CHECK (owner_id = user_id)
);

CREATE INDEX idx_ad_slots_owner ON public.ad_slots(owner_id, created_at DESC);

CREATE TRIGGER ad_slots_sync_owner_user
BEFORE INSERT OR UPDATE ON public.ad_slots
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_user_ids();

CREATE TRIGGER ad_slots_set_updated_at
BEFORE UPDATE ON public.ad_slots
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ad_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES public.ad_slots(id) ON DELETE CASCADE,
  ad_slot_id uuid REFERENCES public.ad_slots(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text,
  description text,
  price numeric(10,2),
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold','pending')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_listings_status ON public.ad_listings(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.sync_ad_listing_slot_ids()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slot_id IS NULL AND NEW.ad_slot_id IS NOT NULL THEN
    NEW.slot_id := NEW.ad_slot_id;
  ELSIF NEW.ad_slot_id IS NULL AND NEW.slot_id IS NOT NULL THEN
    NEW.ad_slot_id := NEW.slot_id;
  ELSIF NEW.slot_id IS NOT NULL AND NEW.ad_slot_id IS NOT NULL AND NEW.slot_id <> NEW.ad_slot_id THEN
    RAISE EXCEPTION 'slot_id and ad_slot_id must match';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ad_listings_sync_slot_ids
BEFORE INSERT OR UPDATE ON public.ad_listings
FOR EACH ROW
EXECUTE FUNCTION public.sync_ad_listing_slot_ids();

CREATE TABLE public.ad_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.ad_listings(id) ON DELETE CASCADE,
  ad_listing_id uuid REFERENCES public.ad_listings(id) ON DELETE CASCADE,
  amount numeric(10,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  -- revenue fields (optional, used by future analytics)
  gross_revenue numeric(10,2),
  creator_share numeric(10,4) DEFAULT 0.85,
  platform_share numeric(10,4) DEFAULT 0.15,
  creator_payout numeric(10,2),
  platform_payout numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_orders_buyer ON public.ad_orders(buyer_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.sync_ad_order_listing_ids()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.listing_id IS NULL AND NEW.ad_listing_id IS NOT NULL THEN
    NEW.listing_id := NEW.ad_listing_id;
  ELSIF NEW.ad_listing_id IS NULL AND NEW.listing_id IS NOT NULL THEN
    NEW.ad_listing_id := NEW.listing_id;
  ELSIF NEW.listing_id IS NOT NULL AND NEW.ad_listing_id IS NOT NULL AND NEW.listing_id <> NEW.ad_listing_id THEN
    RAISE EXCEPTION 'listing_id and ad_listing_id must match';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ad_orders_sync_listing_ids
BEFORE INSERT OR UPDATE ON public.ad_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_ad_order_listing_ids();

-- ----------------------------
-- ADMIN LOCK (DB-backed)
-- ----------------------------
CREATE TABLE public.admin_lock (
  id boolean PRIMARY KEY DEFAULT true,
  locked boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  reason text,
  CONSTRAINT admin_lock_singleton CHECK (id = true)
);

INSERT INTO public.admin_lock (id, locked) VALUES (true, false);

ALTER TABLE public.admin_lock ENABLE ROW LEVEL SECURITY;
-- no policies: only service-role bypasses RLS

-- ----------------------------
-- CONTENT ENGAGEMENT (feed resolver reads this)
-- ----------------------------
CREATE TABLE public.content_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  engagement_type text NOT NULL CHECK (engagement_type IN ('view','like','share','comment','deep_view')),
  duration_seconds int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_engagement_content ON public.content_engagement(content_id, created_at DESC);
CREATE INDEX idx_content_engagement_creator ON public.content_engagement(creator_id, created_at DESC);

-- ----------------------------
-- WIDGET SYSTEM V2 (plus legacy-friendly columns)
-- ----------------------------
CREATE TABLE public.widget_definitions (
  widget_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  host_kind smallint NOT NULL,
  host_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  policy integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_widget_definitions_owner ON public.widget_definitions(owner_id, updated_at DESC);
CREATE INDEX idx_widget_definitions_host_kind ON public.widget_definitions(host_kind);

CREATE TRIGGER widget_definitions_set_updated_at
BEFORE UPDATE ON public.widget_definitions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- FOLLOW scope verification (uses follows.following_id / followed_id)
CREATE OR REPLACE FUNCTION public.verify_follow_scope(p_owner_id uuid, p_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_owner_id = p_target_user_id THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = p_owner_id AND following_id = p_target_user_id
  );
END;
$$;

-- Normalize feed host config (host_kind=1)
CREATE OR REPLACE FUNCTION public.normalize_feed_host_config(p_config jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_scope smallint;
  v_target uuid;
BEGIN
  v_scope := COALESCE((p_config->>'scope')::smallint, 0);
  IF v_scope NOT IN (0, 1) THEN v_scope := 0; END IF;

  v_target := (p_config->>'target_user_id')::uuid;
  IF v_scope = 0 THEN v_target := NULL; END IF;

  RETURN jsonb_build_object(
    'scope', v_scope,
    'target_user_id', v_target,
    'filters', COALESCE(p_config->'filters', '{}'::jsonb),
    'sort', COALESCE((p_config->>'sort')::smallint, 0),
    'limit', LEAST(GREATEST(COALESCE((p_config->>'limit')::smallint, 25), 5), 200),
    'realtime', COALESCE((p_config->>'realtime')::boolean, true),
    'include_media', COALESCE((p_config->>'include_media')::boolean, true),
    'include_reposts', COALESCE((p_config->>'include_reposts')::boolean, false)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_widget_definition_config()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.host_kind = 1 THEN
    NEW.host_config := public.normalize_feed_host_config(NEW.host_config);
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER widget_definitions_normalize_on_insert
BEFORE INSERT ON public.widget_definitions
FOR EACH ROW
EXECUTE FUNCTION public.normalize_widget_definition_config();

CREATE TRIGGER widget_definitions_normalize_on_update
BEFORE UPDATE ON public.widget_definitions
FOR EACH ROW
EXECUTE FUNCTION public.normalize_widget_definition_config();

-- widget_instances: v2 columns + legacy columns used by AI dreams handler
CREATE TABLE public.widget_instances (
  instance_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- legacy-friendly alias (AI/older code queries .eq('id', ...))
  id uuid GENERATED ALWAYS AS (instance_id) STORED,

  -- v2 linkage (nullable so legacy rows can exist)
  widget_id uuid REFERENCES public.widget_definitions(widget_id) ON DELETE CASCADE,

  -- both names exist in code paths; kept in sync by trigger
  owner_id uuid,
  user_id uuid,

  -- legacy widget fields used by dreams handler
  type text,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  "order" int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,

  -- v2 placement/transform (defaults allow legacy inserts)
  surface smallint NOT NULL DEFAULT 0,
  surface_key int NOT NULL DEFAULT 0,
  slot_index smallint NOT NULL DEFAULT -1,
  presentation smallint NOT NULL DEFAULT 0,
  transform_x real NOT NULL DEFAULT 0,
  transform_y real NOT NULL DEFAULT 0,
  transform_scale real NOT NULL DEFAULT 1,
  transform_rotation real NOT NULL DEFAULT 0,
  transform_opacity real NOT NULL DEFAULT 1,
  z_index int NOT NULL DEFAULT 0,
  focus_rank int NOT NULL DEFAULT 0,
  runtime_flags int NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT widget_instances_owner_fk FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT widget_instances_user_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT widget_instances_owner_user_match CHECK (owner_id = user_id),
  CONSTRAINT valid_slot_index CHECK (slot_index >= -1 AND slot_index <= 7),
  CONSTRAINT valid_transform_opacity CHECK (transform_opacity >= 0 AND transform_opacity <= 1),
  CONSTRAINT valid_transform_scale CHECK (transform_scale > 0 AND transform_scale <= 10)
);

CREATE INDEX idx_widget_instances_owner_surface ON public.widget_instances(owner_id, surface, z_index DESC);
CREATE INDEX idx_widget_instances_widget ON public.widget_instances(widget_id);
CREATE INDEX idx_widget_instances_user_legacy ON public.widget_instances(user_id, "order");

CREATE TRIGGER widget_instances_sync_owner_user
BEFORE INSERT OR UPDATE ON public.widget_instances
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_user_ids();

CREATE TRIGGER widget_instances_set_updated_at
BEFORE UPDATE ON public.widget_instances
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Default feed widget creation after profile insert
CREATE OR REPLACE FUNCTION public.create_default_feed_widget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_widget_id uuid;
BEGIN
  INSERT INTO public.widget_definitions (owner_id, name, host_kind, host_config, policy)
  VALUES (
    NEW.id,
    'My Feed',
    1,
    jsonb_build_object(
      'scope', 0,
      'target_user_id', NULL,
      'filters', '{}'::jsonb,
      'sort', 0,
      'limit', 25,
      'realtime', true,
      'include_media', true,
      'include_reposts', false
    ),
    0
  )
  RETURNING widget_id INTO v_widget_id;

  INSERT INTO public.widget_instances (
    widget_id, owner_id, user_id,
    surface, surface_key, slot_index, presentation,
    transform_x, transform_y, transform_scale, transform_rotation, transform_opacity,
    z_index, focus_rank
  )
  VALUES (
    v_widget_id, NEW.id, NEW.id,
    0, 0, -1, 0,
    0, 0, 1, 0, 1,
    0, 0
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_create_default_widgets
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_feed_widget();

-- Optional view used by some internal tooling (safe to have)
CREATE VIEW public.widget_feed_items AS
SELECT
  wi.instance_id,
  wi.widget_id,
  wi.owner_id,
  wd.host_config,
  fi.id AS item_id,
  fi.user_id AS author_id,
  fi.ts AS created_at,
  fi.title,
  fi.summary AS text_preview,
  fi.url,
  fi.media_json,
  fi.tags_json,
  fi.visibility,
  fi.importance_score
FROM public.widget_instances wi
JOIN public.widget_definitions wd ON wi.widget_id = wd.widget_id
JOIN public.feed_items fi ON (
  (
    (wd.host_config->>'scope')::smallint = 0
    AND fi.user_id = wi.owner_id
  )
  OR
  (
    (wd.host_config->>'scope')::smallint = 1
    AND fi.user_id = (wd.host_config->>'target_user_id')::uuid
    AND public.verify_follow_scope(wi.owner_id, (wd.host_config->>'target_user_id')::uuid)
  )
)
WHERE wd.host_kind = 1;

GRANT SELECT ON public.widget_feed_items TO authenticated;

-- ----------------------------
-- AI / ADMIN CORE
-- ----------------------------
CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','admin','system')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_roles_role ON public.user_roles(role);

CREATE TRIGGER user_roles_set_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','system')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_actor ON public.admin_audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action, created_at DESC);

CREATE TABLE public.idempotency_keys (
  key text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_type text NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_idempotency_keys_user ON public.idempotency_keys(user_id, created_at DESC);
CREATE INDEX idx_idempotency_keys_created ON public.idempotency_keys(created_at);

CREATE TABLE public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent text NOT NULL CHECK (agent IN ('dr_eams','idari','boogieman')),
  scope text NOT NULL,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_memories_unique UNIQUE (user_id, agent, scope, key)
);

CREATE INDEX idx_ai_memories_user_agent ON public.ai_memories(user_id, agent);

CREATE TRIGGER ai_memories_set_updated_at
BEFORE UPDATE ON public.ai_memories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- rate_limit_hit() path (used by lib/ai/rateLimit.ts)
CREATE TABLE public.rate_limit_counters (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_counters_window ON public.rate_limit_counters(window_start);

CREATE OR REPLACE FUNCTION public.rate_limit_hit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
  v_allowed boolean;
  v_rpm integer;
  v_retry_after integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_key));

  v_window_start := date_trunc('minute', v_now) -
    ( (extract(epoch from date_trunc('minute', v_now))::int % p_window_seconds) || ' seconds')::interval;

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

  v_allowed := v_count <= p_limit;
  v_rpm := round((v_count::float / p_window_seconds) * 60)::int;
  v_retry_after := greatest(0, extract(epoch from (v_window_start + (p_window_seconds || ' seconds')::interval - v_now))::int);

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'rpm', v_rpm,
    'retry_after_seconds', v_retry_after
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO authenticated;

-- check_ai_rate_limit() path (used by lib/ai/rate-limiter.ts)
CREATE TABLE public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_rate_limits_unique UNIQUE (user_id, endpoint, window_start)
);

CREATE INDEX idx_ai_rate_limits_user ON public.ai_rate_limits(user_id, endpoint, window_start DESC);

CREATE TRIGGER ai_rate_limits_set_updated_at
BEFORE UPDATE ON public.ai_rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
BEGIN
  v_window_start := date_trunc('minute', now()) -
    (extract(minute from now())::int % p_window_minutes) * interval '1 minute';

  INSERT INTO public.ai_rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET
    request_count = ai_rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_current_count;

  RETURN v_current_count <= p_max_requests;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer, integer) TO authenticated;

-- Optional AI system tables (v2026)
CREATE TABLE public.ai_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  intent_id uuid,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent text NOT NULL CHECK (agent IN ('dr_eams','idari','boogieman')),
  intent_type text,
  decision text CHECK (decision IN ('ALLOW','DENY','CONFIRM','MODIFY')),
  payload_hash text,
  ok boolean NOT NULL,
  error_code text,
  latency_ms integer,
  risk_score numeric,
  reason_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_audit_user ON public.ai_audit_log(user_id, created_at DESC);
CREATE INDEX idx_ai_audit_request ON public.ai_audit_log(request_id);

CREATE TABLE public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  rules_json jsonb NOT NULL,
  weights jsonb NOT NULL,
  thresholds jsonb NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_policy_versions_active ON public.policy_versions(active, created_at DESC);

CREATE TABLE public.confirm_tokens (
  token text PRIMARY KEY,
  request_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_ids uuid[] NOT NULL,
  ui_snapshot jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_confirm_tokens_user ON public.confirm_tokens(user_id, created_at DESC);
CREATE INDEX idx_confirm_tokens_expires ON public.confirm_tokens(expires_at);

CREATE TABLE public.intent_cache (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent text NOT NULL CHECK (agent IN ('dr_eams','idari')),
  intent_type text NOT NULL,
  payload jsonb NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  requires_confirmation boolean NOT NULL,
  rationale text,
  idempotency_key text,
  boogie_decision text CHECK (boogie_decision IN ('ALLOW','DENY','CONFIRM','MODIFY')),
  risk_score numeric,
  reason_code text,
  executed boolean NOT NULL DEFAULT false,
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX idx_intent_cache_user ON public.intent_cache(user_id, created_at DESC);
CREATE INDEX idx_intent_cache_expires ON public.intent_cache(expires_at);

-- ----------------------------
-- (Optional) Creator economics + physics lab infra
-- ----------------------------
CREATE TABLE public.revenue_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_share numeric NOT NULL DEFAULT 0.15,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

CREATE TABLE public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid,
  gross_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX idx_creator_earnings_creator ON public.creator_earnings(creator_id, created_at DESC);
CREATE INDEX idx_creator_earnings_status ON public.creator_earnings(status);

CREATE TABLE public.physics_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  hypothesis text,
  methodology jsonb,
  parameters jsonb,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public','collaborative')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','completed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_physics_experiments_creator ON public.physics_experiments(creator_id, created_at DESC);

CREATE TRIGGER physics_experiments_set_updated_at
BEFORE UPDATE ON public.physics_experiments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.experiment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES public.physics_experiments(id) ON DELETE CASCADE,
  run_number integer NOT NULL,
  input_data jsonb,
  output_data jsonb,
  metrics jsonb,
  visualization_data jsonb,
  duration_ms integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT experiment_runs_unique UNIQUE (experiment_id, run_number)
);

CREATE INDEX idx_experiment_runs_experiment ON public.experiment_runs(experiment_id, run_number DESC);

CREATE TABLE public.experiment_collaborators (
  experiment_id uuid REFERENCES public.physics_experiments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','contributor','co-owner')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (experiment_id, user_id)
);

CREATE TABLE public.physics_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  equations jsonb,
  parameters jsonb,
  category text,
  tags text[],
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  citations integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_physics_frameworks_creator ON public.physics_frameworks(creator_id);
CREATE INDEX idx_physics_frameworks_category ON public.physics_frameworks(category);

-- ============================================================
-- RLS + POLICIES
-- ============================================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles read"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Own profiles update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Own profiles insert"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- FOLLOWS (lock down follow graph visibility: only parties can see)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select"
ON public.follows
FOR SELECT
TO authenticated
USING (
  follower_id = auth.uid()
  OR following_id = auth.uid()
);

CREATE POLICY "follows_insert"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete"
ON public.follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- POSTS (public/followers/owner)
ALTER TABLE public.app_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_posts_select"
ON public.app_posts
FOR SELECT
TO public
USING (
  visibility = 'public'
  OR (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR (
        visibility = 'followers'
        AND EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = auth.uid()
            AND f.following_id = public.app_posts.user_id
        )
      )
    )
  )
);

CREATE POLICY "app_posts_insert_own"
ON public.app_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_posts_update_own"
ON public.app_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "app_posts_delete_own"
ON public.app_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- FEED ITEMS (owner always; public; followers when follow relationship)
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_items_select"
ON public.feed_items
FOR SELECT
TO public
USING (
  visibility = 'public'
  OR auth.uid() = user_id
  OR (
    visibility = 'followers'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.follows f
      WHERE f.follower_id = auth.uid()
        AND f.following_id = public.feed_items.user_id
    )
  )
);

CREATE POLICY "feed_items_insert_own"
ON public.feed_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_items_update_own"
ON public.feed_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "feed_items_delete_own"
ON public.feed_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- FEED RULES (own only)
ALTER TABLE public.feed_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_rules_own"
ON public.feed_rules
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS (select/update own; insert allowed for anyone so messages can notify recipient)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_insert_any"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- CONVERSATIONS (participants only)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant"
ON public.conversations
FOR SELECT
TO authenticated
USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

CREATE POLICY "conversations_insert_participant"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (participant1_id = auth.uid() OR participant2_id = auth.uid());

CREATE POLICY "conversations_update_participant"
ON public.conversations
FOR UPDATE
TO authenticated
USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- MESSAGES (participants can read; sender can insert)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
);

CREATE POLICY "messages_insert_sender"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- LIKES
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_all"
ON public.likes
FOR SELECT
USING (true);

CREATE POLICY "likes_insert_own"
ON public.likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own"
ON public.likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- MUSIC
ALTER TABLE public.music_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "music_select"
ON public.music_releases
FOR SELECT
TO public
USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "music_insert_own"
ON public.music_releases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "music_update_own"
ON public.music_releases
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "music_delete_own"
ON public.music_releases
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- MERCH
ALTER TABLE public.merch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merch_select_all"
ON public.merch
FOR SELECT
USING (true);

CREATE POLICY "merch_insert_own"
ON public.merch
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "merch_update_own"
ON public.merch
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "merch_delete_own"
ON public.merch
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select"
ON public.projects
FOR SELECT
TO public
USING (visibility = 'public' OR auth.uid() = owner_id);

CREATE POLICY "projects_insert_own"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "projects_update_own"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "projects_delete_own"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- CONNECTORS TOKENS (own only)
ALTER TABLE public.connectors_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connectors_tokens_own"
ON public.connectors_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ADS
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_slots_select"
ON public.ad_slots
FOR SELECT
TO public
USING (active = true OR auth.uid() = owner_id);

CREATE POLICY "ad_slots_manage_own"
ON public.ad_slots
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "ad_listings_select_marketplace"
ON public.ad_listings
FOR SELECT
TO public
USING (true);

CREATE POLICY "ad_listings_manage_owner"
ON public.ad_listings
FOR ALL
TO authenticated
USING (
  auth.uid() = (SELECT owner_id FROM public.ad_slots s WHERE s.id = public.ad_listings.slot_id)
)
WITH CHECK (true);

CREATE POLICY "ad_orders_access"
ON public.ad_orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = buyer_id
  OR auth.uid() = (
    SELECT s.owner_id
    FROM public.ad_slots s
    JOIN public.ad_listings l ON l.slot_id = s.id
    WHERE l.id = public.ad_orders.listing_id
  )
);

CREATE POLICY "ad_orders_insert_buyer"
ON public.ad_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- WIDGETS V2
ALTER TABLE public.widget_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_definitions_own"
ON public.widget_definitions
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "widget_instances_own"
ON public.widget_instances
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- AI / ADMIN
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intent_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_roles_admin_all"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "admin_audit_log_select_own"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = actor_user_id);

CREATE POLICY "admin_audit_log_select_admin"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "admin_audit_log_insert_actor"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_user_id);

CREATE POLICY "idempotency_keys_own"
ON public.idempotency_keys
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_memories_own"
ON public.ai_memories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_rate_limits_select_own"
ON public.ai_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "ai_audit_log_select_own"
ON public.ai_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "ai_audit_log_select_admin"
ON public.ai_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "policy_versions_select_active"
ON public.policy_versions
FOR SELECT
USING (active = true);

CREATE POLICY "policy_versions_admin_all"
ON public.policy_versions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "confirm_tokens_select_own"
ON public.confirm_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "intent_cache_select_own"
ON public.intent_cache
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- OPTIONAL tables RLS (creator + physics)
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physics_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physics_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_earnings_select_own"
ON public.creator_earnings
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "physics_experiments_select"
ON public.physics_experiments
FOR SELECT
TO public
USING (
  visibility = 'public'
  OR creator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.experiment_collaborators c
    WHERE c.experiment_id = physics_experiments.id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "physics_experiments_owner_all"
ON public.physics_experiments
FOR ALL
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "experiment_runs_select"
ON public.experiment_runs
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.physics_experiments e
    WHERE e.id = experiment_runs.experiment_id
      AND (
        e.visibility = 'public'
        OR e.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.experiment_collaborators c
          WHERE c.experiment_id = e.id AND c.user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "physics_frameworks_select"
ON public.physics_frameworks
FOR SELECT
TO public
USING (visibility = 'public' OR creator_id = auth.uid());

CREATE POLICY "physics_frameworks_owner_all"
ON public.physics_frameworks
FOR ALL
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "content_engagement_insert_any"
ON public.content_engagement
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "content_engagement_select_creator"
ON public.content_engagement
FOR SELECT
TO authenticated
USING (creator_id = auth.uid());
