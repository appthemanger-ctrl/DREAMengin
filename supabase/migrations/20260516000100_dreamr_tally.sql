-- Migration: dreamr_tally
-- Creates the table used by POST /api/dreamr/tally to record DreamR publish
-- view events emitted by DreamRCore over the dual-runtime bridge.
--
-- Design:
--   • Unique on (content_id, sharer_id, viewer_id) so upsert is idempotent.
--   • RLS: each user can only read/write their own viewer rows.
--   • No foreign keys to app_posts — content_id is a soft reference so tally
--     records survive post deletion (important for analytics).

create table if not exists public.dreamr_tally (
  id           uuid        primary key default gen_random_uuid(),
  content_id   text        not null,
  sharer_id    text        not null,
  viewer_id    text        not null references auth.users(id) on delete cascade,
  tallied_at   timestamptz not null default now(),

  constraint dreamr_tally_unique unique (content_id, sharer_id, viewer_id)
);

-- Indexes for common access patterns
create index if not exists dreamr_tally_content_idx on public.dreamr_tally (content_id);
create index if not exists dreamr_tally_sharer_idx  on public.dreamr_tally (sharer_id);
create index if not exists dreamr_tally_viewer_idx  on public.dreamr_tally (viewer_id);
create index if not exists dreamr_tally_time_idx    on public.dreamr_tally (tallied_at desc);

-- Enable Row Level Security
alter table public.dreamr_tally enable row level security;

-- Policy: a viewer can read their own tally rows
create policy "dreamr_tally: viewer reads own rows"
  on public.dreamr_tally
  for select
  using (viewer_id = auth.uid()::text);

-- Policy: a viewer can insert/update their own tally rows
create policy "dreamr_tally: viewer writes own rows"
  on public.dreamr_tally
  for insert
  with check (viewer_id = auth.uid()::text);

-- Policy: upsert update path (on conflict do update)
create policy "dreamr_tally: viewer updates own rows"
  on public.dreamr_tally
  for update
  using (viewer_id = auth.uid()::text);

-- Aggregate view: tally counts per content item (used by analytics)
-- Returns how many unique viewers a piece of content has earned via DreamR.
create or replace view public.dreamr_tally_counts as
  select
    content_id,
    sharer_id,
    count(distinct viewer_id) as unique_viewers,
    max(tallied_at)           as last_tallied_at
  from public.dreamr_tally
  group by content_id, sharer_id;
