-- rls_private.sql
-- Lock down reads to authenticated users only.
-- POSTS
alter table app_posts enable row level security;
drop policy if exists "public can read public posts" on app_posts;
drop policy if exists "users read their feed" on app_posts;
drop policy if exists "owners manage posts" on app_posts;

create policy "users read their feed"
on app_posts for select
to authenticated
using (true);

create policy "owners manage posts"
on app_posts for all
to authenticated
using (user_id = auth.uid());

create index if not exists app_posts_visibility_idx on app_posts (visibility);

-- MUSIC RELEASES
alter table music_releases enable row level security;
drop policy if exists "public can read public releases" on music_releases;
drop policy if exists "users read releases" on music_releases;
drop policy if exists "owners manage releases" on music_releases;

create policy "users read releases"
on music_releases for select
to authenticated
using (true);

create policy "owners manage releases"
on music_releases for all
to authenticated
using (user_id = auth.uid());
