-- 20260226000000_admin_lock.sql
-- Creates the durable admin lockout table.
--
-- A single row (id = TRUE enforced by primary key + check) stores the
-- locked flag.  Once a wrong admin password is entered the API route
-- sets locked = TRUE via the service-role key.  Because this lives in
-- the database it survives cold starts, redeployments, and multi-region
-- Vercel instances.  The only way to unlock is to manually update the
-- row in the Supabase dashboard (or run a migration).
--
-- Idempotent: safe to run multiple times.

create table if not exists public.admin_lock (
  -- Singleton constraint: only one row is ever allowed.
  id      boolean primary key default true,
  locked  boolean not null default false,
  locked_at timestamptz,
  reason  text,
  constraint admin_lock_singleton check (id = true)
);

-- Insert the initial unlocked row if not already present.
insert into public.admin_lock (id, locked)
values (true, false)
on conflict (id) do nothing;

-- Enable RLS but add NO public policies.
-- The table is only accessible via the service-role key used by the
-- API route — regular (anon / authenticated) clients cannot read or
-- write it at all.
alter table public.admin_lock enable row level security;
