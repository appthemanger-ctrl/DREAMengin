
-- Feed & connections
create table if not exists connection_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  account_id text not null,
  status text not null default 'connected' check (status in ('connected','disconnected')),
  tokens jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (user_id, provider, account_id)
);
alter table connection_accounts enable row level security;
create policy ca_owner on connection_accounts using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists follow_sources (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  source_handle text not null,
  created_at timestamptz default now(),
  unique (follower_id, followed_id, source, source_handle)
);
alter table follow_sources enable row level security;
create policy fs_owner on follow_sources using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create table if not exists feed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  source_account text,
  external_id text,
  ts timestamptz not null default now(),
  title text, summary text, url text,
  media_json jsonb, tags_json jsonb,
  importance_score int default 0,
  visibility text not null default 'private' check (visibility in ('private','followers','public')),
  dedupe_hash text,
  saved_by_user boolean default false,
  retained_until timestamptz
);
alter table feed_items enable row level security;
create index if not exists idx_feed_items_user_ts on feed_items (user_id, ts desc);
create index if not exists idx_feed_items_user_retained on feed_items (user_id, retained_until);
create unique index if not exists uniq_feed_dedupe on feed_items (user_id, dedupe_hash);
create policy feed_owner on feed_items using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists feed_rules (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rules_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table feed_rules enable row level security;
create policy rules_owner on feed_rules using (auth.uid() = user_id) with check (auth.uid() = user_id);
