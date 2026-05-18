'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  createSharedDreamSession,
  leaveSharedDreamSession,
  broadcastCursorPosition,
  broadcastEdit,
  broadcastStatePatch,
  broadcastDataPacket,
  broadcastMediaSync,
  broadcastControlSignal,
  broadcastModeChange,
  broadcastPresenceUpdate,
  type SharedDreamSession,
  type DreamBroadcastPayload,
  type DreamEventHandler,
  type DreamSessionMode,
  type DreamSessionRole,
  type DreamPresenceUpdate,
} from '@/lib/sharedDream';
import { generateInviteLink } from '@/lib/collaboration';

export interface PeerState {
  peerId: string;
  cursor?: { x: number; y: number };
  joinedAt?: string;
  role?: DreamSessionRole;
  mode?: DreamSessionMode;
  lastSeenAt?: string;
  presence?: DreamPresenceUpdate;
}

export interface UseSharedDreamReturn {
  session: SharedDreamSession | null;
  peers: Record<string, PeerState>;
  isConnected: boolean;
  role: DreamSessionRole;
  mode: DreamSessionMode;
  participantCount: number;
  broadcastCursor(x: number, y: number): void;
  broadcast(payload: unknown): void;
  broadcastStatePatch(payload: unknown): void;
  broadcastDataPacket(payload: unknown): void;
  broadcastMediaSync(command: string, timeRefSec?: number, payload?: Record<string, unknown>): void;
  broadcastControlSignal(signal: string, payload?: Record<string, unknown>): void;
  broadcastModeChange(mode: DreamSessionMode): void;
  broadcastPresenceUpdate(presence: DreamPresenceUpdate): void;
  getInviteLink: () => string;
  onEvent(handler: DreamEventHandler): () => void;
}

function getSupabase( ){
  return createClient();
}

