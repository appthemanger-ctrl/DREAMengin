-- 20260426000000_activity_coop_gameengin_completion.sql
-- Completion slice across Activity-First, Co-op/Solo, and GameEngIN foundations.

alter table if exists public.ad_views
  add column if not exists creator_id uuid references auth.users(id) on delete set null,
  add column if not exists platform_share numeric(10,4) not null default 0,
  add column if not exists creator_share numeric(10,4) not null default 0,
  add column if not exists reward_pool_share numeric(10,4) not null default 0,
  add column if not exists skip_credits_awarded boolean not null default false,
  add column if not exists fraud_reason text;

create index if not exists ad_views_creator_id_idx on public.ad_views (creator_id);

create or replace function public.activity_revenue_split(p_gross numeric)
returns table (platform_share numeric, creator_share numeric, reward_pool_share numeric)
language sql
immutable
as $$
  with split as (
    select
      round(greatest(coalesce(p_gross, 0), 0), 2) as gross,
      round(greatest(coalesce(p_gross, 0), 0) * 0.30, 2) as platform,
      round(greatest(coalesce(p_gross, 0), 0) * 0.50, 2) as creator
  )
  select
    platform,
    creator,
    round(gross - platform - creator, 2)
  from split
$$;

create or replace function public.recalculate_user_metrics(p_user_id uuid)
returns public.user_metrics
language plpgsql
security definer
as $$
declare
  v_activity_points integer := 0;
  v_total_views bigint := 0;
  v_views_per_post numeric := 0;
  v_days_active integer := 0;
  v_total_posts integer := 0;
  v_verified_posts integer := 0;
  v_real_shit_rate numeric := 0;
  v_most_viewed_post_id uuid := null;
  v_most_viewed_count integer := 0;
  v_aqs integer := 0;
  v_metrics public.user_metrics;
begin
  select coalesce(sum(points), 0) into v_activity_points
  from public.activity_points
  where user_id = p_user_id and is_decayed = false and created_at > now() - interval '30 days';

  select count(*) into v_total_posts from public.app_posts where user_id = p_user_id;

  select count(distinct ap.post_id) into v_verified_posts
  from public.activity_points ap
  join public.activity_verification av on av.id = ap.verification_id
  where ap.user_id = p_user_id and ap.post_id is not null and av.verified = true and av.flagged_as_fraud = false;

  select coalesce(count(v.id), 0) into v_total_views
  from public.views v
  join public.app_posts p on p.id = v.post_id
  where p.user_id = p_user_id and v.verified = true and v.is_bot = false and v.is_duplicate = false;

  if v_total_posts > 0 then
    v_views_per_post := round(v_total_views::numeric / v_total_posts::numeric, 2);
    v_real_shit_rate := round((v_verified_posts::numeric / v_total_posts::numeric) * 100, 2);
  end if;

  select pv.post_id, pv.view_count into v_most_viewed_post_id, v_most_viewed_count
  from (
    select v.post_id, count(*)::integer as view_count
    from public.views v
    join public.app_posts p on p.id = v.post_id
    where p.user_id = p_user_id and v.verified = true
    group by v.post_id
    order by count(*) desc
    limit 1
  ) pv;

  select count(distinct date(created_at)) into v_days_active
  from (
    select created_at from public.app_posts where user_id = p_user_id and created_at > now() - interval '30 days'
    union all
    select created_at from public.activity_points where user_id = p_user_id and created_at > now() - interval '30 days'
  ) activity_days;

  if v_days_active > 0 then
    v_aqs := round((v_activity_points * greatest(v_views_per_post, 1)) / v_days_active);
  end if;

  insert into public.user_metrics (
    user_id, aqs, real_shit_rate, total_views, views_per_post,
    activity_points_30d, days_active_30d, most_viewed_post_id,
    most_viewed_count, total_posts, verified_posts, calculated_at, updated_at
  )
  values (
    p_user_id, v_aqs, v_real_shit_rate, v_total_views, v_views_per_post,
    v_activity_points, v_days_active, v_most_viewed_post_id,
    coalesce(v_most_viewed_count, 0), v_total_posts, v_verified_posts, now(), now()
  )
  on conflict (user_id) do update set
    aqs = excluded.aqs,
    real_shit_rate = excluded.real_shit_rate,
    total_views = excluded.total_views,
    views_per_post = excluded.views_per_post,
    activity_points_30d = excluded.activity_points_30d,
    days_active_30d = excluded.days_active_30d,
    most_viewed_post_id = excluded.most_viewed_post_id,
    most_viewed_count = excluded.most_viewed_count,
    total_posts = excluded.total_posts,
    verified_posts = excluded.verified_posts,
    calculated_at = excluded.calculated_at,
    updated_at = excluded.updated_at
  returning * into v_metrics;

  return v_metrics;
