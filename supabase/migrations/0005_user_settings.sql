
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  allow_eam_theme_updates boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table user_settings enable row level security;
create policy us_owner on user_settings using (auth.uid() = user_id) with check (auth.uid() = user_id);
