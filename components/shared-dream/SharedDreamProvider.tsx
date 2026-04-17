'use client';

/**
 * components/shared-dream/SharedDreamProvider.tsx — §38 Shared Dream Collaboration
 *
 * React context provider that manages the real-time collaboration session.
 * Supports WebRTC DataChannel (≤8 peers) and Supabase Realtime (>8 peers).
 *
 * Exports useSharedDream() hook with:
 *   { participants, sendEdit, onEdit, cursors }
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  createCollabSession,
  generateInviteLink,
  parseInviteLink,
  broadcastEdit,
  broadcastCursor,
  type CollabSession,
  type CollabEventHandler,
  type PeerInfo,
  type CollabSessionOptions,
} from '@/lib/collaboration';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CursorPosition {
  peerId: string;
  x:      number;
  y:      number;
}

export interface SharedDreamContextValue {
  /** Whether the session is connected. */
  connected:    boolean;
  /** All known participants including self. */
  participants: readonly PeerInfo[];
  /** Current cursors by peerId. */
  cursors:      readonly CursorPosition[];
  /** Broadcast an edit payload to all peers. */
  sendEdit:     (edit: unknown) => Promise<void>;
  /** Register an edit callback; returns unsubscribe fn. */
  onEdit:       (cb: (edit: unknown, fromPeer: string) => void) => () => void;
  /** Broadcast this user's cursor position. */
  moveCursor:   (x: number, y: number) => Promise<void>;
  /** Generate an invite link for this session. */
  getInviteLink: () => string;
  /** Current session channel ID. */
  channelId:    string | null;
  /** Leave and clean up the session. */
  leave:        () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SharedDreamContext = createContext<SharedDreamContextValue | null>(null);

// ─── Provider Props ───────────────────────────────────────────────────────────

export interface SharedDreamProviderProps {
  /** Optional explicit channel ID. If omitted, a new channel is created. */
  channelId?:      string;
  sessionOptions?: Partial<CollabSessionOptions>;
  children:        React.ReactNode;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SharedDreamProvider({
  channelId: propChannelId,
  sessionOptions = {},
  children,
}: SharedDreamProviderProps) {
  const [session,      setSession]      = useState<CollabSession | null>(null);
  const [connected,    setConnected]    = useState(false);
  const [participants, setParticipants] = useState<readonly PeerInfo[]>([]);
  const [cursors,      setCursors]      = useState<readonly CursorPosition[]>([]);
  const [channelId,    setChannelId]    = useState<string | null>(propChannelId ?? null);

  const editListeners = useRef(new Set<(edit: unknown, peer: string) => void>());

  // ── Connect ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const id = propChannelId ?? (
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    );

    // Check for invite in URL (accept flow)
    const urlChannelId =
      typeof window !== 'undefined'
        ? parseInviteLink(window.location.href)
        : null;

    const finalChannelId = urlChannelId ?? id;

    createCollabSession(finalChannelId, sessionOptions)
      .then((sess) => {
        if (!mounted) { sess.leave().catch(() => {}); return; }
        setSession(sess);
        setConnected(true);
        setChannelId(finalChannelId);
        setParticipants([...sess.peers]);

        sess.onMessage(((payload) => {
          if (!mounted) return;
          if (payload.type === 'peer_join' || payload.type === 'peer_leave') {
            setParticipants([...sess.peers]);
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
          }
        }) as CollabEventHandler);
      })
      .catch((err) => {
        console.error('[SharedDreamProvider] Failed to connect:', err);
      });

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propChannelId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendEdit = useCallback(
    async (edit: unknown) => {
      if (!session) return;
      await broadcastEdit(session, edit);
    },
    [session],
  );

  const moveCursor = useCallback(
    async (x: number, y: number) => {
      if (!session) return;
      await broadcastCursor(session, x, y);
    },
    [session],
  );

  const onEdit = useCallback(
    (cb: (edit: unknown, peer: string) => void): () => void => {
      editListeners.current.add(cb);
      return () => { editListeners.current.delete(cb); };
    },
    [],
  );

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
    sendEdit,
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSharedDream()
 *
 * Access the shared dream collaboration context.
 * Must be used inside a <SharedDreamProvider>.
 */
export function useSharedDream(): SharedDreamContextValue {
  const ctx = useContext(SharedDreamContext);
  if (!ctx) {
    throw new Error('useSharedDream() must be used inside <SharedDreamProvider>');
  }
  return ctx;
}
