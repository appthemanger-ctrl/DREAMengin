'use client';

/**
 * lib/forge/useForgeBuild.ts
 *
 * React hook for the ForgeEngin AI Anything Builder.
 * Streams from /api/forge/build, parses SSE events, enforces the daily
 * rate limit, and stages generated artifacts into the target Engin's
 * localStorage slot before the user navigates.
 *
 * Architecture: client-side only ('use client'). All AI calls are server-side.
 */

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ForgeLogEvent, ForgeBuildRecord, ForgeArtifact, ForgeArtifactType } from '@/lib/forge/forgeBuild';
import {
  canBuildToday,
  recordBuildToday,
  saveForgeBuild,
  isForgeLogEvent,
  stageForgeArtifact,
} from '@/lib/forge/forgeBuild';

export type { ForgeBuildState } from '@/lib/forge/forgeBuild';

export interface UseForgeBuildReturn {
  state: import('@/lib/forge/forgeBuild').ForgeBuildState;
  logs: ForgeLogEvent[];
  result: ForgeBuildRecord | null;
  submit: (prompt: string) => void;
  reset: () => void;
  rateLimitError: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map enginId → ForgeArtifactType */
const ARTIFACT_TYPE_MAP: Record<string, ForgeArtifactType> = {
  games:  'game-level',
  music:  'midi-pattern',
  code:   'code-cells',
  lab:    'lab-config',
  brand:  'brand-palette',
  create: 'content-draft',
};

type CodeEvent = Extract<ForgeLogEvent, { type: 'code' }>;
type ResultEvent = Extract<ForgeLogEvent, { type: 'result' }>;

/** Build a ForgeArtifact from a code SSE event + the resolved enginId */
function buildArtifact(codeEvent: CodeEvent, enginId: string): ForgeArtifact {
  return {
    type: ARTIFACT_TYPE_MAP[enginId] ?? 'content-draft',
    enginId,
    filename: codeEvent.filename,
    content: codeEvent.content,
    language: codeEvent.language,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useForgeBuild(): UseForgeBuildReturn {
  const [state, setState] = useState<import('@/lib/forge/forgeBuild').ForgeBuildState>('idle');
  const [logs, setLogs] = useState<ForgeLogEvent[]>([]);
  const [result, setResult] = useState<ForgeBuildRecord | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Keep a ref to abort the stream mid-flight if reset() is called
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
    setLogs([]);
    setResult(null);
    setRateLimitError(null);
  }, []);

  const submit = useCallback((prompt: string) => {
    if (!prompt.trim()) return;

    // Client-side daily rate limit
    if (!canBuildToday()) {
      setRateLimitError(
        'You\'ve already built today. Daily limit: 1 build per day. Come back tomorrow! 🌙'
      );
      return;
    }

    setRateLimitError(null);
    setState('running');
    setLogs([]);
    setResult(null);

    const buildId = uuidv4();
    const createdAt = new Date().toISOString();
    const collectedLogs: ForgeLogEvent[] = [];

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      // Track the code event so we can build the artifact on done
      let pendingCodeEvent: CodeEvent | null = null;

      try {
        const res = await fetch('/api/forge/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error');
          const errEvent: ForgeLogEvent = {
            type: 'error',
            message: `Server error ${res.status}: ${errText.slice(0, 200)}`,
            ts: Date.now(),
          };
          collectedLogs.push(errEvent);
          setLogs(prev => [...prev, errEvent]);
          setState('error');
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setState('error');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE format: lines starting with "data: " followed by \n\n
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            let parsed: unknown;
            try {
              parsed = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (!isForgeLogEvent(parsed)) continue;

            const event = parsed as ForgeLogEvent;

            // Track code events for artifact staging
            if (event.type === 'code') {
              pendingCodeEvent = event as CodeEvent;
            }

            collectedLogs.push(event);
            setLogs(prev => [...prev, event]);

            if (event.type === 'done') {
              // Find result event
              const resultEvent = collectedLogs.find(e => e.type === 'result') as
                ResultEvent | undefined;

              // Build artifact if we have code content and a resolved enginId
              const artifact =
                pendingCodeEvent && resultEvent
                  ? buildArtifact(pendingCodeEvent, resultEvent.enginId)
                  : undefined;

              // Stage artifact into Engin's localStorage slot before navigation
              if (artifact) {
                stageForgeArtifact(artifact);
              }

              const record: ForgeBuildRecord = {
                id: buildId,
                prompt,
                logs: [...collectedLogs],
                primaryHref: resultEvent?.href ?? '/daydream/forge',
                primaryEnginId: resultEvent?.enginId ?? 'forge',
                createdAt,
                summary: resultEvent?.summary ?? prompt.slice(0, 80),
                artifact,
              };

              setResult(record);
              saveForgeBuild(record);
              recordBuildToday();
              setState('done');
              return;
            }

            if (event.type === 'error') {
              setState('error');
              // Don't return — continue reading until 'done'
            }
          }
        }

        // Stream ended without 'done' event
        setState('done');
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return; // reset() was called
        const errEvent: ForgeLogEvent = {
          type: 'error',
          message: `Network error: ${err instanceof Error ? err.message : String(err)}`,
          ts: Date.now(),
        };
        collectedLogs.push(errEvent);
        setLogs(prev => [...prev, errEvent]);
        setState('error');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, logs, result, submit, reset, rateLimitError };
}
