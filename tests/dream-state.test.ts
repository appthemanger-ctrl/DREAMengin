import { describe, expect, it } from 'vitest';

import { createInitialDreamState, move, returnHome, zoom } from '@/lib/navigation/dream-state';

describe('dream-state transitions', () => {
  it('cycles same-direction nodes as 0 -> 3 -> 3b -> 0', () => {
    const s0 = createInitialDreamState();
    const s1 = move(s0, 'left');
    const s2 = move(s1, 'left');
    const s3 = move(s2, 'left');

    expect(s1.node).toBe('3');
    expect(s2.node).toBe('3b');
    expect(s3.node).toBe('0');
  });

  it('opposite movement collapses inward', () => {
    const s0 = createInitialDreamState();
    const s1 = move(s0, 'forward');
    const s2 = move(s1, 'backward');

    expect(s1.node).toBe('1');
    expect(s2.node).toBe('0');
  });

  it('z edge-case follows spec: 6b -> zoomIn -> 6', () => {
    const s0 = createInitialDreamState();
    const s1 = move(s0, 'zoomOut');
    const s2 = move(s1, 'zoomOut');
    const s3 = zoom(s2, 'in');

    expect(s1.node).toBe('6');
    expect(s2.node).toBe('6b');
    expect(s3.node).toBe('6');
  });

  it('returnHome always resets to node 0', () => {
    const s0 = createInitialDreamState();
    const s1 = move(s0, 'right');
    const home = returnHome();

    expect(s1.node).toBe('4');
    expect(home.node).toBe('0');
    expect(home.cameraPosition).toEqual({ x: 0, y: 0, z: 0 });
  });
});
