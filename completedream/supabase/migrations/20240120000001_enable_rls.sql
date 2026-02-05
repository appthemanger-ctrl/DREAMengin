-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors_tokens ENABLE ROW LEVEL SECURITY;

-- profiles: public read (limited cols), own update
CREATE POLICY "Public profiles read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profiles update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- follows: own read/write
CREATE POLICY "Own follows" ON follows USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);

-- app_posts: owner write, followers/public read based on visibility
CREATE POLICY "Posts insert" ON app_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Posts read" ON app_posts FOR SELECT USING (
  auth.uid() = user_id OR visibility = 'public' OR (visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND followed_id = app_posts.user_id))
);

-- feed_items: own only (private feed)
CREATE POLICY "Own feed_items" ON feed_items USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- feed_rules: own only
CREATE POLICY "Own feed_rules" ON feed_rules USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- widget_instances: own only
CREATE POLICY "Own widgets" ON widget_instances USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications: own only
CREATE POLICY "Own notifications" ON notifications USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ad_slots: owner manage, public read active
CREATE POLICY "Slots read" ON ad_slots FOR SELECT USING (active = TRUE OR auth.uid() = owner_id);
CREATE POLICY "Own slots" ON ad_slots USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ad_listings: similar to slots
CREATE POLICY "Listings read" ON ad_listings FOR SELECT USING (true); -- marketplace public
CREATE POLICY "Own listings" ON ad_listings USING (auth.uid() = (SELECT owner_id FROM ad_slots WHERE id = slot_id)) WITH CHECK (true);

-- ad_orders: buyer/owner read/write
CREATE POLICY "Orders access" ON ad_orders USING (auth.uid() = buyer_id OR auth.uid() = (SELECT owner_id FROM ad_slots s JOIN ad_listings l ON s.id = l.slot_id WHERE l.id = listing_id));

-- ad_creatives: own only
CREATE POLICY "Own creatives" ON ad_creatives USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ad_events: admin/owner read
CREATE POLICY "Events access" ON ad_events USING (auth.uid() IN (SELECT owner_id FROM ad_slots s JOIN ad_listings l ON s.id = l.slot_id JOIN ad_orders o ON l.id = o.listing_id WHERE o.id = order_id) OR auth.jwt() ->> 'role' = 'admin');

-- reports: own only
CREATE POLICY "Own reports" ON reports USING (auth.uid() = user_id);

-- admin_audit_log: admin only
CREATE POLICY "Admin log" ON admin_audit_log USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- projects: owner + members read/write based on role
CREATE POLICY "Projects access" ON projects FOR SELECT USING (auth.uid() = owner_id OR visibility = 'public' OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()));
CREATE POLICY "Projects insert" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- notebooks, attachments: tied to project access
CREATE POLICY "Notebooks access" ON notebooks USING (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM project_members WHERE project_id = notebooks.project_id AND user_id = auth.uid()))));

-- project_members: owner manage
CREATE POLICY "Members manage" ON project_members USING (auth.uid() = (SELECT owner_id FROM projects WHERE id = project_id)) WITH CHECK (true);

-- merch: public read, owner manage
CREATE POLICY "Merch read" ON merch FOR SELECT USING (true);
CREATE POLICY "Own merch" ON merch USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- music_releases: visibility-based
CREATE POLICY "Music read" ON music_releases FOR SELECT USING (visibility = 'public' OR auth.uid() = owner_id);
CREATE POLICY "Own music" ON music_releases USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- settings: own only
CREATE POLICY "Own settings" ON settings USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- connectors_tokens: own only
CREATE POLICY "Own connectors" ON connectors_tokens USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);