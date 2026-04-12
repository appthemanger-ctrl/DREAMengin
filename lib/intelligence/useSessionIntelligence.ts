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
 *   - Auto-subscribing to the dreamOSBus for artifact updates AND subsystem
 *     navigation events — no explicit currentSubsystemId prop required.
 *   - Persisting the pattern matrix and session across page hide / beforeunload.
 *   - Restoring the pattern matrix from the previous session on mount.
 *   - Feeding subsystem activations to the pattern engine.
 *
 * Usage:
 *   // Auto-wired via dreamOSBus (recommended):
 *   const { predictions, sessionDiff } = useSessionIntelligence();
 *
 *   // Or with an explicit subsystem override:
 *   const { predictions } = useSessionIntelligence('CodeEngin');
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SessionPatternEngine, type PredictedNext, type PatternEngineState } from './sessionPatternEngine';
import { SessionContinuity, type SessionSummary, type SessionDiff } from './sessionContinuity';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';

/** localStorage key used to persist the bigram transition matrix across sessions. */
export const PATTERN_MATRIX_LS_KEY = 'dreamengin-pattern-matrix';

export interface SessionIntelligence {
  /** Top-N predictions for the next subsystem you're likely to open. */
  predictions: PredictedNext[];
  /** Summary of the last completed session (null on first ever session). */
  lastSessionSummary: SessionSummary | null;
  /** Diff between current and last session (null on first ever session). */
  sessionDiff: SessionDiff | null;
  /** Live summary of the current session. */
  currentSessionSummary: SessionSummary;
  /** True once the pattern engine has ≥ 3 learned transitions this session. */
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
 * Returns live session intelligence, optionally scoped to a specific subsystem.
 *
 * @param currentSubsystemId — Optional override for the current subsystem.
 *   When omitted the hook auto-ingests from the dreamOSBus runtimeContexts.
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

      // Restore persisted bigram matrix from previous session.
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem(PATTERN_MATRIX_LS_KEY);
          if (raw) {
            const saved = JSON.parse(raw) as Record<string, Record<string, number>>;
            pattern.importMatrix(saved);
          }
        } catch {
          // Corrupt or absent matrix — start fresh.
        }
      }

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

  // Shared ingest helper used by both bus-auto-ingest and prop-based paths.
  const prevBusSubsystemRef = useRef<string | null>(null);
  const ingestSubsystem = useCallback(
    (subsystemId: string, prevRef: React.MutableRefObject<string | null>) => {
      if (!subsystemId) return;
      if (subsystemId === prevRef.current) return;
      prevRef.current = subsystemId;

      const pattern = patternEngineRef.current;
      const continuity = continuityRef.current;

      if (pattern) {
        pattern.ingest(subsystemId);
        const state = pattern.getState();
        setEngineState(state);
        setPredictions(pattern.predict(subsystemId, topN));
      }
      if (continuity) {
        continuity.recordActivation(subsystemId);
        setCurrentSessionSummary(continuity.getCurrentSessionSummary());
        setSessionDiff(continuity.getSessionDiff());
      }
    },
    [topN],
  );

  // Subscribe to dreamOSBus for artifact updates AND automatic subsystem ingest.
  useEffect(() => {
    const unsubscribe = dreamOSBus.subscribe((snapshot) => {
      const continuity = continuityRef.current;

      // Artifact snapshot → update continuity engine.
      if (continuity) {
        const lastArtifact = snapshot.artifacts[0] ?? null;
        continuity.updateArtifacts(
          snapshot.artifacts.length,
          snapshot.artifacts.map((a) => a.kind),
          lastArtifact?.title ?? null,
        );
        setCurrentSessionSummary(continuity.getCurrentSessionSummary());
        setSessionDiff(continuity.getSessionDiff());
      }

      // runtimeContexts → auto-ingest the dominant subsystem.
      const dominant = snapshot.runtimeContexts.find((ctx) => ctx.dominant)
        ?? snapshot.runtimeContexts[0];
      if (dominant?.subsystemId) {
        ingestSubsystem(dominant.subsystemId, prevBusSubsystemRef);
      }
    });

    return unsubscribe;
  }, [ingestSubsystem]);

  // Ingest subsystem activations when the explicit prop changes (override path).
  const prevPropSubsystemRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPropSubsystemRef.current;
    prevPropSubsystemRef.current = currentSubsystemId ?? null;

    if (!currentSubsystemId) return;
    if (currentSubsystemId === prev) return;

    ingestSubsystem(currentSubsystemId, prevPropSubsystemRef);
  }, [currentSubsystemId, ingestSubsystem]);

  // Persist session + matrix on page hide / beforeunload.
  const persistSession = useCallback(() => {
    const continuity = continuityRef.current;
    if (continuity) {
      void continuity.persist();
    }
    const pattern = patternEngineRef.current;
    if (pattern && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(PATTERN_MATRIX_LS_KEY, JSON.stringify(pattern.exportMatrix()));
      } catch {
        // Quota exceeded — silently ignore.
      }
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
