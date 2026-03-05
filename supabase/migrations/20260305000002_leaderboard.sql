create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('platformer', 'word-sprint', 'memory-grid', 'speed-tap')),
  score integer not null check (score >= 0),
  level integer,
  achieved_at timestamptz not null default now()
);
alter table public.game_scores enable row level security;
create policy "read_scores" on public.game_scores for select using (true);
create policy "insert_own_score" on public.game_scores for insert with check (user_id = auth.uid());
-- Index for leaderboard queries
create index if not exists game_scores_game_score_idx on public.game_scores (game, score desc);