export function useSharedDream(channelId: string): UseSharedDreamReturn {
  const [session, setSession] = useState<SharedDreamSession | null>(null);
  const [isConnected, setConnected] = useState(false);
  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const [mode, setMode] = useState<DreamSessionMode>('shared_dream');
  const [role, setRole] = useState<DreamSessionRole>('participant');

  const externalHandlers = useRef<Set<DreamEventHandler>>(new Set());

  const internalHandler = useCallback((payload: DreamBroadcastPayload) => {
    setPeers((prev) => {
      const updated = { ...prev };

      if (payload.type === 'peer_join') {
        updated[payload.peerId] = {
          peerId: payload.peerId,
          joinedAt: new Date((payload.timestamp ?? Date.now())).toISOString(),
          role: payload.role,
          mode: payload.mode,
          lastSeenAt: new Date((payload.timestamp ?? Date.now())).toISOString(),
        };
      } else if (payload.type === 'peer_leave') {
        delete updated[payload.peerId];
      } else if (payload.type === 'cursor') {
        const d = payload.data as { x: number; y: number };
        updated[payload.peerId] = {
          ...updated[payload.peerId],
          peerId: payload.peerId,
          cursor: { x: d.x, y: d.y },
          role: payload.role ?? updated[payload.peerId]?.role,
          mode: payload.mode ?? updated[payload.peerId]?.mode,
          lastSeenAt: new Date((payload.timestamp ?? Date.now())).toISOString(),
        };
      } else if (payload.type === 'presence_update') {
        updated[payload.peerId] = {
          ...updated[payload.peerId],
          peerId: payload.peerId,
          role: payload.role ?? updated[payload.peerId]?.role,
          mode: payload.mode ?? updated[payload.peerId]?.mode,
          presence: payload.data as DreamPresenceUpdate,
          lastSeenAt: new Date((payload.timestamp ?? Date.now())).toISOString(),
        };
      } else if (payload.type === 'mode_change') {
        const nextMode = (payload.data as { mode?: DreamSessionMode } | undefined)?.mode;
        if (nextMode) {
          setMode(nextMode);
          if (updated[payload.peerId]) {
            updated[payload.peerId] = {
              ...updated[payload.peerId],
              mode: nextMode,
              lastSeenAt: new Date((payload.timestamp ?? Date.now())).toISOString(),
            };
          }
        }
      } else if (updated[payload.peerId]) {
        updated[payload.peerId] = {
          ...updated[payload.peerId],
          role: payload.role ?? updated[payload.peerId]?.role,
          mode: payload.mode ?? updated[payload.peerId]?.mode,
          lastSeenAt: new Date((payload.timestamp ?? Date.now())).toISOString(),
        };
      }

      return updated;
    });

    externalHandlers.current.forEach((handler) => handler(payload));
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!channelId) {
      setSession(null);
      setConnected(false);
      setPeers({});
      return;
    }

    const supabase = getSupabase();

    createSharedDreamSession(channelId, supabase, [internalHandler], {
      role: 'participant',
      mode: 'shared_dream',
    }).then((nextSession) => {
      if (!mounted) {
        void leaveSharedDreamSession(nextSession);
        return;
      }
      setSession(nextSession);
      setConnected(true);
      setMode(nextSession.mode);
      setRole(nextSession.role);
      const mapped: Record<string, PeerState> = {};
      for (const peer of nextSession.peers) {
        mapped[peer.peerId] = {
          peerId: peer.peerId,
          role: peer.role,
          mode: peer.mode,
          joinedAt: new Date(peer.joinedAt).toISOString(),
          lastSeenAt: new Date(peer.lastSeenAt).toISOString(),
          presence: peer.presence,
        };
      }
      setPeers(mapped);
    }).catch(() => {
      setConnected(false);
    });

    return () => {
      mounted = false;
      setSession((current) => {
        if (current) void leaveSharedDreamSession(current);
        return null;
      });
      setConnected(false);
      setPeers({});
    };
  }, [channelId, internalHandler]);

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (session) broadcastCursorPosition(session, x, y);
  }, [session]);

  const broadcast = useCallback((payload: unknown) => {
    if (session) broadcastEdit(session, payload);
  }, [session]);

  const sendStatePatch = useCallback((payload: unknown) => {
    if (session) broadcastStatePatch(session, payload);
  }, [session]);

  const sendDataPacket = useCallback((payload: unknown) => {
    if (session) broadcastDataPacket(session, payload);
  }, [session]);

  const sendMediaSync = useCallback((command: string, timeRefSec?: number, payload?: Record<string, unknown>) => {
    if (session) broadcastMediaSync(session, command, timeRefSec, payload);
  }, [session]);

  const sendControlSignal = useCallback((signal: string, payload?: Record<string, unknown>) => {
    if (session) broadcastControlSignal(session, signal, payload);
  }, [session]);

  const changeMode = useCallback((nextMode: DreamSessionMode) => {
    if (!session) return;
    broadcastModeChange(session, nextMode, role);
    setMode(nextMode);
  }, [session, role]);

  const sendPresence = useCallback((presence: DreamPresenceUpdate) => {
    if (session) broadcastPresenceUpdate(session, presence);
  }, [session]);

  const getInviteLink = useCallback((): string => {
    if (!channelId || typeof window === 'undefined') return '';
    return generateInviteLink(window.location.href, channelId);
  }, [channelId]);

  const onEvent = useCallback((handler: DreamEventHandler) => {
    externalHandlers.current.add(handler);
    return () => {
      externalHandlers.current.delete(handler);
    };
  }, []);

  const localPeerCountOffset =
    isConnected && session && !Object.prototype.hasOwnProperty.call(peers, session.peerId)
      ? 1
      : 0;

  return {
    session,
    peers,
    isConnected,
    role,
    mode,
    participantCount: Object.keys(peers).length + localPeerCountOffset,
    broadcastCursor,
    broadcast,
    broadcastStatePatch: sendStatePatch,
    broadcastDataPacket: sendDataPacket,
    broadcastMediaSync: sendMediaSync,
    broadcastControlSignal: sendControlSignal,
    broadcastModeChange: changeMode,
    broadcastPresenceUpdate: sendPresence,
    getInviteLink,
    onEvent,
  };
}
