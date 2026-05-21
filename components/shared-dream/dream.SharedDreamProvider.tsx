'use client';

import {
    broadcastControlSignal,
    broadcastCursor,
    broadcastDataPacket,
    broadcastEdit,
    broadcastMediaSync,
    broadcastModeChange,
    broadcastPresenceUpdate,
    broadcastStatePatch,
    createCollabSession,
    generateInviteLink,
    parseInviteLink,
    type CollabEventHandler,
    type CollabMode,
    type CollabPayload,
    type CollabSession,
    type CollabSessionOptions,
    type PeerInfo,
    type PresenceUpdateData,
    type SessionRole,
} from '@/lib/collaboration';
import { createClient } from '@/lib/supabase/client';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

export interface CursorPosition {
  peerId: string;
  x: number;
  y: number;
}

export interface SharedDreamContextValue {
  connected: boolean;
  participants: readonly PeerInfo[];
  cursors: readonly CursorPosition[];
  role: SessionRole;
  mode: CollabMode;
  transport: CollabSession['transport'] | 'local';
  sendEdit: (edit: any) => Promise<void>;
  sendStatePatch: (patch: any) => Promise<void>;
  sendDataPacket: (packet: any) => Promise<void>;
  sendMediaSync: (command: string, timeRefSec?: number, payload?: Record<string, unknown>) => Promise<void>;
  sendControlSignal: (signal: string, payload?: Record<string, unknown>) => Promise<void>;
  sendPresenceUpdate: (presence: PresenceUpdateData) => Promise<void>;
  changeMode: (mode: CollabMode) => Promise<void>;
  onEdit: (cb: (edit: unknown, fromPeer: string) => void) => () => void;
  moveCursor: (x: number, y: number) => Promise<void>;
  getInviteLink: () => string;
  channelId: string | null;
  leave: () => Promise<void>;
}

const SharedDreamContext = createContext<SharedDreamContextValue | null>(null);

export interface SharedDreamProviderProps {
  channelId?: string;
  sessionOptions?: Partial<CollabSessionOptions>;
  children: React.ReactNode;
}

