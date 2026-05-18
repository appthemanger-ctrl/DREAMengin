'use client';

/**
 * components/shared-dream/dream.SharedDreamRuntime.tsx
 *
 * The actual UI that renders when a user is in a persistent SharedDream session.
 *
 * Used by: app/dreamdmbar/dualruntime/page.tsx
 *
 * What it renders:
 *   - SharedDreamProvider wrapping everything (gives all children the Realtime channel)
 *   - SharedDreamCanvas split: top = shared engin state grid, bottom = invite + activity
 *   - Each active Engin shows its last saved state as a tappable card
 *   - Participant cursors on the shared canvas (already built into SharedDreamCanvas)
 *   - Live participant count + invite button from InviteFlow
 *   - Activity timeline (who joined, what Engins were active)
 *
 * State continuity:
 *   - channelId from useSharedDreamSession → passed to SharedDreamProvider
 *     → all users on same Supabase Realtime channel
 *   - savedEnginState → shown as "last state" cards, user can tap to restore
 *   - saveEnginState called when Engin publishes via useEnginCoopSync
 */

import React, { useCallback, useEffect, useState } from 'react';
import { SharedDreamProvider } from './dream.SharedDreamProvider';
import { SharedDreamCanvas } from './dream.SharedDreamCanvas';
import { InviteFlow } from './dream.InviteFlow';
import { useSharedDreamSession } from '@/lib/sharedDream/useSharedDreamSession';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

// ── Engin slot config ────────────────────────────────────────────────────────

const ENGIN_SLOTS = [
  { key: 'engin:game',       label: 'GameEngin',       icon: '🎮', route: '/app/daydream/games' },
  { key: 'engin:starmaker',  label: 'StarMaker',       icon: '🎵', route: '/app/daydream/music' },
  { key: 'engin:lab',        label: 'LabEngin',        icon: '🧪', route: '/app/daydream/lab' },
  { key: 'engin:code',       label: 'CodeEngin',       icon: '💻', route: '/app/daydream/code' },
  { key: 'engin:brand',      label: 'BrandEngin',      icon: '✦',  route: '/app/daydream/brand' },
  { key: 'engin:content',    label: 'ContentEngin',    icon: '📸', route: '/app/daydream/create' },
] as const;

