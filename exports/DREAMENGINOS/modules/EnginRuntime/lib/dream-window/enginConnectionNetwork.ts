/**
 * enginConnectionNetwork — Multi-surface Engin connection network
 *
 * Models the 11 canonical connection paths between Daydream Surfaces and
 * Engin runtimes. DREAMengin's connection network is explicitly multi-surface
 * and multi-engin — NOT a simple 1-to-1 pair system.
 *
 * Network layout (11 paths total):
 *
 *   Music  ──bind──────────► StarMakerEngin
 *   Music  ──route into────► LabEngin
 *   Music  ──connect across► CodeEngin
 *
 *   Games  ──bind──────────► GameEngin
 *   Games  ──route into────► LabEngin
 *   Games  ──connect across► CodeEngin
 *
 *   Brand  ──bind──────────► BrandingEngin
 *   Brand  ──route into────► ContentEngin
 *   Brand  ──connect across► LabEngin
 *
 *   Create ──bind──────────► ContentEngin
 *
 *   Lab    ──bind──────────► LabEngin
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Daydream Surface Network, multi-connection)
 * Naming: lib/identity/canonical-names.ts (all domain/engin names sourced here)
 *
 * Validated at module-load time: throws if path count ≠ NETWORK_COUNTS.CONNECTION_PATHS.
 */

import {
  DAYDREAM_DOMAINS,
  ENGIN_SURFACES,
  NETWORK_COUNTS,
  type DaydreamDomain,
  type EnginSurface,
  type ConnectionVerb,
} from '@/lib/identity/canonical-names';

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

/**
 * A single named connection path in the Engin connection network.
 */
export interface EnginConnectionPath {
  /** Unique stable identifier for this path */
  id: string;
  /** The Daydream domain that is the source of this connection */
  daydreamSurface: DaydreamDomain;
  /** The Engin runtime that is the target of this connection */
  enginRuntime: EnginSurface;
  /** The canonical verb governing this connection */
  verb: ConnectionVerb;
  /** Human-readable label for display, docs, and debugging */
  label: string;
}

// ---------------------------------------------------------------------------
// Path ID builder (stable, deterministic)
// ---------------------------------------------------------------------------

function pathId(domain: DaydreamDomain, engin: EnginSurface, verb: ConnectionVerb): string {
  const d = domain.toLowerCase().replace(/\s+/g, '-');
  const e = engin.toLowerCase().replace(/\s+/g, '-');
  const v = verb.replace(/\s+/g, '-');
  return `${d}→${e}[${v}]`;
}

function buildLabel(domain: DaydreamDomain, engin: EnginSurface, verb: ConnectionVerb): string {
  return `${domain} Daydream Surface → ${engin} (${verb})`;
}

// ---------------------------------------------------------------------------
// The 11 canonical connection paths
// ---------------------------------------------------------------------------

