'use client';

/**
 * lib/intelligence/useSessionIntelligence.ts
 *
 * USE SESSION INTELLIGENCE — 2026
 *
 * React hook that wires the Session Pattern Engine and Session Continuity
 * Engine together. Provides components with:
 *
 *   predictions     — top-3 "what you'll open next" based on your current path
 *   lastSessionSummary — what you were doing in your previous session
 *   sessionDiff     — how today's session compares to last time
 *   currentSessionSummary — live summary of the current session
 *   isLearning      — whether the engine has enough data to predict reliably
 *   tfReady         — whether TF.js is active for enhanced predictions
 *
 * This hook also handles:
 *   - Auto-subscribing to the dreamOSBus for artifact updates
 *   - Persisting the session on page hide / beforeunload
 *   - Feeding subsystem activations to the pattern engine
 *
 * Usage:
 *   const { predictions, sessionDiff } = useSessionIntelligence(currentSubsystemId);
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SessionPatternEngine, type PredictedNext, type PatternEngineState } from './sessionPatternEngine';
import { SessionContinuity, type SessionSummary, type SessionDiff } from './sessionContinuity';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';

export interface SessionIntelligence {
  /** Top-N predictions for the next subsystem you're likely to open. */
  predictions: PredictedNext[];
  /** Summary of the last completed session (null on first ever session). */
  lastSessionSummary: SessionSummary | null;
  /** Diff between current and last session (null on first ever session). */
  sessionDiff: SessionDiff | null;
  /** Live summary of the current session. */
  currentSessionSummary: SessionSummary;
  /** True once the pattern engine has ≥ 3 transitions. */
  isLearning: boolean;
  /** True if TF.js softmax is active for enhanced normalisation. */
  tfReady: boolean;
}

const EMPTY_SUMMARY: SessionSummary = {
  sessionId: 'none',
  startedAt: 0,
  endedAt: 0,
  subsystemsVisited: [],
  subsystemActivationCount: 0,
  primarySubsystem: null,
  artifactCount: 0,
  artifactKinds: [],
  lastArtifactTitle: null,
};

/**
 * Returns live session intelligence for the given subsystem context.
 *
 * @param currentSubsystemId — The currently active subsystem ID (e.g. "CodeEngin").
 *   Pass null or undefined if no subsystem is active.
 * @param topN — Number of predictions to return (default: 3).
 */
export function useSessionIntelligence(
  currentSubsystemId?: string | null,
  topN = 3,
): SessionIntelligence {
  const patternEngineRef = useRef<SessionPatternEngine | null>(null);
  const continuityRef = useRef<SessionContinuity | null>(null);

  const [predictions, setPredictions] = useState<PredictedNext[]>([]);
  const [engineState, setEngineState] = useState<PatternEngineState>({
    transitionCount: 0,
    subsystemsSeen: [],
    isReady: false,
    tfReady: false,
  });
  const [lastSessionSummary, setLastSessionSummary] = useState<SessionSummary | null>(null);
  const [sessionDiff, setSessionDiff] = useState<SessionDiff | null>(null);
  const [currentSessionSummary, setCurrentSessionSummary] = useState<SessionSummary>(EMPTY_SUMMARY);

  // Initialise both engines once on mount.
  useEffect(() => {
    const pattern = new SessionPatternEngine();
    const continuity = new SessionContinuity();

    patternEngineRef.current = pattern;
    continuityRef.current = continuity;

    let cancelled = false;

    async function boot() {
      await Promise.all([pattern.init(), continuity.init()]);
      if (cancelled) return;

      setLastSessionSummary(continuity.getLastSessionSummary());
      setSessionDiff(continuity.getSessionDiff());
      setCurrentSessionSummary(continuity.getCurrentSessionSummary());
      setEngineState(pattern.getState());
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to dreamOSBus to keep the continuity engine's artifact snapshot
  // in sync and refresh the diff / summaries whenever new artifacts arrive.
  useEffect(() => {
    const unsubscribe = dreamOSBus.subscribe((snapshot) => {
      const continuity = continuityRef.current;
      if (!continuity) return;

      const lastArtifact = snapshot.artifacts[0] ?? null;
      continuity.updateArtifacts(
        snapshot.artifacts.length,
        snapshot.artifacts.map((a) => a.kind),
        lastArtifact?.title ?? null,
      );

      setCurrentSessionSummary(continuity.getCurrentSessionSummary());
      setSessionDiff(continuity.getSessionDiff());
    });

    return unsubscribe;
  }, []);

  // Ingest subsystem activations when the active subsystem changes.
  const prevSubsystemRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const prev = prevSubsystemRef.current;
    prevSubsystemRef.current = currentSubsystemId;

    if (!currentSubsystemId) return;
    if (currentSubsystemId === prev) return;

    const pattern = patternEngineRef.current;
    const continuity = continuityRef.current;

    if (pattern) {
      pattern.ingest(currentSubsystemId);
      const state = pattern.getState();
      setEngineState(state);
      if (state.isReady) {
        setPredictions(pattern.predict(currentSubsystemId, topN));
      }
    }

    if (continuity) {
      continuity.recordActivation(currentSubsystemId);
      setCurrentSessionSummary(continuity.getCurrentSessionSummary());
      setSessionDiff(continuity.getSessionDiff());
    }
  }, [currentSubsystemId, topN]);

  // Persist on page hide / beforeunload.
  const persistSession = useCallback(() => {
    const continuity = continuityRef.current;
    if (continuity) {
      void continuity.persist();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', persistSession);
    window.addEventListener('beforeunload', persistSession);
    return () => {
      document.removeEventListener('visibilitychange', persistSession);
      window.removeEventListener('beforeunload', persistSession);
    };
  }, [persistSession]);

  return {
    predictions,
    lastSessionSummary,
    sessionDiff,
    currentSessionSummary,
    isLearning: engineState.isReady,
    tfReady: engineState.tfReady,
  };
}
