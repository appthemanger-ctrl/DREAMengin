/**
 * lib/sharedDream.ts
 *
 * Backward-compatible facade over the canonical collaboration engine
 * in lib/collaboration.
 */

import type { SupabaseClient } from '@/engine/io';
import {
  createCollabSession,
  broadcastCursor as collabBroadcastCursor,
  broadcastEdit as collabBroadcastEdit,
  broadcastStatePatch as collabBroadcastStatePatch,
  broadcastDataPacket as collabBroadcastDataPacket,
  broadcastMediaSync as collabBroadcastMediaSync,
  broadcastControlSignal as collabBroadcastControlSignal,
  broadcastModeChange as collabBroadcastModeChange,
  broadcastPresenceUpdate as collabBroadcastPresenceUpdate,
  type CollabSession,
  type CollabPayload,
  type CollabEventHandler,
  type CollabEventType,
  type SessionRole,
  type CollabMode,
  type PresenceUpdateData,
} from '@/lib/collaboration';

export type SharedDreamSession = CollabSession;
export type DreamEventType = CollabEventType;
export type DreamBroadcastPayload = CollabPayload;
export type DreamEventHandler = CollabEventHandler;
export type DreamSessionRole = SessionRole;
export type DreamSessionMode = CollabMode;
export type DreamPresenceUpdate = PresenceUpdateData;

export interface SharedDreamSessionOptions {
  role?: SessionRole;
  mode?: CollabMode;
}

async function connectSharedDream(
  channelId: string,
  supabaseClient: SupabaseClient,
  handlers: DreamEventHandler[] = [],
  options: SharedDreamSessionOptions = {},
): Promise<SharedDreamSession> {
  const session = await createCollabSession(channelId, {
    transport: 'supabase',
    supabaseClient,
    expectedPeerCount: 40,
    role: options.role ?? 'participant',
    mode: options.mode ?? 'shared_dream',
  });

  for (const handler of handlers) {
    session.onMessage(handler);
  }

  return session;
}

export async function createSharedDreamSession(
  channelId: string,
  supabaseClient: SupabaseClient,
  handlers: DreamEventHandler[] = [],
  options: SharedDreamSessionOptions = {},
): Promise<SharedDreamSession> {
  return connectSharedDream(channelId, supabaseClient, handlers, options);
}

export async function joinSharedDreamSession(
  channelId: string,
  supabaseClient: SupabaseClient,
  handlers: DreamEventHandler[] = [],
  options: SharedDreamSessionOptions = {},
): Promise<SharedDreamSession> {
  return connectSharedDream(channelId, supabaseClient, handlers, options);
}

export function broadcastCursorPosition(
  session: SharedDreamSession,
  x: number,
  y: number,
): void {
  void collabBroadcastCursor(session, x, y);
}

export function broadcastEdit(session: SharedDreamSession, payload: unknown: void) {
  void collabBroadcastEdit(session, payload);
}

export function broadcastStatePatch(session: SharedDreamSession, patch: unknown: void) {
  void collabBroadcastStatePatch(session, patch);
}

export function broadcastDataPacket(session: SharedDreamSession, packet: unknown: void) {
  void collabBroadcastDataPacket(session, packet);
}

export function broadcastMediaSync(
  session: SharedDreamSession,
  command: string,
  timeRefSec?: number,
  payload?: Record<string, unknown>,
): void {
  void collabBroadcastMediaSync(session, command, timeRefSec, payload);
}

export function broadcastControlSignal(
  session: SharedDreamSession,
  signal: string,
  payload?: Record<string, unknown>,
): void {
  void collabBroadcastControlSignal(session, signal, payload);
}

export function broadcastModeChange(
  session: SharedDreamSession,
  mode: CollabMode,
  changedByRole?: SessionRole,
): void {
  void collabBroadcastModeChange(session, mode, changedByRole);
}

export function broadcastPresenceUpdate(
  session: SharedDreamSession,
  presence: PresenceUpdateData,
): void {
  void collabBroadcastPresenceUpdate(session, presence);
}

export async function leaveSharedDreamSession(session: SharedDreamSession: Promise<void>) {
  await session.leave();
}

// ── Persistent session hook ───────────────────────────────────────────────────
export {
  useSharedDreamSession,
  type UseSharedDreamSessionOptions,
  type UseSharedDreamSessionResult,
  type SharedDreamMember,
  type SharedDreamActivityEntry,
} from './sharedDream/useSharedDreamSession';
