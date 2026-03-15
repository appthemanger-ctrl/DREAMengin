// StructureLedger — precomputed conserved navigation structure
//
// Phase 1: All 13 DreamState objects are built once at module load.
// Phase 2: All 78 (node × direction) transitions are resolved and stored.
// Runtime: matchState() and resolveTransition() are both O(1) map reads.
//          Nothing is constructed on demand; only the entry point is returned.

import { getStateForNode, move } from './dream-state';
import type { DreamNode, DreamState, MoveDirection } from './dream-state';

const ALL_NODES: readonly DreamNode[] = [
  '0',
  '1', '2', '3', '4', '5', '6',
  '1b', '2b', '3b', '4b', '5b', '6b',
];

const ALL_DIRECTIONS: readonly MoveDirection[] = [
  'forward', 'backward', 'left', 'right', 'zoomIn', 'zoomOut',
];

// -------------------------------------------------------------------
// Ledger 1 — state ledger
// Maps every DreamNode → its frozen DreamState object.
// Conserved structure: these 13 states never change for the lifetime
// of the engine.
// -------------------------------------------------------------------
const STATE_LEDGER: ReadonlyMap<DreamNode, Readonly<DreamState>> = new Map(
  ALL_NODES.map(node => [node, Object.freeze(getStateForNode(node))])
);

// -------------------------------------------------------------------
// Ledger 2 — transition ledger
// Maps `${node}:${direction}` → next DreamNode.
// All 78 (13 nodes × 6 directions) outcomes are precomputed here so
// that no move() logic runs at navigation time.
// -------------------------------------------------------------------
const TRANSITION_LEDGER: ReadonlyMap<string, DreamNode> = (() => {
  const map = new Map<string, DreamNode>();
  for (const node of ALL_NODES) {
    const state = STATE_LEDGER.get(node)!;
    for (const dir of ALL_DIRECTIONS) {
      map.set(`${node}:${dir}`, move(state, dir).node);
    }
  }
  return map;
})();

// -------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------

/**
 * Return the pre-built, frozen DreamState for a node.
 * O(1) — no state construction at call time.
 */
export function matchState(node: DreamNode): Readonly<DreamState> {
  const state = STATE_LEDGER.get(node);
  if (!state) throw new RangeError(`StructureLedger: unknown node "${node}"`);
  return state;
}

/**
 * Resolve the next DreamNode for a (node, direction) pair.
 * O(1) — the outcome was computed at module-load time.
 */
export function resolveTransition(node: DreamNode, direction: MoveDirection): DreamNode {
  const key = `${node}:${direction}`;
  const next = TRANSITION_LEDGER.get(key);
  if (next === undefined) throw new RangeError(`StructureLedger: unknown key "${key}"`);
  return next;
}

/**
 * Diagnostic: sizes of the two ledgers.
 * Expected: { states: 13, transitions: 78 }
 */
export function ledgerStats(): { states: number; transitions: number } {
  return {
    states: STATE_LEDGER.size,
    transitions: TRANSITION_LEDGER.size,
  };
}
