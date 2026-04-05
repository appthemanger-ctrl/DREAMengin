'use client';

/**
 * lib/forge/useForgeBuild.ts
 *
 * React hook for the ForgeEngin AI Anything Builder.
 * Streams from /api/forge/build, parses SSE events, and enforces the daily
 * rate limit via forgeBuild.ts localStorage helpers.
 *
 * Architecture: client-side only ('use client'). All AI calls are server-side.
 */

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ForgeLogEvent, ForgeBuildRecord } from '@/lib/forge/forgeBuild';
import {
  canBuildToday,
  recordBuildToday,
  saveForgeBuild,
  isForgeLogEvent,
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

            collectedLogs.push(parsed);
            setLogs(prev => [...prev, parsed as ForgeLogEvent]);

            if (parsed.type === 'done') {
              // Build complete — find result event
              const resultEvent = collectedLogs.find(e => e.type === 'result') as
                | Extract<ForgeLogEvent, { type: 'result' }>
                | undefined;

              const record: ForgeBuildRecord = {
                id: buildId,
                prompt,
                logs: [...collectedLogs],
                primaryHref: resultEvent?.href ?? '/daydream/forge',
                primaryEnginId: resultEvent?.enginId ?? 'forge',
                createdAt,
                summary: resultEvent?.summary ?? prompt.slice(0, 80),
              };

              setResult(record);
              saveForgeBuild(record);
              recordBuildToday();
              setState('done');
              return;
            }

            if (parsed.type === 'error') {
              setState('error');
              // Don't return — continue reading until 'done'
            }
          }
        }

        // Stream ended without 'done' event
        if (state !== 'done' && state !== 'error') {
          setState('done');
        }
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
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, logs, result, submit, reset, rateLimitError };
}
