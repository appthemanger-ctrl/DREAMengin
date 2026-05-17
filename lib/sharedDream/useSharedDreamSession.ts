'use client';

/**
 * lib/sharedDream/useSharedDreamSession.ts
 *
 * Persistent collaborative reality hook.
 *
 * What this actually does:
 *   1. Loads or creates a named `shared_dream_sessions` row from Supabase.
 *   2. Returns the stable `channelId` from that row — pass this into
 *      `SharedDreamProvider` so all users land in the same Realtime channel.
 *   3. Exposes `savedEnginState` so each Engin can hydrate from the last
 *      snapshot (same pattern as `useDaydreamPersistence`).
 *   4. Exposes `saveEnginState(enginKey, state)` — debounced write to DB.
 *      Call this in each Engin's `stateSnapshot` callback, identically to how
 *      `persistState` works in useDaydreamPersistence.
 *   5. On unmount (user leaves / closes tab) flushes a final save.
 *   6. Writes to `shared_dream_activity` when user joins/leaves.
 *   7. Reads `shared_dream_members` to show who has been here.
 *
 * Pattern: wraps the same DB patterns as useDaydreamPersistence but keyed
 * to a session ID instead of a user+daydreamType pair, so ALL users in the
 * session share the same state row.
 *
 * Usage (inside dualruntime page or any SharedDream host):
 *
 *   const { channelId, savedEnginState, saveEnginState, members, activity, isLoading } =
 *     useSharedDreamSession({ sessionId: 'my-session-id' });
 *
 *   // Then in each Engin's coopStateSnapshot:
 *   stateSnapshot: () => {
 *     const snap = { type: 'game:state', selectedGame, score };
 *     saveEnginState('engin:game', snap);  // ← persists to DB
 *     return snap;
 *   }
 *
 *   // And hydrate on mount:
 *   const saved = savedEnginState['engin:game'];
 *   if (saved?.selectedGame) setSelectedGame(saved.selectedGame as string);
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SharedDreamMember {
  userId: string;
  role: string;
  joinedAt: string;
  lastSeenAt: string;
}

export interface SharedDreamActivityEntry {
  id: string;
  userId: string | null;
  kind: string;
  label: string;
  createdAt: string;
}

export interface UseSharedDreamSessionOptions {
  /**
   * The UUID of the shared_dream_sessions row.
   * If not provided, a new session is created automatically.
   */
  sessionId?: string;
  /**
   * Name shown in the UI when creating a new session.
   * Ignored if sessionId is provided.
   */
  name?: string;
}

export interface UseSharedDreamSessionResult {
  /** Supabase Realtime channel ID — pass as `channelId` to SharedDreamProvider. */
  channelId: string | null;
  /** The session UUID from shared_dream_sessions.id */
  sessionId: string | null;
  /** True while loading from DB. */
  isLoading: boolean;
  /**
   * Last saved engin states keyed by engin slot name.
   * e.g. { 'engin:game': { selectedGame: 'tetris', score: 400 } }
   * Hydrate each Engin from this on mount (check isLoading first).
   */
  savedEnginState: Record<string, Record<string, unknown>>;
  /**
   * Save this engin's state snapshot to DB (debounced 1 s).
   * Call from inside stateSnapshot() in useEnginCoopSync.
   */
  saveEnginState: (enginKey: string, state: Record<string, unknown>) => void;
  /** Members who have joined this session at least once. */
  members: readonly SharedDreamMember[];
  /** Most recent activity entries (newest first). */
  activity: readonly SharedDreamActivityEntry[];
  /** Manually append an activity entry (e.g. 'engin_restored'). */
  logActivity: (kind: string, label: string, meta?: Record<string, unknown>) => void;
}

// In-memory merge buffer so multiple Engins can call saveEnginState without
// triggering N separate DB writes. All updates are merged and written as one
// JSONB patch after the debounce settles.
type EnginStateBuffer = Record<string, Record<string, unknown>>;

