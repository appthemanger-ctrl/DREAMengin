import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionPatternEngine } from '@/lib/intelligence/sessionPatternEngine';

// Mock TF.js so the tests run without requiring GPU or heavy native deps.
vi.mock('@tensorflow/tfjs', () => ({
  setBackend: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  tensor1d: vi.fn((data: number[]) => ({
    dispose: vi.fn(),
    dataSync: vi.fn(() => data),
  })),
  softmax: vi.fn((tensor: { dataSync: () => number[]; dispose: () => void }) => ({
    dataSync: tensor.dataSync,
    dispose: vi.fn(),
  })),
}));
vi.mock('@tensorflow/tfjs-backend-webgpu', () => ({}));

describe('SessionPatternEngine', () => {
  let engine: SessionPatternEngine;

  beforeEach(() => {
    engine = new SessionPatternEngine();
  });

  it('starts with no transitions and isReady false', () => {
    const state = engine.getState();
    expect(state.transitionCount).toBe(0);
    expect(state.isReady).toBe(false);
    expect(state.subsystemsSeen).toEqual([]);
  });

  it('ingests subsystem activations and tracks unique systems', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('GameEngin');

    const state = engine.getState();
    expect(state.subsystemsSeen).toEqual(['CodeEngin', 'LabEngin', 'GameEngin']);
    expect(state.transitionCount).toBe(2);
  });

  it('returns warm cold-start defaults before MIN_TRANSITIONS are reached', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    // Only 1 transition — not enough to use learned data.
    // But cold-start defaults should still provide predictions.
    const preds = engine.predict('CodeEngin');
    expect(preds.length).toBeGreaterThan(0);
    // All confidences must be valid.
    for (const p of preds) {
      expect(p.confidence).toBeGreaterThan(0);
      expect(p.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('predicts after MIN_TRANSITIONS (3) are satisfied', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    const state = engine.getState();
    expect(state.isReady).toBe(true);

    const preds = engine.predict('CodeEngin');
    expect(preds.length).toBeGreaterThan(0);
    expect(preds[0].subsystemId).toBe('LabEngin');
    expect(preds[0].confidence).toBeGreaterThan(0);
    expect(preds[0].label).toContain('LabEngin');
  });

  it('returns predictions in descending confidence order', () => {
    // Train: Code → Lab twice, Code → Game once.
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('GameEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    const preds = engine.predict('CodeEngin');
    expect(preds.length).toBeGreaterThanOrEqual(2);
    // Lab should rank above Game (3 transitions vs 1).
    expect(preds[0].subsystemId).toBe('LabEngin');
    for (let i = 1; i < preds.length; i++) {
      expect(preds[i - 1].confidence).toBeGreaterThanOrEqual(preds[i].confidence);
    }
  });

  it('returns at most topN predictions', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('GameEngin');
    engine.ingest('CodeEngin');
    engine.ingest('BrandingEngin');
    engine.ingest('CodeEngin');
    engine.ingest('ContentEngin');

    const preds = engine.predict('CodeEngin', 2);
    expect(preds.length).toBeLessThanOrEqual(2);
  });

  it('returns cold-start defaults for a subsystem with no learned transitions', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    // 3 transitions exist from CodeEngin — StarMakerEngin has none.
    // Cold-start defaults should be returned for StarMakerEngin.
    const preds = engine.predict('StarMakerEngin');
    expect(preds.length).toBeGreaterThan(0);
    for (const p of preds) {
      expect(p.confidence).toBeGreaterThan(0);
    }
  });

  it('all prediction confidences are in [0, 1]', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('GameEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    const preds = engine.predict('CodeEngin');
    for (const p of preds) {
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('does not count consecutive duplicate ingests as transitions', () => {
    engine.ingest('CodeEngin');
    engine.ingest('CodeEngin'); // same — should not create a self-loop
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    // There should be no CodeEngin→CodeEngin transition.
    const preds = engine.predict('CodeEngin');
    const selfPred = preds.find((p) => p.subsystemId === 'CodeEngin');
    expect(selfPred).toBeUndefined();
  });

  it('reset() clears all learned transitions; predict falls back to cold-start', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    engine.reset();

    const state = engine.getState();
    expect(state.transitionCount).toBe(0);
    expect(state.isReady).toBe(false);
    expect(state.subsystemsSeen).toEqual([]);

    // After reset, no learned data exists — cold-start defaults kick in.
    const preds = engine.predict('CodeEngin');
    expect(preds.length).toBeGreaterThan(0);
    // Specifically: no LabEngin prediction from learned data (was just cleared),
    // so the result must come from cold-start, not the cleared matrix.
    const state2 = engine.getState();
    expect(state2.isReady).toBe(false);
  });

  it('getActivationSequence returns ingested order', () => {
    engine.ingest('A');
    engine.ingest('B');
    engine.ingest('A');
    expect(engine.getActivationSequence()).toEqual(['A', 'B', 'A']);
  });

  it('uses emoji label for known subsystems', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    const preds = engine.predict('CodeEngin');
    expect(preds[0].label).toBe('🧪 LabEngin');
  });

  it('uses fallback label for unknown subsystems', () => {
    // Accumulate > COLD_START_THRESHOLD (10) transitions so the engine uses
    // purely learned data and the unknown 'Y' subsystem label is rendered.
    for (let i = 0; i < 6; i++) {
      engine.ingest('X');
      engine.ingest('Y');
    }
    // 11 transitions total; engine is past the cold-start blend window.
    const preds = engine.predict('X');
    expect(preds[0].label).toContain('Y');
  });

  // ── Cold-start blending ────────────────────────────────────────────────────

  it('blends cold-start and learned weights in the 3–10 transition window', () => {
    // Build exactly 4 transitions: CodeEngin → GameEngin (3×), CodeEngin → ContentEngin (1×)
    engine.ingest('CodeEngin');
    engine.ingest('GameEngin');
    engine.ingest('CodeEngin');
    engine.ingest('GameEngin');
    engine.ingest('CodeEngin');
    engine.ingest('GameEngin');
    engine.ingest('CodeEngin');
    engine.ingest('ContentEngin'); // 4th transition

    const state = engine.getState();
    expect(state.transitionCount).toBe(7);
    expect(state.isReady).toBe(true);

    const preds = engine.predict('CodeEngin');
    // Must include both learned and cold-start candidates.
    expect(preds.length).toBeGreaterThan(0);
    // LabEngin appears in cold-start defaults for CodeEngin but has no learned
    // count — it should still appear due to blending.
    const labPred = preds.find((p) => p.subsystemId === 'LabEngin');
    expect(labPred).toBeDefined();
    // GameEngin has learned count (3×) so it should rank above LabEngin.
    const gamePred = preds.find((p) => p.subsystemId === 'GameEngin');
    expect(gamePred).toBeDefined();
    expect(gamePred!.confidence).toBeGreaterThan(labPred!.confidence);
  });

  // ── Matrix export / import ─────────────────────────────────────────────────

  it('exportMatrix returns a plain JSON-serialisable representation', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('GameEngin');

    const matrix = engine.exportMatrix();
    expect(typeof matrix).toBe('object');
    expect(matrix['CodeEngin']).toBeDefined();
    expect(matrix['CodeEngin']['LabEngin']).toBe(1);
    expect(matrix['CodeEngin']['GameEngin']).toBe(1);
    // Must round-trip through JSON without loss.
    const roundTripped = JSON.parse(JSON.stringify(matrix)) as typeof matrix;
    expect(roundTripped['CodeEngin']['LabEngin']).toBe(1);
  });

  it('importMatrix restores learned transitions from a saved matrix', () => {
    const savedMatrix = {
      CodeEngin: { LabEngin: 5, GameEngin: 2 },
      LabEngin: { CodeEngin: 3 },
    };
    const fresh = new SessionPatternEngine();
    fresh.importMatrix(savedMatrix);

    // Manually build enough activation count for the learned-weight path.
    // Simulate 11 ingests to exceed COLD_START_THRESHOLD.
    for (let i = 0; i < 6; i++) {
      fresh.ingest('CodeEngin');
      fresh.ingest('LabEngin');
    }

    const preds = fresh.predict('CodeEngin');
    expect(preds.length).toBeGreaterThan(0);
    // LabEngin has count 5 (imported) + runtime ingests, should top the list.
    expect(preds[0].subsystemId).toBe('LabEngin');
  });

  it('importMatrix is a no-op for malformed data', () => {
    const engine2 = new SessionPatternEngine();
    // Should not throw on malformed input.
    expect(() => engine2.importMatrix({ bad: null as unknown as Record<string, number> })).not.toThrow();
    expect(() => engine2.importMatrix({})).not.toThrow();
  });
});
