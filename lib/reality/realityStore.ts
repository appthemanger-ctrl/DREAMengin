/**
 * lib/reality/realityStore.ts
 *
 * DB layer for Persistent Collaborative Realities.
 *
 * All writes use `upsert` / `insert` with RLS-enforced server-side checks.
 * Client-side user_id filters are defence-in-depth (AXIOM 4).
 *
 * Tables used:
 *   collaborative_realities       — identity, config, mode
 *   reality_members               — membership + roles
 *   reality_state_snapshots       — point-in-time Engin state merges
 *   reality_activity_log          — persistent timeline
 *
 * See: supabase/migrations/20260516000200_collaborative_realities.sql
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Reality,
  RealityMember,
  RealitySnapshot,
  RealityActivityEntry,
  RealityMode,
  RealityEnginSlot,
  RealityActivityKind,
} from './types';

// ── helpers ───────────────────────────────────────────────────────────────────

function buildChannelId(realityId: string): string {
  return `reality:${realityId}`;
}

// ── Reality CRUD ──────────────────────────────────────────────────────────────

/** Load a single Reality by ID. Returns null if not found. */
export async function getRealityById(
  supabase: SupabaseClient,
  realityId: string,
): Promise<Reality | null> {
  const { data, error } = await supabase
    .from('collaborative_realities')
    .select('*')
    .eq('id', realityId)
    .single();

  if (error || !data) return null;

  return rowToReality(data);
}

