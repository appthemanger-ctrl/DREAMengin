-- DREAMengin_schema-final.sql
-- Consolidated critical fixes for Supabase Auth + profiles coherence.
-- Safe to run multiple times.

-- Ensure required extension
create extension if not exists pgcrypto;

-- PROFILES TABLE (mirror of auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_handle on public.profiles(handle);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Create a profile row for every new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    -- default handle: user_<first 8 chars>
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8),
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Ensure trigger exists
-- (Supabase requires the trigger on auth.users)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

-- Public read profiles (safe baseline)
drop policy if exists "Public profiles read" on public.profiles;
create policy "Public profiles read"
on public.profiles for select
using (true);

-- Users can update own profile
drop policy if exists "Own profiles update" on public.profiles;
create policy "Own profiles update"
on public.profiles for update
using (auth.uid() = id);

-- Users can insert their own profile (rare but safe)
drop policy if exists "Own profiles insert" on public.profiles;
create policy "Own profiles insert"
on public.profiles for insert
with check (auth.uid() = id);
