
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text,
  bio text,
  theme jsonb default '{}'::jsonb,
  visibility text not null default 'public' check (visibility in ('private','followers','public')),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy profiles_owner_all on profiles
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profiles_public_read on profiles for select
  using (visibility = 'public' or auth.uid() = user_id);