export function SharedDreamProvider({
  channelId: propChannelId,
  sessionOptions = {},
  children,
}: SharedDreamProviderProps) {
  const [session, setSession] = useState<CollabSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<readonly PeerInfo[]>([]);
  const [cursors, setCursors] = useState<readonly CursorPosition[]>([]);
  const [channelId, setChannelId] = useState<string | null>(propChannelId ?? null);
  const [mode, setMode] = useState<CollabMode>(sessionOptions.mode ?? 'shared_dream');
  const [role, setRole] = useState<SessionRole>(sessionOptions.role ?? 'participant');
  const [transport, setTransport] = useState<CollabSession['transport'] | 'local'>('local');

  const editListeners = useRef(new Set<(edit: unknown, peer: string) => void>());

  useEffect(() => {
    let mounted = true;
    let activeSession: CollabSession | null = null;

    const id = propChannelId ?? (
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    );

    const urlChannelId =
      typeof window !== 'undefined'
        ? parseInviteLink(window.location.href)
        : null;

    const finalChannelId = urlChannelId ?? id;

    const options = {
      expectedPeerCount: 40,
      role: 'participant',
      mode: 'shared_dream',
      ...sessionOptions,
      supabaseClient: sessionOptions.supabaseClient ?? createClient(),
    } satisfies CollabSessionOptions;

    createCollabSession(finalChannelId, options)
      .then((nextSession) => {
        if (!mounted) { nextSession.leave().catch(() => {}); return; }
        activeSession = nextSession;
        setSession(nextSession);
        setConnected(true);
        setChannelId(finalChannelId);
        setParticipants([...nextSession.peers]);
        setRole(nextSession.role);
        setMode(nextSession.mode);
        setTransport(nextSession.transport);

        nextSession.onMessage(((payload: CollabPayload) => {
          if (!mounted) return;
          if (payload.type === 'peer_join' || payload.type === 'peer_leave' || payload.type === 'presence_update') {
            setParticipants([...nextSession.peers]);
          }
          if (payload.type === 'mode_change') {
            const nextMode = (payload.data as { mode?: CollabMode } | undefined)?.mode;
            if (nextMode) setMode(nextMode);
            setParticipants([...nextSession.peers]);
          } else if (payload.type === 'cursor') {
            const { x, y } = payload.data as { x: number; y: number };
            setCursors((prev) => {
              const filtered = prev.filter((c) => c.peerId !== payload.peerId);
              return [...filtered, { peerId: payload.peerId, x, y }];
            });
          } else if (payload.type === 'edit') {
            for (const cb of editListeners.current) {
              cb(payload.data, payload.peerId);
            }
          } else if (payload.type === 'peer_leave') {
            setCursors((prev) => prev.filter((c) => c.peerId !== payload.peerId));
          }
        }) as CollabEventHandler);
      })
      .catch((err: unknown ) => {
        console.error('[SharedDreamProvider] Failed to connect:', err);
      });

    return () => {
      mounted = false;
      activeSession?.leave().catch(() => {});
    };
  }, [propChannelId]);

  const sendEdit = useCallback(async (edit: any) => {
    if (!session) return;
    await broadcastEdit(session, edit);
  }, [session]);

  const sendStatePatchEvent = useCallback(async (patch: any) => {
    if (!session) return;
    await broadcastStatePatch(session, patch);
  }, [session]);

  const sendDataPacketEvent = useCallback(async (packet: any) => {
    if (!session) return;
    await broadcastDataPacket(session, packet);
  }, [session]);

  const sendMediaSyncEvent = useCallback(async (
    command: string,
    timeRefSec?: number,
    payload?: Record<string, unknown>,
  ) => {
    if (!session) return;
    await broadcastMediaSync(session, command, timeRefSec, payload);
  }, [session]);

  const sendControlSignalEvent = useCallback(async (
    signal: string,
    payload?: Record<string, unknown>,
  ) => {
    if (!session) return;
    await broadcastControlSignal(session, signal, payload);
  }, [session]);

  const sendPresenceUpdateEvent = useCallback(async (presence: PresenceUpdateData) => {
    if (!session) return;
    await broadcastPresenceUpdate(session, presence);
  }, [session]);

  const changeMode = useCallback(async (nextMode: CollabMode) => {
    if (!session) return;
    await broadcastModeChange(session, nextMode, role);
    setMode(nextMode);
  }, [session, role]);

  const moveCursor = useCallback(async (x: number, y: number) => {
    if (!session) return;
    await broadcastCursor(session, x, y);
  }, [session]);

  const onEdit = useCallback((cb: (edit: unknown, peer: string) => void): () => void => {
    editListeners.current.add(cb);
    return () => { editListeners.current.delete(cb); };
  }, []);

  const getInviteLink = useCallback((): string => {
    if (typeof window === 'undefined' || !channelId) return '';
    return generateInviteLink(window.location.href, channelId);
  }, [channelId]);

  const leave = useCallback(async () => {
    if (!session) return;
    await session.leave();
    setSession(null);
    setConnected(false);
    setParticipants([]);
    setCursors([]);
  }, [session]);

  const value: SharedDreamContextValue = {
    connected,
    participants,
    cursors,
    role,
    mode,
    transport,
    sendEdit,
    sendStatePatch: sendStatePatchEvent,
    sendDataPacket: sendDataPacketEvent,
    sendMediaSync: sendMediaSyncEvent,
    sendControlSignal: sendControlSignalEvent,
    sendPresenceUpdate: sendPresenceUpdateEvent,
    changeMode,
    onEdit,
    moveCursor,
    getInviteLink,
    channelId,
    leave,
  };

  return (
    <SharedDreamContext.Provider value={value}>
      {children}
    </SharedDreamContext.Provider>
  );
}

export function useSharedDream(): SharedDreamContextValue {
  const ctx = useContext(SharedDreamContext);
  if (!ctx) {
    throw new Error('useSharedDream() must be used inside <SharedDreamProvider>');
  }
  return ctx;
}
