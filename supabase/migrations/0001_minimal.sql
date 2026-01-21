
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists widget_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  "order" int not null default 0,
  enabled boolean not null default true,
  settings_json jsonb not null default '{}'::jsonb
);
alter table widget_instances enable row level security;
create policy widgets_owner on widget_instances using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists error_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid null references auth.users(id) on delete set null,
  path text,
  message text not null,
  stack text,
  created_at timestamptz default now(),
  status text not null default 'open' check (status in ('open','triaged','fixed'))
);
alter table error_reports enable row level security;
create policy errors_owner_read on error_reports for select using (auth.jwt() ->> 'role' = 'admin' or auth.uid() = reporter_id);
create policy errors_owner_write on error_reports for insert with check (true);
