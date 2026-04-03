/**
 * lib/supabase/realtime.ts — Supabase Realtime integration for DREAMengin.
 *
 * Provides typed helpers for:
 *  1. **WhipRev Human Media Pulse** — a live presence/activity feed that broadcasts
 *     user reactions, voice pings, and micro-interactions to followers in real-time.
 *  2. **Live Messaging Channels** — typed wrappers around Supabase Realtime channels
 *     for DreamDM conversations, board threads, and ephemeral rooms.
 *  3. **Presence** — lightweight online/typing indicators for DreamDM.
 *
 * All channel names are prefixed with `de:` (DREAMengin namespace) to avoid
 * collisions with any Supabase-internal channels.
 *
 * Privacy: Channels require an authenticated user.  No data is broadcast
 * to unauthenticated listeners.  See docs/AXIOMS.md §4 (data sovereignty).
 *
 * Architecture justification: docs/ARCHITECTURE.md §6 (Realtime layer).
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// WhipRev Pulse — live human media heartbeat
// ---------------------------------------------------------------------------

/** A single WhipRev pulse event broadcast to followers. */
export interface WhipRevPulse {
  /** Sender user ID */
  userId: string;
  /** Display handle (cached for instant render; authoritative source is `profiles`). */
  handle: string;
  /** Pulse type */
  kind: 'reaction' | 'voice-ping' | 'vibe-check' | 'now-playing' | 'achievement';
  /** Arbitrary payload — shape depends on `kind`. */
  payload: Record<string, unknown>;
  /** ISO-8601 timestamp set by the sender. */
  sentAt: string;
}

/** Options for subscribing to WhipRev pulses. */
export interface WhipRevSubscribeOptions {
  /** The Supabase client (must be authenticated). */
  client: SupabaseClient;
  /** Room / topic ID — typically the user's own profile ID or a group ID. */
  roomId: string;
  /** Callback invoked for every incoming pulse. */
  onPulse: (pulse: WhipRevPulse) => void;
  /** Optional callback when presence state changes (user joined / left). */
  onPresence?: (state: PresenceState[]) => void;
}

/**
 * Subscribe to the WhipRev pulse channel for a given room.
 *
 * Returns an object with:
 *  - `channel` — the underlying `RealtimeChannel` for low-level access.
 *  - `sendPulse(pulse)` — broadcast a pulse to the room.
 *  - `unsubscribe()` — cleanly tear down the subscription.
 */
export function subscribeWhipRev({
  client,
  roomId,
  onPulse,
  onPresence,
}: WhipRevSubscribeOptions): WhipRevHandle {
  const channelName = `de:whiprev:${roomId}`;

  const channel = client.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  // Broadcast listener — incoming pulses from other users.
  channel.on('broadcast', { event: 'pulse' }, ({ payload }) => {
    onPulse(payload as WhipRevPulse);
  });

  // Presence listener (optional).
  if (onPresence) {
    channel.on('presence', { event: 'sync' }, () => {
      const raw = channel.presenceState<PresencePayload>();
      const states: PresenceState[] = Object.entries(raw).map(([key, entries]) => ({
        key,
        userId: entries[0]?.userId ?? key,
        handle: entries[0]?.handle ?? '',
        status: (entries[0]?.status as PresenceStatus) ?? 'online',
        lastSeen: entries[0]?.lastSeen ?? new Date().toISOString(),
      }));
      onPresence(states);
    });
  }

  channel.subscribe();

  return {
    channel,
    sendPulse: (pulse: WhipRevPulse) => {
      channel.send({ type: 'broadcast', event: 'pulse', payload: pulse });
    },
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}

export interface WhipRevHandle {
  channel: RealtimeChannel;
  sendPulse: (pulse: WhipRevPulse) => void;
  unsubscribe: () => void;
}

// ---------------------------------------------------------------------------
// Live Messaging — DreamDM conversations
// ---------------------------------------------------------------------------

/** A typed DreamDM message sent over the realtime channel. */
export interface LiveMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  /** Optional attachment URLs (images, audio clips, etc.). */
  attachments?: string[];
  sentAt: string;
}

export interface LiveMessageSubscribeOptions {
  client: SupabaseClient;
  conversationId: string;
  onMessage: (msg: LiveMessage) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onPresence?: (state: PresenceState[]) => void;
}

/**
 * Subscribe to a DreamDM conversation's live message channel.
 *
 * Returns a handle with `send`, `setTyping`, and `unsubscribe`.
 */
export function subscribeLiveMessages({
  client,
  conversationId,
  onMessage,
  onTyping,
  onPresence,
}: LiveMessageSubscribeOptions): LiveMessageHandle {
  const channelName = `de:dm:${conversationId}`;

  const channel = client.channel(channelName, {
    config: { broadcast: { self: false }, presence: { key: '' } },
  });

  channel.on('broadcast', { event: 'message' }, ({ payload }) => {
    onMessage(payload as LiveMessage);
  });

  if (onTyping) {
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const { userId, isTyping } = payload as { userId: string; isTyping: boolean };
      onTyping(userId, isTyping);
    });
  }

  if (onPresence) {
    channel.on('presence', { event: 'sync' }, () => {
      const raw = channel.presenceState<PresencePayload>();
      const states: PresenceState[] = Object.entries(raw).map(([key, entries]) => ({
        key,
        userId: entries[0]?.userId ?? key,
        handle: entries[0]?.handle ?? '',
        status: (entries[0]?.status as PresenceStatus) ?? 'online',
        lastSeen: entries[0]?.lastSeen ?? new Date().toISOString(),
      }));
      onPresence(states);
    });
  }

  channel.subscribe();

  return {
    channel,
    send: (msg: LiveMessage) => {
      channel.send({ type: 'broadcast', event: 'message', payload: msg });
    },
    setTyping: (userId: string, isTyping: boolean) => {
      channel.send({ type: 'broadcast', event: 'typing', payload: { userId, isTyping } });
    },
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}

export interface LiveMessageHandle {
  channel: RealtimeChannel;
  send: (msg: LiveMessage) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  unsubscribe: () => void;
}

// ---------------------------------------------------------------------------
// Presence types
// ---------------------------------------------------------------------------

export type PresenceStatus = 'online' | 'away' | 'typing' | 'offline';

export interface PresencePayload {
  userId: string;
  handle: string;
  status: PresenceStatus;
  lastSeen: string;
}

export interface PresenceState {
  key: string;
  userId: string;
  handle: string;
  status: PresenceStatus;
  lastSeen: string;
}

// ---------------------------------------------------------------------------
// Presence tracking helper
// ---------------------------------------------------------------------------

/**
 * Track a user's presence in a channel (typing, online/away).
 *
 * Call `updatePresence` when the user's status changes.
 * Call `untrack` on component unmount.
 */
export function trackPresence(
  client: SupabaseClient,
  channelName: string,
  initialPayload: PresencePayload,
): PresenceTracker {
  const channel = client.channel(`de:presence:${channelName}`, {
    config: { presence: { key: initialPayload.userId } },
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track(initialPayload);
    }
  });

  return {
    channel,
    updatePresence: async (payload: Partial<PresencePayload>) => {
      await channel.track({ ...initialPayload, ...payload });
    },
    untrack: async () => {
      await channel.untrack();
      client.removeChannel(channel);
    },
  };
}

export interface PresenceTracker {
  channel: RealtimeChannel;
  updatePresence: (payload: Partial<PresencePayload>) => Promise<void>;
  untrack: () => Promise<void>;
}
