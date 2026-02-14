-- 20260214000000_security_axioms.sql
-- DREAM ENGINE: Security by Default + Privacy by Design (RLS enforcement)
-- Idempotent: safe to run multiple times.

-- ------------------------------------------------------------
-- 0) Helper: ensure RLS is enabled (won't hurt if already on)
-- ------------------------------------------------------------
alter table if exists public.profiles enable row level security;
alter table if exists public.follows enable row level security;
alter table if exists public.app_posts enable row level security;
alter table if exists public.feed_items enable row level security;
alter table if exists public.feed_rules enable row level security;
alter table if exists public.widget_instances enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.settings enable row level security;

-- ------------------------------------------------------------
-- 1) PROFILES
-- - Public read is allowed (common pattern)
-- - Only owner can insert/update
-- ------------------------------------------------------------
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Optional: if you want users to delete their own profile row (usually handled by auth delete):
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id);

-- ------------------------------------------------------------
-- 2) FOLLOWS
-- - Only the follower can create/delete their follows
-- - Reads: follower can read their own follow graph
-- ------------------------------------------------------------
drop policy if exists "follows_select_own" on public.follows;
create policy "follows_select_own"
on public.follows
for select
using (auth.uid() = follower_id);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
on public.follows
for insert
with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
on public.follows
for delete
using (auth.uid() = follower_id);

-- ------------------------------------------------------------
-- 3) POSTS (app_posts)
-- - Owner can CRUD their posts
-- - Public can read public posts
-- - Followers can read follower-visible posts
-- ------------------------------------------------------------
drop policy if exists "posts_select" on public.app_posts;
create policy "posts_select"
on public.app_posts
for select
using (
  auth.uid() = user_id
  or visibility = 'public'
  or (
    visibility = 'followers'
    and exists (
      select 1
      from public.follows f
      where f.follower_id = auth.uid()
        and f.followed_id = public.app_posts.user_id
    )
  )
);

drop policy if exists "posts_insert_own" on public.app_posts;
create policy "posts_insert_own"
on public.app_posts
for insert
with check (auth.uid() = user_id);

drop policy if exists "posts_update_own" on public.app_posts;
create policy "posts_update_own"
on public.app_posts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.app_posts;
create policy "posts_delete_own"
on public.app_posts
for delete
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4) FEED ITEMS (private per user)
-- ------------------------------------------------------------
drop policy if exists "feed_items_select_own" on public.feed_items;
create policy "feed_items_select_own"
on public.feed_items
for select
using (auth.uid() = user_id);

drop policy if exists "feed_items_insert_own" on public.feed_items;
create policy "feed_items_insert_own"
on public.feed_items
for insert
with check (auth.uid() = user_id);

drop policy if exists "feed_items_update_own" on public.feed_items;
create policy "feed_items_update_own"
on public.feed_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "feed_items_delete_own" on public.feed_items;
create policy "feed_items_delete_own"
on public.feed_items
for delete
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5) FEED RULES (private per user)
-- ------------------------------------------------------------
drop policy if exists "feed_rules_select_own" on public.feed_rules;
create policy "feed_rules_select_own"
on public.feed_rules
for select
using (auth.uid() = user_id);

drop policy if exists "feed_rules_write_own" on public.feed_rules;
create policy "feed_rules_write_own"
on public.feed_rules
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6) WIDGET INSTANCES (private per user)
-- ------------------------------------------------------------
drop policy if exists "widgets_select_own" on public.widget_instances;
create policy "widgets_select_own"
on public.widget_instances
for select
using (auth.uid() = user_id);

drop policy if exists "widgets_write_own" on public.widget_instances;
create policy "widgets_write_own"
on public.widget_instances
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7) NOTIFICATIONS (private per user)
-- ------------------------------------------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists "notifications_write_own" on public.notifications;
create policy "notifications_write_own"
on public.notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8) SETTINGS (private per user)
-- ------------------------------------------------------------
drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own"
on public.settings
for select
using (auth.uid() = user_id);

drop policy if exists "settings_write_own" on public.settings;
create policy "settings_write_own"
on public.settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
