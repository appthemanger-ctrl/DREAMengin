-- Migration: user_blocks table
-- Allows users to block other users. Blocked users cannot see the blocker's
-- profile or send them DMs. RLS enforces owner-only read/write.

create table if not exists user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Index for quick lookup: "who has this user blocked?"
create index if not exists user_blocks_blocker_idx on user_blocks(blocker_id);
-- Index for quick lookup: "is this user blocked by someone?"
create index if not exists user_blocks_blocked_idx on user_blocks(blocked_id);

-- Enable RLS
alter table user_blocks enable row level security;

-- Only the blocker can see/manage their own block entries
create policy "user_blocks_owner_select"
  on user_blocks for select
  using (auth.uid() = blocker_id);

create policy "user_blocks_owner_insert"
  on user_blocks for insert
  with check (auth.uid() = blocker_id);

create policy "user_blocks_owner_delete"
  on user_blocks for delete
  using (auth.uid() = blocker_id);