end;
$$;

create or replace function public.trigger_recalculate_user_metrics()
returns trigger
language plpgsql
security definer
as $$
declare
  v_owner_id uuid;
begin
  if tg_table_name = 'views' then
    select user_id into v_owner_id from public.app_posts where id = new.post_id;
  else
    v_owner_id := new.user_id;
  end if;

  if v_owner_id is not null then
    perform public.recalculate_user_metrics(v_owner_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_activity_points_metrics on public.activity_points;
create trigger trigger_activity_points_metrics
  after insert or update on public.activity_points
  for each row execute function public.trigger_recalculate_user_metrics();

drop trigger if exists trigger_views_metrics on public.views;
create trigger trigger_views_metrics
  after insert on public.views
  for each row when (new.verified = true)
  execute function public.trigger_recalculate_user_metrics();

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='app_posts') then
    alter table public.app_posts add column if not exists boogie_visibility text not null default 'feed';
    alter table public.app_posts add column if not exists boogie_policy_ref text;
    alter table public.app_posts add column if not exists boogie_reviewed_at timestamptz;
    if not exists (
      select 1 from information_schema.table_constraints
      where table_schema = 'public' and table_name = 'app_posts'
        and constraint_name = 'app_posts_boogie_visibility_check'
    ) then
      alter table public.app_posts add constraint app_posts_boogie_visibility_check
        check (boogie_visibility in ('feed', 'search_only', 'blocked')) not valid;
    end if;
  end if;
end $$;

create or replace view public.feed_eligible_posts as
select p.*
from public.app_posts p
where p.visibility = 'public'
  and coalesce(p.boogie_visibility, 'feed') = 'feed';

create table if not exists public.engin_instances (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  instance_key text not null,
  engin_name text not null,
  instance_id text not null,
  region text not null,
  mode text not null check (mode in ('solo', 'coop')),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, instance_key)
);

alter table public.engin_instances enable row level security;
drop policy if exists "engin_instances_self" on public.engin_instances;
create policy "engin_instances_self" on public.engin_instances for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists public.gameengin_cartridges (
  cartridge_id text primary key,
  title text not null,
  author text not null,
  version text not null,
  dreamr_version integer not null default 1,
  render_mode text not null,
  manifest jsonb not null,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_gameengin_cartridges_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_gameengin_cartridges_updated_at on public.gameengin_cartridges;
create trigger set_gameengin_cartridges_updated_at
  before update on public.gameengin_cartridges
  for each row execute function public.set_gameengin_cartridges_updated_at();

alter table public.gameengin_cartridges enable row level security;
drop policy if exists "gameengin_cartridges_public_read" on public.gameengin_cartridges;
create policy "gameengin_cartridges_public_read" on public.gameengin_cartridges for select using (true);
drop policy if exists "service role full access gameengin_cartridges" on public.gameengin_cartridges;
create policy "service role full access gameengin_cartridges" on public.gameengin_cartridges
  for all to service_role using (true) with check (true);

create or replace function public.award_skip_credits(
  p_user_id uuid,
  p_ad_view_id uuid,
  p_credits integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  if p_credits <= 0 then
    return false;
  end if;

  update public.ad_views
  set skip_credits_awarded = true
  where id = p_ad_view_id
    and viewer_id = p_user_id
    and verified = true
    and skip_credits_awarded = false;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return false;
  end if;

  insert into public.skip_credits (
    user_id,
    credits_balance,
    earned_total,
    last_earned_at,
    updated_at
  )
  values (p_user_id, p_credits, p_credits, now(), now())
  on conflict (user_id) do update set
    credits_balance = public.skip_credits.credits_balance + excluded.credits_balance,
    earned_total = public.skip_credits.earned_total + excluded.earned_total,
    last_earned_at = now(),
    updated_at = now();

  return true;
end;
$$;