type EnginKey = (typeof ENGIN_SLOTS)[number]['key'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function summarizeEnginState(state): string {
  const parts: string[] = [];
  if (typeof state['selectedGame'] === 'string') parts.push(state['selectedGame']);
  if (typeof state['selectedPlayableGame'] === 'string') parts.push(state['selectedPlayableGame']);
  if (typeof state['bpm'] === 'number') parts.push(`${state['bpm']} BPM`);
  if (typeof state['musicalKey'] === 'string') parts.push(state['musicalKey']);
  if (typeof state['activeExperiment'] === 'string') parts.push(state['activeExperiment']);
  if (typeof state['currentNote'] === 'string') parts.push(state['currentNote']);
  return parts.length > 0 ? parts.join(' · ') : 'Active';
}

// ── Inner (inside SharedDreamProvider) ───────────────────────────────────────

interface InnerProps {
  savedEnginState: Record<string, Record<string, unknown>>;
  // FIX: Explicitly set array values to readonly to match state hooks
  members: readonly { userId: string; role: string; lastSeenAt: string }[];
  activity: readonly { id: string; kind: string; label: string; createdAt: string }[];
  logActivity: (kind: string, label: string, meta?: Record<string, unknown>) => void;
  sessionId: string | null;
}

function SharedDreamRuntimeInner({
  savedEnginState,
  members,
  activity,
  logActivity,
  sessionId,
}: InnerProps) {
  const [activeEngins, setActiveEngins] = useState<Set<EnginKey>>(() => {
    const saved = new Set<EnginKey>();
    for (const slot of ENGIN_SLOTS) {
      if (savedEnginState[slot.key]) saved.add(slot.key);
    }
    return saved;
  });

  // When an Engin publishes via the bridge, mark it active and log activity
  useEffect(() => {
    const unsubs = ENGIN_SLOTS.map((slot) =>
      bridge.subscribe(('shared_dream', `${slot.key}:state`, payload) => {
        setActiveEngins((prev) => {
          if (prev.has(slot.key)) return prev;
          const next = new Set(prev);
          next.add(slot.key);
          logActivity('engin_activated', `${slot.label} went live`, { enginKey: slot.key });
          return next;
        });
        // Forward to the shared_dream channel so all peers see it
        void bridge.emitDurable('shared_dream', `${slot.key}:state`, payload as Record<string, unknown>);
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [logActivity]);

  const handleOpenEngin = useCallback((route: string, label: string, enginKey: EnginKey) => {
    logActivity('engin_activated', `${label} opened`, { enginKey });
    // Open in the bottom runtime region via the bridge
    bridge.emit('shared_dream', 'open:engin', { route, enginKey });
  }, [logActivity]);

  // Shared view: the engin state grid
  const sharedContent = (
    <div style={{ padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Synchronized Engins
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 8 }}>
        {ENGIN_SLOTS.map((slot) => {
          const state = savedEnginState[slot.key];
          const isActive = activeEngins.has(slot.key);
          return (
            <button
              key={slot.key}
              type="button"
              onClick={() => handleOpenEngin(slot.route, slot.label, slot.key)}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(91,168,212,0.22), rgba(135,206,235,0.12))'
                  : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? '1px solid rgba(91,168,212,0.45)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 16 }}>{slot.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? 'rgba(135,206,235,0.9)' : 'rgba(255,255,255,0.45)' }}>
                  {slot.label}
                </span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                )}
              </div>
              {state ? (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>
                  {summarizeEnginState(state)}
                </span>
              ) : (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>tap to open</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Private view: invite + members + activity
  const privateContent = (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Invite row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            Shared Dream
            {sessionId && (
              <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                #{sessionId.slice(0, 8)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {members.length} member{members.length !== 1 ? 's' : ''} · state persists when you leave
          </div>
        </div>
        <InviteFlow />
      </div>

      {/* Members row */}
      {members.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {members.slice(0, 8).map((m) => (
            <div
              key={m.userId}
              title={`${m.role} · last seen ${timeAgo(m.lastSeenAt)}`}
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '3px 7px',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {m.userId.slice(0, 8)}
              <span style={{ marginLeft: 4, color: 'rgba(255,255,255,0.25)' }}>
                {timeAgo(m.lastSeenAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Activity timeline */}
      {activity.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
          {activity.slice(0, 10).map((a) => (
            <div
              key={a.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}
            >
              <span style={{
                flexShrink: 0,
                fontSize: 8,
                padding: '2px 5px',
                borderRadius: 4,
                background: a.kind === 'joined' ? 'rgba(74,222,128,0.15)' : a.kind === 'left' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.07)',
                color: a.kind === 'joined' ? '#4ade80' : a.kind === 'left' ? '#f87171' : 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}>
                {a.kind.replace('_', ' ')}
              </span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.label}
              </span>
              <span style={{ flexShrink: 0, color: 'rgba(255,255,255,0.2)' }}>
                {timeAgo(a.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <SharedDreamCanvas componentId="shared-dream-runtime" sharedContent={sharedContent}>
      {privateContent}
    </SharedDreamCanvas>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export interface SharedDreamRuntimeProps {
  /** UUID of an existing shared_dream_sessions row. Omit to create a new session. */
  sessionId?: string;
  /** Called with the new session ID once a fresh session is created. */
  onSessionCreated?: (sessionId: string) => void;
}

export default function SharedDreamRuntime({ sessionId: propSessionId, onSessionCreated }: SharedDreamRuntimeProps) {
  const { channelId, sessionId, isLoading, savedEnginState, members, activity, logActivity } =
    useSharedDreamSession({ sessionId: propSessionId });

  // Notify parent when a brand-new session is auto-created
  const prevSidRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (sessionId && !propSessionId && sessionId !== prevSidRef.current) {
      prevSidRef.current = sessionId;
      onSessionCreated?.(sessionId);
    }
  }, [sessionId, propSessionId, onSessionCreated]);

  if (isLoading || !channelId) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 13, gap: 10,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(91,168,212,0.6)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        Connecting to shared dream…
      </div>
    );
  }

  return (
    <SharedDreamProvider channelId={channelId} sessionOptions={{ mode: 'shared_dream', role: 'participant' }}>
      <SharedDreamRuntimeInner
        savedEnginState={savedEnginState}
        members={members}
        activity={activity}
        logActivity={logActivity}
        sessionId={sessionId}
      />
    </SharedDreamProvider>
  );
}
