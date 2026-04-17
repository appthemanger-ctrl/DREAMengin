'use client';

/**
 * useSharedDream — React hook for Shared Dream sessions
 *
 * Usage:
 *   const { broadcast, onEvent, peers, session } = useSharedDream('channel-abc');
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  createSharedDreamSession,
  leaveSharedDreamSession,
  broadcastCursorPosition,
  broadcastEdit,
  type SharedDreamSession,
  type DreamBroadcastPayload,
  type DreamEventHandler,
} from '../lib/sharedDream';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeerState {
  peerId: string;
  cursor?: { x: number; y: number };
  joinedAt?: string;
}

export interface UseSharedDreamReturn {
  session: SharedDreamSession | null;
  peers: Record<string, PeerState>;
  isConnected: boolean;
  /** Broadcast a cursor position. */
  broadcastCursor(x: number, y: number): void;
  /** Broadcast an arbitrary edit payload. */
  broadcast(payload: unknown): void;
  /** Register a callback for incoming events. */
  onEvent(handler: DreamEventHandler): () => void;
}

// ─── Supabase client factory (uses env vars) ──────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSharedDream(channelId: string): UseSharedDreamReturn {
  const [session, setSession]       = useState<SharedDreamSession | null>(null);
  const [isConnected, setConnected] = useState(false);
  const [peers, setPeers]           = useState<Record<string, PeerState>>({});

  // External event handlers registered via onEvent()
  const externalHandlers = useRef<Set<DreamEventHandler>>(new Set());

  // Internal handler that processes all incoming events
  const internalHandler = useCallback((payload: DreamBroadcastPayload) => {
    // Update peer state
    setPeers((prev) => {
      const updated = { ...prev };
      if (payload.type === 'peer_join') {
        updated[payload.peerId] = {
          peerId: payload.peerId,
          joinedAt: (payload.data as { joinedAt: string }).joinedAt,
        };
      } else if (payload.type === 'peer_leave') {
        delete updated[payload.peerId];
      } else if (payload.type === 'cursor') {
        const d = payload.data as { x: number; y: number };
        updated[payload.peerId] = {
          ...updated[payload.peerId],
          peerId: payload.peerId,
          cursor: { x: d.x, y: d.y },
        };
      }
      return updated;
    });

    // Forward to external handlers
    externalHandlers.current.forEach((h) => h(payload));
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    createSharedDreamSession(channelId, supabase, [internalHandler]).then((s) => {
      if (!mounted) {
        leaveSharedDreamSession(s);
        return;
      }
      setSession(s);
      setConnected(true);
    });

    return () => {
      mounted = false;
      setSession((s) => {
        if (s) leaveSharedDreamSession(s);
        return null;
      });
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (session) broadcastCursorPosition(session, x, y);
    },
    [session]
  );

  const broadcast = useCallback(
    (payload: unknown) => {
      if (session) broadcastEdit(session, payload);
    },
    [session]
  );

  const onEvent = useCallback((handler: DreamEventHandler) => {
    externalHandlers.current.add(handler);
    return () => {
      externalHandlers.current.delete(handler);
    };
  }, []);

  return { session, peers, isConnected, broadcastCursor, broadcast, onEvent };
}
