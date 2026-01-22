
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table products enable row level security;
create policy prod_owner on products using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy prod_public_read on products for select using (active=true);
