-- Comments table with RLS (SECURITY.md requires RLS on all user tables)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.app_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
-- Policy: any authenticated user can read public-post comments
create policy "read_comments" on public.comments for select
  using (
    exists (select 1 from public.app_posts where id = post_id and visibility = 'public')
    or user_id = auth.uid()
  );
-- Policy: users can create comments on public posts
create policy "insert_comments" on public.comments for insert
  with check (user_id = auth.uid());
-- Policy: users can delete their own comments
create policy "delete_own_comments" on public.comments for delete
  using (user_id = auth.uid());
