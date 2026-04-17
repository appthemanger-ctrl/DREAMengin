'use client';

/**
 * SharedDreamShell — Real-time collaborative Engin wrapper
 *
 * Wraps any Engin/content with a Supabase Realtime broadcast session.
 * Layout:
 *   • Session banner (peers, audio call, invite link, exit)
 *   • Shared view   (top half — read-only projection for collaborators)
 *   • Your controls (bottom half — live interactive controls)
 *   • Peer cursor overlays
 *
 * Architecture: docs/LAW.md §15 (Shared Dream Collaboration)
 * Uses: hooks/useSharedDream → lib/sharedDream (Supabase Realtime broadcast)
 * Audio call: WebRTC getUserMedia — microphone only, no server relay.
 */

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSharedDream } from '@/hooks/useSharedDream';
import type { DreamBroadcastPayload } from '@/lib/sharedDream';
import { Mic, MicOff, Users, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SharedDreamShellProps {
  /** Realtime channel ID. Share this ID via the invite link. */
  channelId: string;
  /** The Engin or content to collaborate on. */
  children: ReactNode;
  /** Optional title shown in the session banner. */
  title?: string;
  /** Called when the user exits the shared session. */
  onExit?: () => void;
}

interface PeerCursor {
  peerId: string;
  x: number;
  y: number;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PEER_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];

function peerColor(peerId: string): string {
  let hash = 0;
  for (let i = 0; i < peerId.length; i++) {
    hash = (hash * 31 + peerId.charCodeAt(i)) & 0xffff;
  }
  return PEER_COLORS[hash % PEER_COLORS.length] ?? '#fbbf24';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SharedDreamShell({
  channelId,
  children,
  title,
  onExit,
}: SharedDreamShellProps) {
  const { session, peers, isConnected, broadcastCursor, broadcast, onEvent } =
    useSharedDream(channelId);

  const [peerCursors, setPeerCursors] = useState<Record<string, PeerCursor>>({});
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [editLog, setEditLog] = useState<string[]>([]);
  const [inviteCopied, setInviteCopied] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // ── Listen for incoming events ──
  useEffect(() => {
    const unsub = onEvent((payload: DreamBroadcastPayload) => {
      if (payload.type === 'cursor') {
        const d = payload.data as { x: number; y: number };
        setPeerCursors((prev) => ({
          ...prev,
          [payload.peerId]: {
            peerId: payload.peerId,
            x: d.x,
            y: d.y,
            color: peerColor(payload.peerId),
          },
        }));
      } else if (payload.type === 'edit') {
        const d = payload.data as { summary?: string };
        const entry = `[${payload.peerId.slice(0, 6)}] ${d.summary ?? 'edit'}`;
        setEditLog((prev) => [...prev.slice(-19), entry]);
      } else if (payload.type === 'peer_leave') {
        setPeerCursors((prev) => {
          const next = { ...prev };
          delete next[payload.peerId];
          return next;
        });
      }
    });
    return unsub;
  }, [onEvent]);

  // ── Broadcast cursor position on mouse move ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = shellRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      broadcastCursor(x, y);
    },
    [broadcastCursor],
  );

  // ── Audio call toggle ──
  const toggleAudio = useCallback(async () => {
    if (isAudioActive) {
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
      setIsAudioActive(false);
      broadcast({ type: 'audio_leave', summary: 'left audio call' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = stream;
      setIsAudioActive(true);
      setAudioError(null);
      broadcast({ type: 'audio_join', summary: 'joined audio call' });
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [isAudioActive, broadcast]);

  // ── Copy invite link ──
  const copyInvite = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await navigator.clipboard.writeText(`${origin}/shared-dream?channel=${channelId}`);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }, [channelId]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Suppress unused-variable warning; session is used for presence awareness
  void session;

  const peerList = Object.values(peers);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="shared-dream-shell flex flex-col"
      style={{ height: '100%', minHeight: 0, background: '#07080f', overflow: 'hidden' }}
    >
      {/* ── Session banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          background: 'rgba(251,191,36,0.06)',
          borderBottom: '1px solid rgba(251,191,36,0.14)',
          flexShrink: 0,
          flexWrap: 'wrap',
          rowGap: 4,
        }}
      >
        {/* Live indicator */}
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isConnected ? '#34d399' : '#ef4444',
            flexShrink: 0,
            boxShadow: isConnected ? '0 0 5px #34d399' : 'none',
          }}
        />

        <span
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', flex: 1, fontWeight: 600, minWidth: 80 }}
        >
          {title ?? 'Shared Dream'} &middot; {isConnected ? 'Live' : 'Connecting…'}
        </span>

        {/* Peer count + avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.35)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            {peerList.length + 1}
          </span>
          {peerList.slice(0, 4).map((p) => (
            <div
              key={p.peerId}
              title={`Peer ${p.peerId.slice(0, 6)}`}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: peerColor(p.peerId),
                border: '1.5px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#000',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {p.peerId.slice(0, 1).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Audio call toggle */}
        <button
          type="button"
          onClick={() => void toggleAudio()}
          title={isAudioActive ? 'Leave audio call' : 'Join audio call'}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            border: `1px solid ${isAudioActive ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`,
            background: isAudioActive ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
            color: isAudioActive ? '#ef4444' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isAudioActive
            ? <MicOff style={{ width: 11, height: 11 }} />
            : <Mic style={{ width: 11, height: 11 }} />}
          {isAudioActive ? 'Leave' : 'Call'}
        </button>

        {/* Invite link */}
        <button
          type="button"
          title="Copy invite link"
          onClick={() => void copyInvite()}
          style={{
            padding: '4px 9px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            border: '1px solid rgba(251,191,36,0.22)',
            background: 'rgba(251,191,36,0.07)',
            color: inviteCopied ? '#fbbf24' : 'rgba(251,191,36,0.65)',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          {inviteCopied ? '✓ Copied' : '🔗 Invite'}
        </button>

        {/* Exit */}
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            title="Exit shared session"
            style={{
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {/* Microphone error */}
      {audioError && (
        <div
          style={{
            padding: '5px 14px',
            background: 'rgba(239,68,68,0.10)',
            borderBottom: '1px solid rgba(239,68,68,0.18)',
            fontSize: 11,
            color: '#ef4444',
            flexShrink: 0,
          }}
        >
          ⚠ {audioError}
        </div>
      )}

      {/* ── Two-pane canvas ── */}
      <div
        ref={shellRef}
        className="relative flex-1 flex flex-col overflow-hidden"
        style={{ minHeight: 0 }}
        onMouseMove={handleMouseMove}
      >
        {/* Peer cursor overlays */}
        {Object.values(peerCursors).map((cursor) => (
          <div
            key={cursor.peerId}
            aria-hidden
            style={{
              position: 'absolute',
              left: `${cursor.x}%`,
              top: `${cursor.y}%`,
              pointerEvents: 'none',
              zIndex: 50,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: cursor.color,
                border: '1.5px solid rgba(255,255,255,0.7)',
                boxShadow: `0 0 6px ${cursor.color}`,
              }}
            />
            <div
              style={{
                marginTop: 2,
                padding: '1px 5px',
                borderRadius: 4,
                background: cursor.color,
                fontSize: 9,
                color: '#000',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {cursor.peerId.slice(0, 6)}
            </div>
          </div>
        ))}

        {/* Top half — shared view (pointer-events disabled so it's read-only) */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            borderBottom: '1.5px solid rgba(251,191,36,0.10)',
            position: 'relative',
            minHeight: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 10,
              zIndex: 10,
              fontSize: 10,
              color: 'rgba(251,191,36,0.55)',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(251,191,36,0.06)',
              pointerEvents: 'none',
            }}
          >
            SHARED VIEW
          </div>
          <div style={{ pointerEvents: 'none', opacity: 0.82, height: '100%' }}>
            {children}
          </div>
        </div>

        {/* Bottom half — private interactive controls */}
        <div
          style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0 }}
        >
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 10,
              zIndex: 10,
              fontSize: 10,
              color: 'rgba(96,165,250,0.65)',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(96,165,250,0.07)',
              pointerEvents: 'none',
            }}
          >
            YOUR CONTROLS
          </div>
          {children}
        </div>
      </div>

      {/* Edit activity log — shows recent peer actions */}
      {editLog.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            maxHeight: 56,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.45)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            padding: '4px 12px',
          }}
        >
          {editLog.slice(-3).map((entry, i) => (
            <div
              key={i}
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}
            >
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SharedDreamShell;
