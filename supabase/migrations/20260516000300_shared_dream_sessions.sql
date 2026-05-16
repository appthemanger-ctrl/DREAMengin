-- Migration: 20260516000300_shared_dream_sessions.sql
--
-- Persistent Collaborative Realities — SharedDream sessions that survive
-- disconnect. When all users leave, their Engin states are snapshotted into
-- this row. Next user to join restores from that snapshot automatically.
--
-- Wires into:
--   lib/collaboration/index.ts (createCollabSession channelId)
--   lib/sharedDream.ts (createSharedDreamSession)
--   useSharedDreamSession hook (reads/writes engin_state + activity)
--   SharedDreamProvider (passes channelId, restores engin_state on join)

create table if not exists public.shared_dream_sessions (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  channel_id       text        not null unique,
  owner_id         uuid        not null references auth.users(id) on delete cascade,
  -- Merged Engin state snapshot saved on last disconnect.
  -- Shape: { "engin:game": { selectedGame, score, ... }, "engin:starmaker": { bpm, beatGrid, ... } }
  engin_state      jsonb       not null default '{}',
  -- Ordered list of engin slot names that were active when state was last saved
  active_engins    text[]      not null default '{}',
  -- Running count of all sessions (member joins) ever
  session_count    integer     not null default 0,
  last_active_at   timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Members who have joined at least once (upserted on join)
create table if not exists public.shared_dream_members (
  session_id   uuid        not null references public.shared_dream_sessions(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  role         text        not null default 'participant',
  joined_at    timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- Activity timeline that persists across sessions
create table if not exists public.shared_dream_activity (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.shared_dream_sessions(id) on delete cascade,
  user_id     uuid        references auth.users(id) on delete set null,
  kind        text        not null, -- 'joined' | 'left' | 'engin_saved' | 'engin_restored' | 'snapshot' | 'invited'
  label       text        not null,
  meta        jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists sds_owner_idx        on public.shared_dream_sessions (owner_id);
create index if not exists sds_last_active_idx  on public.shared_dream_sessions (last_active_at desc);
create index if not exists sdm_user_idx         on public.shared_dream_members (user_id);
create index if not exists sda_session_idx      on public.shared_dream_activity (session_id, created_at desc);

-- RLS
alter table public.shared_dream_sessions enable row level security;
alter table public.shared_dream_members  enable row level security;
alter table public.shared_dream_activity enable row level security;

-- Sessions: any authenticated user can create; members can read; owner can update
create policy "sds: anyone can insert"
  on public.shared_dream_sessions for insert
  with check (owner_id = auth.uid());

create policy "sds: members can read"
  on public.shared_dream_sessions for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.shared_dream_members m
      where m.session_id = id and m.user_id = auth.uid()
    )
  );

create policy "sds: owner or member can update"
  on public.shared_dream_sessions for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.shared_dream_members m
      where m.session_id = id and m.user_id = auth.uid()
    )
  );

-- Members: read own + session peers; write own
create policy "sdm: read session peers"
  on public.shared_dream_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.shared_dream_members peer
      where peer.session_id = session_id and peer.user_id = auth.uid()
    )
  );

create policy "sdm: write own"
  on public.shared_dream_members for insert
  with check (user_id = auth.uid());

create policy "sdm: update own"
  on public.shared_dream_members for update
  using (user_id = auth.uid());

-- Activity: members can read + insert for their session
create policy "sda: members can read"
  on public.shared_dream_activity for select
  using (
    exists (
      select 1 from public.shared_dream_members m
      where m.session_id = session_id and m.user_id = auth.uid()
    )
  );

create policy "sda: members can insert"
  on public.shared_dream_activity for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.shared_dream_members m
      where m.session_id = session_id and m.user_id = auth.uid()
    )
  );

-- Helper: increment session_count + touch last_active_at in one call
create or replace function public.touch_shared_dream_session(p_session_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.shared_dream_sessions
  set last_active_at = now(), session_count = session_count + 1
  where id = p_session_id;
end;
$$;