/** List realities the current user is a member of. */
export async function listMyRealities(
  supabase: SupabaseClient,
  userId: string,
): Promise<Reality[]> {
  const { data, error } = await supabase
    .from('collaborative_realities')
    .select('*, reality_members!inner(user_id)')
    .eq('reality_members.user_id', userId)
    .order('last_activity_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map(rowToReality);
}

/** Create a new Reality. The creator is automatically added as host. */
export async function createReality(
  supabase: SupabaseClient,
  userId: string,
  opts: {
    name: string;
    description?: string;
    mode?: RealityMode;
    enginSlots?: RealityEnginSlot[];
  },
): Promise<Reality | null> {
  const { data, error } = await supabase
    .from('collaborative_realities')
    .insert({
      name: opts.name,
      description: opts.description ?? null,
      creator_id: userId,
      mode: opts.mode ?? 'invite_only',
      collab_mode: 'shared_dream',
      engin_slots: opts.enginSlots ?? [],
      activity_count: 0,
    })
    .select()
    .single();

  if (error || !data) return null;

  const reality = rowToReality(data);

  // Auto-join as host
  await joinReality(supabase, userId, reality.id, 'host');

  // Log creation
  await appendActivity(supabase, reality.id, userId, 'reality_created', `Reality "${reality.name}" created`);

  return reality;
}

/** Update the engin slots array (used when activating/deactivating an Engin). */
export async function updateEnginSlots(
  supabase: SupabaseClient,
  realityId: string,
  slots: RealityEnginSlot[],
): Promise<void> {
  await supabase
    .from('collaborative_realities')
    .update({ engin_slots: slots, last_activity_at: new Date().toISOString() })
    .eq('id', realityId);
}

/** Update last_activity_at. Called whenever anything happens in the Reality. */
export async function touchReality(
  supabase: SupabaseClient,
  realityId: string,
): Promise<void> {
  await supabase
    .from('collaborative_realities')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', realityId);
}

// ── Membership ────────────────────────────────────────────────────────────────

/** Join a Reality. Upserts the membership row (idempotent). */
export async function joinReality(
  supabase: SupabaseClient,
  userId: string,
  realityId: string,
  role: 'host' | 'participant' | 'observer' = 'participant',
): Promise<void> {
  await supabase.from('reality_members').upsert(
    {
      reality_id: realityId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'reality_id,user_id' },
  );
}

/** Update the member's last_seen_at (call on heartbeat / reconnect). */
export async function touchMembership(
  supabase: SupabaseClient,
  userId: string,
  realityId: string,
): Promise<void> {
  await supabase
    .from('reality_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('reality_id', realityId)
    .eq('user_id', userId);
}

/** List all members of a Reality (including offline). */
export async function listMembers(
  supabase: SupabaseClient,
  realityId: string,
): Promise<RealityMember[]> {
  const { data, error } = await supabase
    .from('reality_members')
    .select('*, profiles:user_id(display_name, avatar_url)')
    .eq('reality_id', realityId)
    .order('joined_at', { ascending: true });

  if (error || !data) return [];

  const cutoff = Date.now() - 5 * 60 * 1000; // 5 min → online
  return data.map((row): RealityMember => ({
    realityId: row.reality_id as string,
    userId: row.user_id as string,
    displayName: (row.profiles as { display_name: string } | null)?.display_name ?? null,
    avatarUrl: (row.profiles as { avatar_url: string } | null)?.avatar_url ?? null,
    role: row.role as RealityMember['role'],
    joinedAt: row.joined_at as string,
    lastSeenAt: row.last_seen_at as string,
    isOnline: new Date(row.last_seen_at as string).getTime() > cutoff,
  }));
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

/**
 * Save a Reality state snapshot.
 * enginStates is a map of { instanceId → stateBlob }.
 */
export async function saveSnapshot(
  supabase: SupabaseClient,
  realityId: string,
  capturedById: string,
  enginStates: Record<string, Record<string, unknown>>,
): Promise<RealitySnapshot | null> {
  const { data, error } = await supabase
    .from('reality_state_snapshots')
    .insert({
      reality_id: realityId,
      captured_by_id: capturedById,
      engin_states: enginStates,
    })
    .select()
    .single();

  if (error || !data) return null;

  // Increment activity_count
  await supabase.rpc('increment_reality_activity', { p_reality_id: realityId });

  return {
    id: data.id as string,
    realityId: data.reality_id as string,
    capturedById: data.captured_by_id as string,
    enginStates: data.engin_states as Record<string, Record<string, unknown>>,
    capturedAt: data.captured_at as string,
  };
}

/** Load the most recent snapshot for a Reality. */
export async function loadLatestSnapshot(
  supabase: SupabaseClient,
  realityId: string,
): Promise<RealitySnapshot | null> {
  const { data, error } = await supabase
    .from('reality_state_snapshots')
    .select('*')
    .eq('reality_id', realityId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    realityId: data.reality_id as string,
    capturedById: data.captured_by_id as string,
    enginStates: data.engin_states as Record<string, Record<string, unknown>>,
    capturedAt: data.captured_at as string,
  };
}

// ── Activity log ──────────────────────────────────────────────────────────────

/** Append an activity entry to the Reality's timeline. */
export async function appendActivity(
  supabase: SupabaseClient,
  realityId: string,
  userId: string | null,
  kind: RealityActivityKind,
  label: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from('reality_activity_log').insert({
    reality_id: realityId,
    user_id: userId,
    kind,
    label,
    meta,
  });

  // Bump last_activity_at on the reality itself
  await supabase
    .from('collaborative_realities')
    .update({
      last_activity_at: new Date().toISOString(),
      activity_count: supabase.rpc('increment_reality_activity', { p_reality_id: realityId }),
    })
    .eq('id', realityId);
}

/** Load recent activity for a Reality (most-recent first). */
export async function loadActivity(
  supabase: SupabaseClient,
  realityId: string,
  limit = 40,
): Promise<RealityActivityEntry[]> {
  const { data, error } = await supabase
    .from('reality_activity_log')
    .select('*')
    .eq('reality_id', realityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row): RealityActivityEntry => ({
    id: row.id as string,
    realityId: row.reality_id as string,
    userId: row.user_id as string | null,
    kind: row.kind as RealityActivityKind,
    label: row.label as string,
    meta: (row.meta ?? {}) as any,
    createdAt: row.created_at as string,
  }));
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function rowToReality(row: any): Reality {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    description: (row['description'] as string | null) ?? null,
    creatorId: row['creator_id'] as string,
    mode: (row['mode'] as RealityMode) ?? 'invite_only',
    channelId: buildChannelId(row['id'] as string),
    collabMode: (row['collab_mode'] as Reality['collabMode']) ?? 'shared_dream',
    enginSlots: (row['engin_slots'] as RealityEnginSlot[]) ?? [],
    activityCount: (row['activity_count'] as number) ?? 0,
    createdAt: row['created_at'] as string,
    lastActivityAt: row['last_activity_at'] as string,
  };
}

export { buildChannelId };