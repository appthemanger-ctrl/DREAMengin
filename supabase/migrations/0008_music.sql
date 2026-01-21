
create table if not exists music_releases (
  id uuid primary key default gen_random_uuid(),
  artist_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  release_url text, -- link to spotify/apple/soundcloud/youtube
  cover_url text,
  release_date date default now(),
  tags text[] default '{}',
  created_at timestamptz default now()
);
alter table music_releases enable row level security;
create policy music_owner on music_releases using (auth.uid()=artist_user_id) with check (auth.uid()=artist_user_id);
create policy music_public_read on music_releases for select using (true);
