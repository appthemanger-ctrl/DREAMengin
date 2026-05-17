/**
 * lib/reality/types.ts
 *
 * Persistent Collaborative Realities — core type definitions.
 *
 * A Reality is a named, persistent shared space composed of multiple
 * synchronized Engins. Unlike an ephemeral SharedDream session (which
 * dies when all users disconnect), a Reality has:
 *
 *   • Identity    — a stable ID, name, and creator across all time
 *   • Continuity  — DB-backed state snapshots that survive disconnects
 *   • Composition — multiple Engins can be active simultaneously
 *   • Activity    — a persistent timeline of what happened and who was there
 *   • Membership  — users can be members with roles, even when offline
 *
 * Architecture: lib/ Logic layer per GENERATION_LAW §3.1.
 * Security: AXIOM 4 — RLS enforced server-side, user_id filters client-side.
 * Privacy: AXIOM 5 — activity timeline is scoped to members only.
 */

import type { SessionRole, CollabMode } from '@/lib/collaboration';

// -- Reality identity ----------------------------------------------------------

/** Who can join a Reality without an explicit invite. */
export type RealityMode = 'open' | 'invite_only' | 'private';

/** Which Engins are active inside a Reality and their last known state. */
export interface RealityEnginSlot {
  /** Canonical Engin name: 'GameEngin' | 'MusicEngin' | 'LabEngin' etc. */
  enginName: string;
  /** Unique instance ID within this Reality. */
  instanceId: string;
  /** Whether this Engin slot is currently visible/active. */
  active: boolean;
  /** ISO timestamp of the last state write for this slot. */
  lastStateAt: string | null;
  /** Opaque state blob — hydrated from DB snapshot on Reality load. */
  lastState: Record<string, unknown> | null;
}

/** A named, persistent collaborative Reality. */
export interface Reality {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  mode: RealityMode;
  /** The Supabase Realtime channel ID used for live sync. */
  channelId: string;
  /** The CollabMode used by the SharedDream session underneath. */
  collabMode: CollabMode;
  /** Ordered list of Engin slots that compose this Reality. */
  enginSlots: RealityEnginSlot[];
  /** Total number of activity events (used for UI pulse). */
  activityCount: number;
  createdAt: string;
  lastActivityAt: string;
}

// -- Reality membership --------------------------------------------------------

/** A user's membership record in a Reality. */
export interface RealityMember {
  realityId: string;
  userId: string;
  /** Display name from the member's profile. */
  displayName: string | null;
  avatarUrl: string | null;
  role: SessionRole;
  joinedAt: string;
  lastSeenAt: string;
  /** Whether the member is connected right now (derived from presence). */
  isOnline: boolean;
}

// -- Reality snapshots ---------------------------------------------------------

/**
 * A point-in-time snapshot of the entire Reality state.
 * Captured automatically on disconnect and on demand.
 * Used to restore continuity when users re-enter.
 */
export interface RealitySnapshot {
  id: string;
  realityId: string;
  capturedById: string;
  /**
   * Merged state keyed by Engin instanceId.
   * e.g. { 'game-slot-0': { score: 200, level: 3 }, 'music-slot-0': { bpm: 128 } }
   */
  enginStates: Record<string, Record<string, unknown>>;
  capturedAt: string;
}

// -- Reality activity ----------------------------------------------------------

export type RealityActivityKind =
  | 'member_joined'
  | 'member_left'
  | 'engin_activated'
  | 'engin_state_saved'
  | 'snapshot_captured'
  | 'reality_created'
  | 'reality_renamed'
  | 'mode_changed'
  | 'custom';

/** One entry in the persistent activity timeline of a Reality. */
export interface RealityActivityEntry {
  id: string;
  realityId: string;
  userId: string | null;
  kind: RealityActivityKind;
  label: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

// -- Runtime context -----------------------------------------------------------

/** What the RealityContext exposes to consumers. */
export interface RealityContextValue {
  /** The current Reality. Null until loaded. */
  reality: Reality | null;
  /** True while loading the reality from DB. */
  isLoading: boolean;
  /** Members (all, including offline). */
  members: readonly RealityMember[];
  /** Members who are online right now. */
  onlineMembers: readonly RealityMember[];
  /** Recent activity timeline entries. */
  activity: readonly RealityActivityEntry[];
  /** The current user's role in this Reality. */
  myRole: SessionRole;
  /** Whether the live SharedDream session is connected. */
  isConnected: boolean;
  /** Activate an Engin slot. */
  activateEngin: (instanceId: string) => Promise<void>;
  /** Deactivate an Engin slot. */
  deactivateEngin: (instanceId: string) => Promise<void>;
  /** Persist the merged Engin states as a new snapshot. */
  captureSnapshot: () => Promise<void>;
  /** Restore from the latest snapshot. Returns enginStates map. */
  restoreLatestSnapshot: () => Promise<Record<string, Record<string, unknown>>>;
  /** Broadcast an activity event to all members. */
  logActivity: (kind: RealityActivityKind, label: string, meta?: Record<string, unknown>) => void;
  /** Get the invite link for this Reality. */
  getInviteLink: () => string;
  /** Leave the Reality (does not delete it — state persists). */
  leave: () => Promise<void>;
}