export const ALL_CONNECTION_PATHS: readonly EnginConnectionPath[] = [
  // ── Music (3 paths) ──────────────────────────────────────────────────────
  {
    id: pathId(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.MUSIC, 'bind'),
    daydreamSurface: DAYDREAM_DOMAINS.MUSIC,
    enginRuntime:    ENGIN_SURFACES.MUSIC,
    verb:            'bind',
    label:           buildLabel(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.MUSIC, 'bind'),
  },
  {
    id: pathId(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.LAB, 'route into'),
    daydreamSurface: DAYDREAM_DOMAINS.MUSIC,
    enginRuntime:    ENGIN_SURFACES.LAB,
    verb:            'route into',
    label:           buildLabel(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.LAB, 'route into'),
  },
  {
    id: pathId(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.CODE, 'connect across'),
    daydreamSurface: DAYDREAM_DOMAINS.MUSIC,
    enginRuntime:    ENGIN_SURFACES.CODE,
    verb:            'connect across',
    label:           buildLabel(DAYDREAM_DOMAINS.MUSIC, ENGIN_SURFACES.CODE, 'connect across'),
  },

  // ── Games (3 paths) ──────────────────────────────────────────────────────
  {
    id: pathId(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.GAMES, 'bind'),
    daydreamSurface: DAYDREAM_DOMAINS.GAMES,
    enginRuntime:    ENGIN_SURFACES.GAMES,
    verb:            'bind',
    label:           buildLabel(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.GAMES, 'bind'),
  },
  {
    id: pathId(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.LAB, 'route into'),
    daydreamSurface: DAYDREAM_DOMAINS.GAMES,
    enginRuntime:    ENGIN_SURFACES.LAB,
    verb:            'route into',
    label:           buildLabel(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.LAB, 'route into'),
  },
  {
    id: pathId(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.CODE, 'connect across'),
    daydreamSurface: DAYDREAM_DOMAINS.GAMES,
    enginRuntime:    ENGIN_SURFACES.CODE,
    verb:            'connect across',
    label:           buildLabel(DAYDREAM_DOMAINS.GAMES, ENGIN_SURFACES.CODE, 'connect across'),
  },

  // ── Brand (3 paths) ──────────────────────────────────────────────────────
  {
    id: pathId(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.BRAND, 'bind'),
    daydreamSurface: DAYDREAM_DOMAINS.BRAND,
    enginRuntime:    ENGIN_SURFACES.BRAND,
    verb:            'bind',
    label:           buildLabel(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.BRAND, 'bind'),
  },
  {
    id: pathId(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.CREATE, 'route into'),
    daydreamSurface: DAYDREAM_DOMAINS.BRAND,
    enginRuntime:    ENGIN_SURFACES.CREATE,
    verb:            'route into',
    label:           buildLabel(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.CREATE, 'route into'),
  },
  {
    id: pathId(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.LAB, 'connect across'),
    daydreamSurface: DAYDREAM_DOMAINS.BRAND,
    enginRuntime:    ENGIN_SURFACES.LAB,
    verb:            'connect across',
    label:           buildLabel(DAYDREAM_DOMAINS.BRAND, ENGIN_SURFACES.LAB, 'connect across'),
  },

  // ── Create (1 path) ──────────────────────────────────────────────────────
  {
    id: pathId(DAYDREAM_DOMAINS.CREATE, ENGIN_SURFACES.CREATE, 'bind'),
    daydreamSurface: DAYDREAM_DOMAINS.CREATE,
    enginRuntime:    ENGIN_SURFACES.CREATE,
    verb:            'bind',
    label:           buildLabel(DAYDREAM_DOMAINS.CREATE, ENGIN_SURFACES.CREATE, 'bind'),
  },

  // ── Lab (1 path) ─────────────────────────────────────────────────────────
  {
    id: pathId(DAYDREAM_DOMAINS.LAB, ENGIN_SURFACES.LAB, 'bind'),
    daydreamSurface: DAYDREAM_DOMAINS.LAB,
    enginRuntime:    ENGIN_SURFACES.LAB,
    verb:            'bind',
    label:           buildLabel(DAYDREAM_DOMAINS.LAB, ENGIN_SURFACES.LAB, 'bind'),
  },
] as const;

// ---------------------------------------------------------------------------
// Module-load validation
// ---------------------------------------------------------------------------

if (ALL_CONNECTION_PATHS.length !== NETWORK_COUNTS.CONNECTION_PATHS) {
  throw new Error(
    `enginConnectionNetwork: ALL_CONNECTION_PATHS has ${ALL_CONNECTION_PATHS.length} entries ` +
      `but NETWORK_COUNTS.CONNECTION_PATHS requires exactly ${NETWORK_COUNTS.CONNECTION_PATHS}. ` +
      `Update ALL_CONNECTION_PATHS to match the canonical network count.`,
  );
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Returns all connection paths that originate from a given Daydream domain.
 *
 * @example
 * getPathsForDomain('Music')
 * // → [Music→StarMakerEngin, Music→LabEngin, Music→CodeEngin]
 */
export function getPathsForDomain(domain: DaydreamDomain): readonly EnginConnectionPath[] {
  return ALL_CONNECTION_PATHS.filter((p) => p.daydreamSurface === domain);
}

/**
 * Returns all connection paths that target a given Engin runtime.
 *
 * @example
 * getPathsForEngin('LabEngin')
 * // → [Music→LabEngin, Games→LabEngin, Brand→LabEngin, Lab→LabEngin]
 */
export function getPathsForEngin(engin: EnginSurface): readonly EnginConnectionPath[] {
  return ALL_CONNECTION_PATHS.filter((p) => p.enginRuntime === engin);
}

/**
 * Returns true if a direct connection path exists from `domain` to `engin`.
 *
 * @example
 * hasConnectionPath('Music', 'LabEngin')   // → true
 * hasConnectionPath('Music', 'GameEngin')  // → false
 */
export function hasConnectionPath(domain: DaydreamDomain, engin: EnginSurface): boolean {
  return ALL_CONNECTION_PATHS.some(
    (p) => p.daydreamSurface === domain && p.enginRuntime === engin,
  );
}
