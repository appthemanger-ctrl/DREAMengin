/**
 * lib/journey/withJourney.ts
 *
 * Automatic instrumentation wrapper for any async function.
 *
 * "Implement automatic instrumentation wrapper — No manual calls. No optional usage."
 * — DREAMengin product directive
 *
 * Usage:
 *   const enterMusicDream = withJourney(
 *     async () => { /* existing logic *\/ },
 *     { kind: 'surface_first_entry', label: 'You entered the Music Daydream Surface.',
 *       surface: 'Music Daydream Surface', domain_color: '#8b5cf6', significance: 1.0 },
 *   );
 *
 * Design rules:
 *   - Fire-and-forget: the journey dot is logged AFTER the wrapped fn resolves.
 *   - Never throws: errors in the dot-logging path are silently discarded.
 *   - Transparent: if the wrapped fn throws, the error propagates normally.
 *   - Lightweight: adds zero latency to the critical path (dot fires asynchronously).
 */

import { logJourneyDot } from '@/lib/journey/journeyDots';
import type { JourneyDotKind } from '@/types/journey';

export interface JourneyMeta {
  kind: JourneyDotKind | string;
  label: string;
  significance?: number;
  surface?: string;
  domain_color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Wraps an async function so that a journey dot is logged (fire-and-forget)
 * every time the function resolves successfully.
 *
 * The return type of the wrapped function is fully preserved.
 *
 * @param fn   The async function to wrap.
 * @param meta Journey dot data to log on each successful call.
 * @returns    A wrapped function with an identical signature.
 */
export function withJourney<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  meta: JourneyMeta,
): T {
  return (async (...args: unknown[]) => {
    const result = await fn(...args);

    // Fire-and-forget — never awaited, never allowed to throw.
    try {
      logJourneyDot({
        kind:         meta.kind as JourneyDotKind,
        label:        meta.label,
        significance: meta.significance ?? 0.5,
        surface:      meta.surface ?? '',
        domain_color: meta.domain_color ?? '#c8981a',
        metadata:     {
          ...meta.metadata,
          argsSummary: JSON.stringify(args).slice(0, 200),
        },
      });
    } catch {
      // Silently discard — instrumentation must never affect the wrapped function.
    }

    return result;
  }) as T;
}
