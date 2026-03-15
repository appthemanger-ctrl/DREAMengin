import { describe, expect, it } from 'vitest';

import { createInitialDreamState, getStateForNode, move } from '@/lib/navigation/dream-state';
import {
  ledgerStats,
  matchState,
  resolveTransition,
} from '@/lib/navigation/StructureLedger';

const ALL_NODES = [
  '0',
  '1', '2', '3', '4', '5', '6',
  '1b', '2b', '3b', '4b', '5b', '6b',
] as const;

const ALL_DIRECTIONS = [
  'forward', 'backward', 'left', 'right', 'zoomIn', 'zoomOut',
] as const;

describe('StructureLedger — ledger sizes', () => {
  it('STATE_LEDGER contains exactly 13 entries (one per node)', () => {
    const { states } = ledgerStats();
    expect(states).toBe(13);
  });

  it('TRANSITION_LEDGER contains exactly 78 entries (13 nodes × 6 directions)', () => {
    const { transitions } = ledgerStats();
    expect(transitions).toBe(78);
  });
});

describe('StructureLedger — matchState (state ledger)', () => {
  it('returns a non-null state for every node', () => {
    for (const node of ALL_NODES) {
      expect(matchState(node)).toBeTruthy();
    }
  });

  it('returns states whose .node field matches the key', () => {
    for (const node of ALL_NODES) {
      expect(matchState(node).node).toBe(node);
    }
  });

  it('returned states match getStateForNode output', () => {
    for (const node of ALL_NODES) {
      expect(matchState(node)).toEqual(getStateForNode(node));
    }
  });

  it('returns frozen (immutable) objects — conserved structure cannot be mutated', () => {
    for (const node of ALL_NODES) {
      const state = matchState(node);
      expect(Object.isFrozen(state)).toBe(true);
    }
  });

  it('repeated calls return the same object reference (no reallocation)', () => {
    for (const node of ALL_NODES) {
      expect(matchState(node)).toBe(matchState(node));
    }
  });

  it('initial dream-state matches the ledger entry for node "0"', () => {
    expect(matchState('0')).toEqual(createInitialDreamState());
  });

  it('throws for an unknown node', () => {
    // @ts-expect-error — intentionally passing invalid node
    expect(() => matchState('99')).toThrow(RangeError);
  });
});

describe('StructureLedger — resolveTransition (transition ledger)', () => {
  it('all (node, direction) combinations resolve without throwing', () => {
    for (const node of ALL_NODES) {
      for (const dir of ALL_DIRECTIONS) {
        expect(() => resolveTransition(node, dir)).not.toThrow();
      }
    }
  });

  it('resolved transitions match live move() output', () => {
    for (const node of ALL_NODES) {
      const state = getStateForNode(node);
      for (const dir of ALL_DIRECTIONS) {
        const expected = move(state, dir).node;
        expect(resolveTransition(node, dir)).toBe(expected);
      }
    }
  });

  it('same-direction double-move from "0" follows spec: 0 → 3 → 3b', () => {
    const n1 = resolveTransition('0', 'left');
    const n2 = resolveTransition(n1, 'left');
    expect(n1).toBe('3');
    expect(n2).toBe('3b');
  });

  it('opposite moves collapse inward: "1" + backward → "0"', () => {
    expect(resolveTransition('1', 'backward')).toBe('0');
  });

  it('z-axis edge case: "6b" + zoomIn → "6"', () => {
    expect(resolveTransition('6b', 'zoomIn')).toBe('6');
  });

  it('throws for an unknown direction', () => {
    // @ts-expect-error — intentionally passing invalid direction
    expect(() => resolveTransition('0', 'teleport')).toThrow(RangeError);
  });
});