export function useSharedDreamSession() {
  sessionId: propSessionId,
  name = 'Shared Dream',
}: UseSharedDreamSessionOptions = {}): UseSharedDreamSessionResult {
  const [sessionId, setSessionId] = useState<string | null>(propSessionId ?? null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedEnginState, setSavedEnginState] = useState<EnginStateBuffer>({});
  const [members, setMembers] = useState<SharedDreamMember[]>([]);
  const [activity, setActivity] = useState<SharedDreamActivityEntry[]>([]);

  // Merge buffer: accumulates partial Engin state updates before the DB write
  const bufferRef = useRef<EnginStateBuffer>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(propSessionId ?? null);

  // ── Bootstrap: load or create session ────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function bootstrap() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setIsLoading(false); return; }
      userIdRef.current = user.id;

      let sid = propSessionId ?? null;
      let cid: string | null = null;

      if (sid) {
        // Load existing session
        const { data } = await supabase
          .from('shared_dream_sessions')
          .select('id, channel_id, engin_state, active_engins')
          .eq('id', sid)
          .single();

        if (data && !cancelled) {
          cid = data.channel_id as string;
          setSavedEnginState((data.engin_state as EnginStateBuffer) ?? {});
          bufferRef.current = (data.engin_state as EnginStateBuffer) ?? {};
        }
      } else {
        // Create new session
        const newChannelId = `shared-dream:${crypto.randomUUID()}`;
        const { data } = await supabase
          .from('shared_dream_sessions')
          .insert({
            name,
            channel_id: newChannelId,
            owner_id: user.id,
            engin_state: {},
            active_engins: [],
          })
          .select('id, channel_id')
          .single();

        if (data && !cancelled) {
          sid = data.id as string;
          cid = data.channel_id as string;
        }
      }

      if (!cancelled && sid && cid) {
        sessionIdRef.current = sid;
        setSessionId(sid);
        setChannelId(cid);

        // Join as member
        await supabase.from('shared_dream_members').upsert(
          { session_id: sid, user_id: user.id, last_seen_at: new Date().toISOString() },
          { onConflict: 'session_id,user_id' },
        );

        // Touch session
        await supabase.rpc('touch_shared_dream_session', { p_session_id: sid });

        // Log join activity
        await supabase.from('shared_dream_activity').insert({
          session_id: sid,
          user_id: user.id,
          kind: 'joined',
          label: 'Someone joined the shared dream',
        });

        // Load members
        const { data: mData } = await supabase
          .from('shared_dream_members')
          .select('user_id, role, joined_at, last_seen_at')
          .eq('session_id', sid)
          .order('joined_at', { ascending: true });

        if (!cancelled && mData) {
          setMembers(mData.map((m: Record<string, unknown>) => ({
            userId: m.user_id as string,
            role: m.role as string,
            joinedAt: m.joined_at as string,
            lastSeenAt: m.last_seen_at as string,
          })));
        }

        // Load recent activity
        const { data: aData } = await supabase
          .from('shared_dream_activity')
          .select('id, user_id, kind, label, created_at')
          .eq('session_id', sid)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!cancelled && aData) {
          setActivity(aData.map(a: Record<string, unknown> => ({
            id: a.id as string,
            userId: a.user_id as string | null,
            kind: a.kind as string,
            label: a.label as string,
            createdAt: a.created_at as string,
          })));
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    void bootstrap();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSessionId]);

  // ── Flush buffer to DB (debounced) ────────────────────────────────────────

  const flushBuffer = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid || Object.keys(bufferRef.current).length === 0) return;
    const supabase = createClient();
    await supabase
      .from('shared_dream_sessions')
      .update({
        engin_state: bufferRef.current,
        active_engins: Object.keys(bufferRef.current),
        last_active_at: new Date().toISOString(),
      })
      .eq('id', sid);
  }, []);

  // ── saveEnginState: merge into buffer then debounce flush ─────────────────

  const saveEnginState = useCallback((enginKey: string, state: Record<string, unknown>) => {
    bufferRef.current = { ...bufferRef.current, [enginKey]: state };
    setSavedEnginState(prev: Record<string, unknown> => ({ ...prev, [enginKey]: state }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void flushBuffer(); }, 1000);
  }, [flushBuffer]);

  // ── logActivity ───────────────────────────────────────────────────────────

  const logActivity = useCallback((kind: string, label: string, meta: Record<string, unknown> = {}) => {
    const sid = sessionIdRef.current;
    const uid = userIdRef.current;
    if (!sid) return;
    const supabase = createClient();
    const entry: SharedDreamActivityEntry = {
      id: crypto.randomUUID(),
      userId: uid,
      kind,
      label,
      createdAt: new Date().toISOString(),
    };
    setActivity(prev: Record<string, unknown> => [entry, ...prev].slice(0, 30));
    void supabase.from('shared_dream_activity').insert({
      session_id: sid,
      user_id: uid,
      kind,
      label,
      meta,
    });
  }, []);

  // ── Flush on unmount (user leaving) ──────────────────────────────────────

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Best-effort flush — navigator.sendBeacon would be ideal but this is close enough
      void flushBuffer();
      const sid = sessionIdRef.current;
      const uid = userIdRef.current;
      if (sid && uid) {
        const supabase = createClient();
        void supabase.from('shared_dream_activity').insert({
          session_id: sid,
          user_id: uid,
          kind: 'left',
          label: 'Someone left the shared dream',
        });
      }
    };
  }, [flushBuffer]);

  return {
    channelId,
    sessionId,
    isLoading,
    savedEnginState,
    saveEnginState,
    members,
    activity,
    logActivity,
  };
}
