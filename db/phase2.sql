-- Phase-2 schema (run once in Supabase SQL Editor)
alter table profiles add column if not exists links_json jsonb default '[]';
alter table profiles add column if not exists bio text default '';

create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users on delete cascade,
  title text not null,
  artist text,
  artwork_url text,
  mp3_url text,
  spotify_uri text,
  created_at timestamptz default now()
);
alter table tracks enable row level security;
drop policy if exists "own tracks" on tracks;
create policy "own tracks" on tracks for all using (auth.uid() = owner);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users on delete cascade,
  title text not null,
  description text,
  price_int int not null,
  file_path text,
  published bool default false,
  created_at timestamptz default now()
);
alter table products enable row level security;
drop policy if exists "own products" on products;
create policy "own products" on products for all using (auth.uid() = owner);
drop policy if exists "public visible" on products;
create policy "public visible" on products for select using (published = true);
