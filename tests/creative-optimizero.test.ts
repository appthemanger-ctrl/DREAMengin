/**
 * Tests for Creative Optimizero Algorithm
 */

import { describe, it, expect } from 'vitest';
import {
  CreativeOptimizero,
  DEFAULT_WEIGHTS,
  CHAOS_WEIGHTS,
  STABLE_WEIGHTS,
  STANDARD_UI_HARD_CHECKS,
  createUIOptimizero,
  type CreativeCandidate,
  type ScoreFunction,
  type HardFailCheck,
} from '@/lib/optimizer/creative-optimizero';

describe('CreativeOptimizero', () => {
  // Simple scorers for testing
  const scorers = {
    novelty: ((c) => c.metadata?.novelty || 0.5) as ScoreFunction,
    usefulness: ((c) => c.metadata?.usefulness || 0.5) as ScoreFunction,
    delight: ((c) => c.metadata?.delight || 0.5) as ScoreFunction,
    fit: ((c) => c.metadata?.fit || 0.5) as ScoreFunction,
    cost: ((c) => c.metadata?.cost || 0.2) as ScoreFunction,
    risk: ((c) => c.metadata?.risk || 0.1) as ScoreFunction,
  };

  describe('Basic Optimization', () => {
    it('should rank candidates by final score', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers);

      const candidates: CreativeCandidate[] = [
        {
          id: 'low',
          data: {},
          metadata: { novelty: 0.1, usefulness: 0.2, delight: 0.1, fit: 0.3, cost: 0.1, risk: 0.1 },
        },
        {
          id: 'high',
          data: {},
          metadata: { novelty: 0.9, usefulness: 0.8, delight: 0.9, fit: 0.7, cost: 0.1, risk: 0.1 },
        },
        {
          id: 'medium',
          data: {},
          metadata: { novelty: 0.5, usefulness: 0.5, delight: 0.5, fit: 0.5, cost: 0.2, risk: 0.2 },
        },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.best_candidate?.id).toBe('high');
      expect(result.ranked_candidates[0].id).toBe('high');
      expect(result.ranked_candidates[1].id).toBe('medium');
      expect(result.ranked_candidates[2].id).toBe('low');
      expect(result.metadata.total_candidates).toBe(3);
      expect(result.metadata.valid_candidates).toBe(3);
    });

    it('should calculate final score using the correct formula', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers);

      const candidate: CreativeCandidate = {
        id: 'test',
        data: {},
        metadata: {
          novelty: 0.8,
          usefulness: 0.6,
          delight: 0.7,
          fit: 0.5,
          cost: 0.3,
          risk: 0.2,
        },
      };

      const result = optimizero.optimize([candidate]);
      const scored = result.ranked_candidates[0];

      // Formula: w_novelty * novelty + w_usefulness * usefulness + w_delight * delight
      //        + w_fit * fit - w_cost * cost - w_risk * risk
      const expectedScore =
        DEFAULT_WEIGHTS.w_novelty * 0.8 +
        DEFAULT_WEIGHTS.w_usefulness * 0.6 +
        DEFAULT_WEIGHTS.w_delight * 0.7 +
        DEFAULT_WEIGHTS.w_fit * 0.5 -
        DEFAULT_WEIGHTS.w_cost * 0.3 -
        DEFAULT_WEIGHTS.w_risk * 0.2;

      expect(scored.final_score).toBeCloseTo(expectedScore, 5);
    });
  });

  describe('Hard Fail Checks', () => {
    it('should reject candidates that fail hard checks', () => {
      const hardCheck: HardFailCheck = (c) => {
        if (c.metadata?.shouldFail) {
          return 'test failure';
        }
        return null;
      };

      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers, [hardCheck]);

      const candidates: CreativeCandidate[] = [
        { id: 'pass', data: {}, metadata: { shouldFail: false } },
        { id: 'fail', data: {}, metadata: { shouldFail: true } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.best_candidate?.id).toBe('pass');
      expect(result.ranked_candidates).toHaveLength(1);
      expect(result.rejected_candidates).toHaveLength(1);
      expect(result.rejected_candidates[0].id).toBe('fail');
      expect(result.rejected_candidates[0].valid).toBe(false);
      expect(result.rejected_candidates[0].rejection_reasons).toContain('test failure');
    });

    it('should track rejection reasons', () => {
      const checks: HardFailCheck[] = [
        (c) => (c.metadata?.checkA ? 'failed check A' : null),
        (c) => (c.metadata?.checkB ? 'failed check B' : null),
      ];

      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers, checks);

      const candidates: CreativeCandidate[] = [
        { id: 'multi-fail', data: {}, metadata: { checkA: true, checkB: true } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.rejected_candidates[0].rejection_reasons).toEqual([
        'failed check A',
        'failed check B',
      ]);
      expect(result.reasons_for_rejection['multi-fail']).toEqual([
        'failed check A',
        'failed check B',
      ]);
    });
  });

  describe('Weight Presets', () => {
    it('should favor novelty and delight with CHAOS_WEIGHTS', () => {
      const chaosOptimizero = new CreativeOptimizero(CHAOS_WEIGHTS, scorers);

      const candidates: CreativeCandidate[] = [
        {
          id: 'novel',
          data: {},
          metadata: { novelty: 1.0, usefulness: 0.3, delight: 1.0, fit: 0.3, cost: 0.2, risk: 0.2 },
        },
        {
          id: 'useful',
          data: {},
          metadata: { novelty: 0.3, usefulness: 1.0, delight: 0.3, fit: 1.0, cost: 0.2, risk: 0.2 },
        },
      ];

      const result = chaosOptimizero.optimize(candidates);

      // With chaos weights (novelty: 0.40, delight: 0.30), 'novel' should win
      expect(result.best_candidate?.id).toBe('novel');
    });

    it('should favor fit and usefulness with STABLE_WEIGHTS', () => {
      const stableOptimizero = new CreativeOptimizero(STABLE_WEIGHTS, scorers);

      const candidates: CreativeCandidate[] = [
        {
          id: 'novel',
          data: {},
          metadata: { novelty: 1.0, usefulness: 0.3, delight: 1.0, fit: 0.3, cost: 0.2, risk: 0.2 },
        },
        {
          id: 'stable',
          data: {},
          metadata: { novelty: 0.3, usefulness: 1.0, delight: 0.3, fit: 1.0, cost: 0.2, risk: 0.2 },
        },
      ];

      const result = stableOptimizero.optimize(candidates);

      // With stable weights (usefulness: 0.30, fit: 0.30), 'stable' should win
      expect(result.best_candidate?.id).toBe('stable');
    });
  });

  describe('Score Clamping', () => {
    it('should clamp scores to 0-1 range', () => {
      const extremeScorers = {
        novelty: (() => 2.0) as ScoreFunction, // Too high
        usefulness: (() => -0.5) as ScoreFunction, // Too low
        delight: (() => 0.5) as ScoreFunction,
        fit: (() => 0.5) as ScoreFunction,
        cost: (() => 0.2) as ScoreFunction,
        risk: (() => 0.1) as ScoreFunction,
      };

      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, extremeScorers);

      const result = optimizero.optimize([{ id: 'test', data: {} }]);
      const scored = result.ranked_candidates[0];

      expect(scored.novelty).toBe(1.0); // Clamped from 2.0
      expect(scored.usefulness).toBe(0.0); // Clamped from -0.5
    });
  });

  describe('Standard UI Hard Checks', () => {
    it('should detect infinite loops', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers, STANDARD_UI_HARD_CHECKS);

      const candidates: CreativeCandidate[] = [
        { id: 'loop', data: {}, metadata: { hasInfiniteLoop: true } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.rejected_candidates).toHaveLength(1);
      expect(result.rejected_candidates[0].rejection_reasons).toContain('infinite loops detected');
    });

    it('should detect type errors', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers, STANDARD_UI_HARD_CHECKS);

      const candidates: CreativeCandidate[] = [
        { id: 'type-error', data: {}, metadata: { hasTypeErrors: true } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.rejected_candidates).toHaveLength(1);
      expect(result.rejected_candidates[0].rejection_reasons).toContain('invalid TypeScript');
    });

    it('should detect performance regressions', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers, STANDARD_UI_HARD_CHECKS);

      const candidates: CreativeCandidate[] = [
        { id: 'slow', data: {}, metadata: { performanceDegradation: 0.8 } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.rejected_candidates).toHaveLength(1);
      expect(result.rejected_candidates[0].rejection_reasons).toContain(
        'severe performance regression'
      );
    });

    it('should detect privacy violations', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers, STANDARD_UI_HARD_CHECKS);

      const candidates: CreativeCandidate[] = [
        { id: 'privacy', data: {}, metadata: { breaksPrivacy: true } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.rejected_candidates).toHaveLength(1);
      expect(result.rejected_candidates[0].rejection_reasons).toContain('breaks privacy');
    });
  });

  describe('Utility Methods', () => {
    it('should get top N candidates', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers);

      const candidates: CreativeCandidate[] = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        data: {},
        metadata: { novelty: i / 10 },
      }));

      const result = optimizero.optimize(candidates);
      const top3 = optimizero.getTopN(result, 3);

      expect(top3).toHaveLength(3);
      expect(top3[0].id).toBe('item-9'); // Highest score
    });

    it('should detect when top scores are close', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers);

      const candidates: CreativeCandidate[] = [
        {
          id: 'a',
          data: {},
          metadata: { novelty: 0.9, usefulness: 0.9, delight: 0.9, fit: 0.9, cost: 0.1, risk: 0.1 },
        },
        {
          id: 'b',
          data: {},
          metadata: { novelty: 0.88, usefulness: 0.88, delight: 0.88, fit: 0.88, cost: 0.1, risk: 0.1 },
        },
      ];

      const result = optimizero.optimize(candidates);
      const areClose = optimizero.areTopScoresClose(result, 0.1);

      expect(areClose).toBe(true);
    });

    it('should update weights dynamically', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers);

      optimizero.updateWeights({ w_novelty: 1.0, w_usefulness: 0.0 });

      const candidates: CreativeCandidate[] = [
        { id: 'novel', data: {}, metadata: { novelty: 1.0, usefulness: 0.1 } },
        { id: 'useful', data: {}, metadata: { novelty: 0.1, usefulness: 1.0 } },
      ];

      const result = optimizero.optimize(candidates);

      // After weight update, novelty is heavily weighted
      expect(result.best_candidate?.id).toBe('novel');
    });
  });

  describe('Metadata Tracking', () => {
    it('should track optimization metadata', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers);

      const candidates: CreativeCandidate[] = [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.metadata.total_candidates).toBe(2);
      expect(result.metadata.valid_candidates).toBe(2);
      expect(result.metadata.invalid_candidates).toBe(0);
      expect(result.metadata.weights_used).toEqual(DEFAULT_WEIGHTS);
      expect(result.metadata.timestamp).toBeDefined();
    });
  });

  describe('createUIOptimizero Helper', () => {
    it('should create an optimizero with standard UI checks', () => {
      const optimizero = createUIOptimizero(scorers);

      const candidates: CreativeCandidate[] = [
        { id: 'valid', data: {} },
        { id: 'invalid', data: {}, metadata: { hasInfiniteLoop: true } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.ranked_candidates).toHaveLength(1);
      expect(result.rejected_candidates).toHaveLength(1);
    });

    it('should support additional custom checks', () => {
      const customCheck: HardFailCheck = (c) => {
        if (c.metadata?.customFail) return 'custom failure';
        return null;
      };

      const optimizero = createUIOptimizero(scorers, DEFAULT_WEIGHTS, [customCheck]);

      const candidates: CreativeCandidate[] = [
        { id: 'fail', data: {}, metadata: { customFail: true } },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.rejected_candidates[0].rejection_reasons).toContain('custom failure');
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle empty candidate list', () => {
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers);

      const result = optimizero.optimize([]);

      expect(result.best_candidate).toBeNull();
      expect(result.ranked_candidates).toHaveLength(0);
      expect(result.rejected_candidates).toHaveLength(0);
    });

    it('should handle all candidates being rejected', () => {
      const alwaysFailCheck: HardFailCheck = () => 'always fails';
      const optimizero = new CreativeOptimizero(DEFAULT_WEIGHTS, scorers, [alwaysFailCheck]);

      const candidates: CreativeCandidate[] = [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ];

      const result = optimizero.optimize(candidates);

      expect(result.best_candidate).toBeNull();
      expect(result.ranked_candidates).toHaveLength(0);
      expect(result.rejected_candidates).toHaveLength(2);
    });
  });
});
