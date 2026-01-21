
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists links_json jsonb default '[]'::jsonb;
