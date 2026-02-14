-- 20260214000000_security_axioms.sql
-- DREAMengin: Security/Privacy hardening (RLS)
-- Records the exact changes we applied successfully.
-- Idempotent: safe to re-run.

-- Ensure RLS is enabled (safe if already enabled)
alter table if exists public.follows enable row level security;
alter table if exists public.app_posts enable row level security;

-- ------------------------------------------------------------
-- FOLLOWS
-- Your schema uses: follower_id, following_id
-- Goal: stop public follow-graph visibility.
-- ------------------------------------------------------------

drop policy if exists "follows_select" on public.follows;

create policy "follows_select"
on public.follows
for select
to authenticated
using (
  follower_id = auth.uid()
  or following_id = auth.uid()
);

-- Keep existing:
-- - follows_insert (with_check follower_id = auth.uid())
-- - follows_delete (using follower_id = auth.uid())
-- We do NOT rename/replace them.

-- ------------------------------------------------------------
-- APP_POSTS
-- Your schema uses: user_id, visibility ('public' | 'followers' | ...)
-- Goal: public posts visible to anyone; followers posts to followers; owners always.
-- ------------------------------------------------------------

drop policy if exists "app_posts_select_public" on public.app_posts;

create policy "app_posts_select_public"
on public.app_posts
for select
to public
using (
  visibility = 'public'
  or (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or (
        visibility = 'followers'
        and exists (
          select 1
          from public.follows f
          where f.follower_id = auth.uid()
            and f.following_id = public.app_posts.user_id
        )
      )
    )
  )
);

-- Keep existing:
-- - app_posts_insert_own / update_own / delete_own
-- We do NOT replace them.

-- ------------------------------------------------------------
-- IMPORTANT: We intentionally do NOT touch these working systems:
-- - profiles_* (already correct)
-- - feed_items_owner (owned via widgets.owner_id) ✅
-- - feed_rules_crud_own ✅
-- - widget_instances_* (includes is_admin()) ✅
-- Because the generic template does not match your schema.
