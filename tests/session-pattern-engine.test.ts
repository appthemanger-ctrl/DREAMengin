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

  it('returns empty predictions before MIN_TRANSITIONS are reached', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    // Only 1 transition — not enough.
    const preds = engine.predict('CodeEngin');
    expect(preds).toEqual([]);
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

  it('returns empty array for unseen subsystem', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    const preds = engine.predict('StarMakerEngin');
    expect(preds).toEqual([]);
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

  it('reset() clears all state', () => {
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');
    engine.ingest('CodeEngin');
    engine.ingest('LabEngin');

    engine.reset();

    const state = engine.getState();
    expect(state.transitionCount).toBe(0);
    expect(state.isReady).toBe(false);
    expect(state.subsystemsSeen).toEqual([]);
    expect(engine.predict('CodeEngin')).toEqual([]);
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
    engine.ingest('X');
    engine.ingest('Y');
    engine.ingest('X');
    engine.ingest('Y');

    const preds = engine.predict('X');
    expect(preds[0].label).toContain('Y');
  });
});
