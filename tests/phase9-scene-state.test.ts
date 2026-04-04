/**
 * tests/phase9-scene-state.test.ts
 *
 * Tests for lib/scene/sceneState.ts — persistent scene state.
 */

import { describe, expect, it } from 'vitest';
import {
  createDefaultSnapshot,
  scenesAreDifferent,
  type SceneSnapshot,
} from '@/lib/scene/sceneState';

// ─── Default snapshot ─────────────────────────────────────────────────────────

describe('Scene State — createDefaultSnapshot', () => {
  it('returns a valid default snapshot', () => {
    const snap = createDefaultSnapshot();
    expect(snap.camera.position).toEqual([0, 5, -10]);
    expect(snap.camera.target).toEqual([0, 0, 0]);
    expect(snap.camera.fov).toBe(60);
    expect(snap.objects).toEqual([]);
    expect(snap.physicsEnabled).toBe(true);
    expect(snap.environment).toBe('studio');
  });
});

// ─── Scene diffing ────────────────────────────────────────────────────────────

describe('Scene State — scenesAreDifferent', () => {
  const makeSnapshot = (overrides?: Partial<SceneSnapshot>): SceneSnapshot => ({
    camera: { position: [0, 5, -10], target: [0, 0, 0], fov: 60 },
    objects: [],
    physicsEnabled: true,
    environment: 'studio',
    ...overrides,
  });

  it('returns false for identical snapshots', () => {
    const a = makeSnapshot();
    const b = makeSnapshot();
    expect(scenesAreDifferent(a, b)).toBe(false);
  });

  it('detects camera position change', () => {
    const a = makeSnapshot();
    const b = makeSnapshot({ camera: { position: [1, 5, -10], target: [0, 0, 0], fov: 60 } });
    expect(scenesAreDifferent(a, b)).toBe(true);
  });

  it('detects camera target change', () => {
    const a = makeSnapshot();
    const b = makeSnapshot({ camera: { position: [0, 5, -10], target: [1, 0, 0], fov: 60 } });
    expect(scenesAreDifferent(a, b)).toBe(true);
  });

  it('detects FOV change', () => {
    const a = makeSnapshot();
    const b = makeSnapshot({ camera: { position: [0, 5, -10], target: [0, 0, 0], fov: 75 } });
    expect(scenesAreDifferent(a, b)).toBe(true);
  });

  it('detects physics toggle', () => {
    const a = makeSnapshot();
    const b = makeSnapshot({ physicsEnabled: false });
    expect(scenesAreDifferent(a, b)).toBe(true);
  });

  it('detects environment change', () => {
    const a = makeSnapshot();
    const b = makeSnapshot({ environment: 'outdoor' });
    expect(scenesAreDifferent(a, b)).toBe(true);
  });

  it('detects object count change', () => {
    const a = makeSnapshot();
    const b = makeSnapshot({
      objects: [
        { id: 'obj-1', type: 'mesh', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      ],
    });
    expect(scenesAreDifferent(a, b)).toBe(true);
  });

  it('detects object position change', () => {
    const obj = { id: 'obj-1', type: 'mesh' as const, position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] };
    const a = makeSnapshot({ objects: [obj] });
    const b = makeSnapshot({ objects: [{ ...obj, position: [1, 0, 0] }] });
    expect(scenesAreDifferent(a, b)).toBe(true);
  });

  it('ignores sub-epsilon camera changes', () => {
    const a = makeSnapshot();
    const b = makeSnapshot({
      camera: { position: [0.0001, 5, -10], target: [0, 0, 0], fov: 60 },
    });
    expect(scenesAreDifferent(a, b)).toBe(false);
  });
});
