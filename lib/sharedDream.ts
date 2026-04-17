/**
 * Shared Dream Collaboration
 *
 * Real-time multi-user session layer using Supabase Realtime broadcast.
 * No WebRTC — pure broadcast channels.
 *
 * Usage:
 *   const session = await createSharedDreamSession('channel-123', supabase);
 *   broadcastCursorPosition(session, x, y);
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SharedDreamSession {
  channelId: string;
  channel: RealtimeChannel;
  /** Local peer ID (random UUID assigned at session creation/join). */
  peerId: string;
}

export type DreamEventType = 'cursor' | 'edit' | 'peer_join' | 'peer_leave' | 'custom';

export interface DreamBroadcastPayload {
  type: DreamEventType;
  peerId: string;
  data: unknown;
}

export type DreamEventHandler = (payload: DreamBroadcastPayload) => void;

// ─── Internal helpers ────────────────────────────────────────────────────────

function generatePeerId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildChannel(
  channelId: string,
  supabaseClient: SupabaseClient,
  peerId: string,
  handlers: DreamEventHandler[]
): RealtimeChannel {
  const channel = supabaseClient.channel(`dream:${channelId}`, {
    config: { broadcast: { self: false } },
  });

  channel.on('broadcast', { event: 'dream_event' }, ({ payload }) => {
    const typedPayload = payload as DreamBroadcastPayload;
    handlers.forEach((h) => h(typedPayload));
  });

  return channel;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * createSharedDreamSession(channelId, supabaseClient)
 *
 * Creates a new broadcast session and subscribes to it.
 * Announces presence with a peer_join event.
 */
export async function createSharedDreamSession(
  channelId: string,
  supabaseClient: SupabaseClient,
  handlers: DreamEventHandler[] = []
): Promise<SharedDreamSession> {
  const peerId  = generatePeerId();
  const channel = buildChannel(channelId, supabaseClient, peerId, handlers);

  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
    });
  });

  // Announce join
  await channel.send({
    type: 'broadcast',
    event: 'dream_event',
    payload: {
      type: 'peer_join',
      peerId,
      data: { joinedAt: new Date().toISOString() },
    } satisfies DreamBroadcastPayload,
  });

  return { channelId, channel, peerId };
}

/**
 * joinSharedDreamSession(channelId, supabaseClient)
 *
 * Joins an existing session (identical to create — Supabase channels
 * are idempotent).
 */
export async function joinSharedDreamSession(
  channelId: string,
  supabaseClient: SupabaseClient,
  handlers: DreamEventHandler[] = []
): Promise<SharedDreamSession> {
  return createSharedDreamSession(channelId, supabaseClient, handlers);
}

/**
 * broadcastCursorPosition(session, x, y)
 */
export function broadcastCursorPosition(
  session: SharedDreamSession,
  x: number,
  y: number
): void {
  session.channel.send({
    type: 'broadcast',
    event: 'dream_event',
    payload: {
      type: 'cursor',
      peerId: session.peerId,
      data: { x, y },
    } satisfies DreamBroadcastPayload,
  });
}

/**
 * broadcastEdit(session, payload)
 *
 * Broadcasts an arbitrary edit payload to all session peers.
 */
export function broadcastEdit(session: SharedDreamSession, payload: unknown): void {
  session.channel.send({
    type: 'broadcast',
    event: 'dream_event',
    payload: {
      type: 'edit',
      peerId: session.peerId,
      data: payload,
    } satisfies DreamBroadcastPayload,
  });
}

/**
 * leaveSharedDreamSession(session)
 *
 * Announces leave and unsubscribes.
 */
export async function leaveSharedDreamSession(session: SharedDreamSession): Promise<void> {
  await session.channel.send({
    type: 'broadcast',
    event: 'dream_event',
    payload: {
      type: 'peer_leave',
      peerId: session.peerId,
      data: { leftAt: new Date().toISOString() },
    } satisfies DreamBroadcastPayload,
  });
  await session.channel.unsubscribe();
}
