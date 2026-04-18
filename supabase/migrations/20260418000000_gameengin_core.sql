-- ============================================================================
-- 20260418000000_gameengin_core.sql
-- GameEngin core tables. Spec: GameENGINspec.md §7.2 (additive only).
-- ============================================================================

-- ── cartridge_design_rules ──────────────────────────────────────────────────
-- Synthesized by Prophet (§3.2 / §4.3) and consumed by Mechanic (§3.4).
create table if not exists public.cartridge_design_rules (
  id              uuid primary key default gen_random_uuid(),
  cartridge_id    text not null,
  genre           text not null,
  emotional_core  text,
  signature_hash  text not null,
  novel           boolean not null default true,
  rules           jsonb not null default '{}'::jsonb,
  rationale       text,
  rationale_source text,
  created_by      text not null default 'prophet',
  created_at      timestamptz not null default now(),
  unique (cartridge_id, signature_hash)
);

create index if not exists idx_cartridge_design_rules_cartridge
  on public.cartridge_design_rules (cartridge_id);
create index if not exists idx_cartridge_design_rules_signature
  on public.cartridge_design_rules (signature_hash);

-- ── gameengin_telemetry ─────────────────────────────────────────────────────
-- High-volume event stream consumed by Maestro (§3.1, §6.6).
-- Hypertable promotion is performed only when the timescaledb extension is
-- available (Supabase Cloud has it on supported plans). Falls back to a
-- partitioning-friendly btree index otherwise.
create table if not exists public.gameengin_telemetry (
  id                bigserial primary key,
  player_id         uuid,
  cartridge_id      text not null,
  event_type        text not null,
  payload           jsonb not null default '{}'::jsonb,
  client_timestamp  timestamptz not null default now(),
  server_timestamp  timestamptz not null default now()
);

create index if not exists idx_gameengin_telemetry_cartridge_time
  on public.gameengin_telemetry (cartridge_id, client_timestamp desc);
create index if not exists idx_gameengin_telemetry_event_type
  on public.gameengin_telemetry (event_type);

do $$
begin
  if exists (select 1 from pg_extension where extname = 'timescaledb') then
    perform create_hypertable('public.gameengin_telemetry', 'client_timestamp', if_not_exists => true);
  end if;
end $$;

-- ── gameengin_snapshots ─────────────────────────────────────────────────────
-- Save state & quick-resume (§1.8). One latest row per (player, cartridge);
-- prior snapshots may be retained as an audit trail.
create table if not exists public.gameengin_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  player_id           uuid not null,
  cartridge_id        text not null,
  snapshot_data       text not null,            -- base64 of WASM-exported buffer
  save_schema_version int  not null default 1,
  client_timestamp    double precision not null,
  created_at          timestamptz not null default now()
);

create index if not exists idx_gameengin_snapshots_latest
  on public.gameengin_snapshots (player_id, cartridge_id, created_at desc);

-- ── Additive extensions to existing tables ──────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ai_audit_log') then
    alter table public.ai_audit_log add column if not exists gameengin_agent text;
    alter table public.ai_audit_log add column if not exists gameengin_cartridge_id text;
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='game_assets') then
    alter table public.game_assets add column if not exists basis_format text;       -- 'UASTC' | 'ETC1S'
    alter table public.game_assets add column if not exists draco_quantization int;  -- 8..14
    alter table public.game_assets add column if not exists generated_by_agent text;
  end if;
end $$;

-- ── RLS (kept permissive for service role; tighten via project policies) ────
alter table public.cartridge_design_rules enable row level security;
alter table public.gameengin_telemetry    enable row level security;
alter table public.gameengin_snapshots    enable row level security;

create policy "service role full access cartridge_design_rules"
  on public.cartridge_design_rules for all to service_role using (true) with check (true);
create policy "service role full access gameengin_telemetry"
  on public.gameengin_telemetry for all to service_role using (true) with check (true);
create policy "service role full access gameengin_snapshots"
  on public.gameengin_snapshots for all to service_role using (true) with check (true);

create policy "players read own snapshots"
  on public.gameengin_snapshots for select to authenticated
  using (player_id = auth.uid());
create policy "players write own snapshots"
  on public.gameengin_snapshots for insert to authenticated
  with check (player_id = auth.uid());
