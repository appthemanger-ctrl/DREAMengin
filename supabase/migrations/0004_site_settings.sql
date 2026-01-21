
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);
alter table site_settings enable row level security;
create policy settings_admin on site_settings using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
