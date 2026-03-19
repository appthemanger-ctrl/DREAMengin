// lib/journey/journeyDots.ts
// Journey Trail helpers — log and query dots for the user's creative course.
//
// Design rules:
//   1. Fire-and-forget: logJourneyDot() must never throw or affect user experience.
//   2. Idempotent first-evers: check with hasJourneyDot() before writing milestone dots.
//   3. Privacy: dots are written to /api/journey which enforces owner-only RLS.
//   4. Best-effort: if the API is unavailable, silently swallow the error.
//
// Usage:
//   import { logJourneyDot, hasJourneyDot } from '@/lib/journey/journeyDots';
//
//   // Log a first-ever surface entry (deduplicated per surface)
//   if (!(await hasJourneyDot('surface_first_entry', 'Music Daydream Surface'))) {
//     logJourneyDot({ kind: 'surface_first_entry', surface: 'Music Daydream Surface',
//                     label: 'You entered the Music Daydream Surface for the first time.',
//                     significance: 1.0, domain_color: '#8b5cf6', metadata: {} });
//   }

import type { LogJourneyDotInput } from '@/types/journey';

/**
 * Log a new journey dot.
 * Best-effort: errors are silently discarded — user experience must never be affected.
 */
export function logJourneyDot(dot: LogJourneyDotInput): void {
  try {
    fetch('/api/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dot),
    }).catch(() => {
      // Silently discard network errors — this is fire-and-forget telemetry.
    });
  } catch {
    // Silently discard synchronous errors (e.g. in non-browser environments).
  }
}

/**
 * Check whether the current user already has a dot of a specific kind,
 * optionally scoped to a surface.
 *
 * @param kind    The JourneyDotKind to check for existence.
 * @param surface Optional surface name — when provided, checks kind+surface together,
 *                allowing per-surface deduplication of the same kind (e.g. surface_first_entry).
 *
 * Returns true  → dot already exists (skip writing).
 * Returns false → dot is new (safe to write).
 *
 * Fail-open: returns false on error so the dot is still logged rather than silently lost.
 */
export async function hasJourneyDot(kind: string, surface?: string): Promise<boolean> {
  try {
    let url = `/api/journey?kind=${encodeURIComponent(kind)}&check=1`;
    if (surface) url += `&surface=${encodeURIComponent(surface)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json() as { exists?: boolean };
    return Boolean(data.exists);
  } catch {
    return false;
  }
}
