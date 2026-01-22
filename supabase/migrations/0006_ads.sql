
create table if not exists ad_slots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location text not null check (location in ('header','sidebar','between_feed')),
  title text not null,
  price_per_day numeric not null check (price_per_day >= 0),
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz default now()
);
alter table ad_slots enable row level security;
create policy ad_slots_owner on ad_slots using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy ad_slots_public_read on ad_slots for select using (visibility='public' or auth.uid()=owner_id);

create table if not exists ad_listings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references ad_slots(id) on delete cascade,
  available_from date not null,
  available_to date not null,
  created_at timestamptz default now()
);
alter table ad_listings enable row level security;
create policy ad_listings_owner on ad_listings using (exists (select 1 from ad_slots s where s.id=ad_listings.slot_id and s.owner_id=auth.uid())) with check (exists (select 1 from ad_slots s where s.id=ad_listings.slot_id and s.owner_id=auth.uid()));
create policy ad_listings_public_read on ad_listings for select using (true);

create table if not exists ad_creatives (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('text','image','embed')),
  content jsonb not null, -- {text:'', image_url:'', link:'', embed:'...'}
  created_at timestamptz default now()
);
alter table ad_creatives enable row level security;
create policy ad_creatives_owner on ad_creatives using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists ad_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  slot_id uuid not null references ad_slots(id) on delete cascade,
  creative_id uuid not null references ad_creatives(id) on delete cascade,
  run_from date not null,
  run_to date not null,
  status text not null default 'requested' check (status in ('requested','approved','rejected','running','ended')),
  total_price numeric not null check (total_price >= 0),
  created_at timestamptz default now()
);
alter table ad_orders enable row level security;
create policy ad_orders_owner_buyer on ad_orders using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);
create policy ad_orders_owner_seller on ad_orders for select using (exists (select 1 from ad_slots s where s.id=ad_orders.slot_id and s.owner_id=auth.uid()));

create table if not exists ad_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references ad_orders(id) on delete cascade,
  type text not null check (type in ('impression','click')),
  created_at timestamptz default now()
);
alter table ad_events enable row level security;
create policy ad_events_owner_read on ad_events for select using (exists (select 1 from ad_orders o join ad_slots s on s.id=o.slot_id where o.id=ad_events.order_id and (o.buyer_id=auth.uid() or s.owner_id=auth.uid())));

