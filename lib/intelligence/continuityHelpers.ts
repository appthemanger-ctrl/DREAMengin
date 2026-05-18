/**
 * lib/intelligence/continuityHelpers.ts
 *
 * DREAM CONTINUITY SPINE — pure helper functions (2026)
 *
 * These helpers are stateless and dependency-free (no React, no browser APIs)
 * so they are fully testable in a Node environment.
 *
 * resolveResumeDest — maps a "continueFrom" subsystem ID (from SessionDiff)
 *   or a live activity pulse set to the single best canonical route + label
 *   for the "Resume Dream" affordance.
 *
 * formatArtifactKind — short badge label for a DreamOSArtifactKind string.
 *
 * getArtifactAccent — accent colour for a kind (matches existing palette).
 *
 * Architecture: lib/ (Logic layer) per GENERATION_LAW §3.1.
 * Privacy: all inputs are local-client data only — no network calls.
 */

import { ENGIN_REGISTRY, type EnginEntry, type ForgeActivityPulse } from '@/lib/forge/forgeRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResumeDest {
  /** Canonical daydream surface route, e.g. '/daydream/code'. */
  href: string;
  /** Human-readable Engin name, e.g. 'CodeEngin'. */
  label: string;
  /** Single emoji icon. */
  emoji: string;
  /** Accent colour from the Engin registry. */
  accent: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Attempt to find an ENGIN_REGISTRY entry by either:
 *   - the canonical `id`  (e.g. 'code', 'games')
 *   - the display `name`  (e.g. 'CodeEngin', 'GameEngin')
 *
 * Session continuity uses Engin names as subsystem IDs; Forge activity uses
 * registry IDs — so we need to check both.
 */
function findEntry(subsystemId: string): EnginEntry | null {
  if (!subsystemId) return null;
  return (
    ENGIN_REGISTRY.find((e) => e.id === subsystemId) ??
    ENGIN_REGISTRY.find((e) => e.name === subsystemId) ??
    null
  );
}

function entryToResumeDest(entry: EnginEntry): ResumeDest {
  return {
    href:   entry.daydreamHref,
    label:  entry.name,
    emoji:  entry.emoji,
    accent: entry.accent,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve the single best resume destination for the "Resume Dream" affordance.
 *
 * Priority order:
 *   1. `continueFrom` — subsystem from the last SessionDiff (strongest signal:
 *      "this is where you left off").
 *   2. Hottest activity pulse (highest `heat` value, decays over time) from
 *      ForgeRegistry — most recently active Engin this session.
 *   3. null — not enough context; caller should fall back to its own default.
 *
 * @param continueFrom  SessionDiff.continueFrom (subsystem ID or Engin name)
 * @param activity      Current ForgeActivityPulse[] from readForgeActivity()
 * @returns ResumeDest or null
 */
export function resolveResumeDest(
  continueFrom: string | null,
  activity: readonly ForgeActivityPulse[],
): ResumeDest | null {
  // 1. Session continuity: the subsystem you were in at end of last session.
  if (continueFrom) {
    const entry = findEntry(continueFrom);
    if (entry) return entryToResumeDest(entry);
  }

  // 2. Hottest live activity pulse.
  if (activity.length > 0) {
    const hottest = [...activity].sort((a, b) => b.heat - a.heat)[0];
    if (hottest) {
      const entry = findEntry(hottest.enginId);
      if (entry) return entryToResumeDest(entry);
    }
  }

  return null;
}

// ── Artifact kind helpers ─────────────────────────────────────────────────────

/** Short human-readable badge for a DreamOSArtifactKind. */
export function formatArtifactKind(kind: string): string {
  const LABELS: Record<string, string> = {
    event:         'EVT',
    'code-run':    'CODE',
    'code-output': 'OUT',
    'lab-run':     'LAB',
    'lab-result':  'RES',
    build:         'BUILD',
    asset:         'ASSET',
    prompt:        'AI',
    draft:         'DRAFT',
  };
  return LABELS[kind] ?? kind.toUpperCase().slice(0, 5);
}

/** Accent colour for a DreamOSArtifactKind — uses existing platform palette. */
export function getArtifactAccent(kind: string): string {
  const ACCENTS: Record<string, string> = {
    event:         '#d4a843',   // gold — bridge event
    'code-run':    '#22d3ee',   // cyan — code
    'code-output': '#22d3ee',
    'lab-run':     '#10b981',   // emerald — lab
    'lab-result':  '#10b981',
    build:         '#3b82f6',   // blue — build
    asset:         '#a855f7',   // purple — asset
    prompt:        '#f472b6',   // pink — AI prompt
    draft:         'rgba(255,255,255,0.55)',
  };
  return ACCENTS[kind] ?? 'rgba(255,255,255,0.40)';
}
