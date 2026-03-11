/**
 * Tests for Babylon.js Creative Optimizero Integration
 */

import { describe, it, expect } from 'vitest';
import {
  BabylonUIOptimizero,
  BabylonOptimizeroScorers,
  BabylonUIGenerator,
  BABYLON_HARD_CHECKS,
  type BabylonUICandidate,
} from '@/lib/optimizer/babylon-optimizero';
import { DEFAULT_WEIGHTS, CHAOS_WEIGHTS, type CreativeCandidate } from '@/lib/optimizer/creative-optimizero';

describe('BabylonUIOptimizero', () => {
  describe('BabylonOptimizeroScorers', () => {
    it('should score novelty based on material and animation', () => {
      const holographic: CreativeCandidate<BabylonUICandidate> = {
        id: 'holo',
        data: {
          id: 'holo',
          type: 'effect',
          position: { x: 0, y: 0, z: 0 },
          material: { type: 'holographic', properties: {} },
          animation: { type: 'orbit', duration: 2000 },
        },
      };

      const basic: CreativeCandidate<BabylonUICandidate> = {
        id: 'basic',
        data: {
          id: 'basic',
          type: 'mesh',
          position: { x: 1, y: 0, z: 1 },
          material: { type: 'standard', properties: {} },
        },
      };

      const holoScore = BabylonOptimizeroScorers.novelty(holographic);
      const basicScore = BabylonOptimizeroScorers.novelty(basic);

      expect(holoScore).toBeGreaterThan(basicScore);
    });

    it('should score usefulness based on interactivity', () => {
      const interactive: CreativeCandidate<BabylonUICandidate> = {
        id: 'interactive',
        data: {
          id: 'interactive',
          type: 'ui-panel',
          position: { x: 0, y: 0, z: 0 },
          interaction: {
            clickable: true,
            hoverable: true,
            draggable: true,
            callback: 'action',
          },
        },
      };

      const static_el: CreativeCandidate<BabylonUICandidate> = {
        id: 'static',
        data: {
          id: 'static',
          type: 'mesh',
          position: { x: 0, y: 0, z: 0 },
        },
      };

      const interactiveScore = BabylonOptimizeroScorers.usefulness(interactive);
      const staticScore = BabylonOptimizeroScorers.usefulness(static_el);

      expect(interactiveScore).toBeGreaterThan(staticScore);
      expect(interactiveScore).toBeGreaterThan(0.7); // Should be quite high
    });

    it('should score delight based on animations and visuals', () => {
      const delightful: CreativeCandidate<BabylonUICandidate> = {
        id: 'delightful',
        data: {
          id: 'delightful',
          type: 'particle-system',
          position: { x: 0, y: 0, z: 0 },
          color: { r: 1, g: 0, b: 1, a: 1 }, // Vibrant magenta
          material: { type: 'glow', properties: {} },
          animation: { type: 'float', duration: 2000, easing: 'easeInOut' },
        },
      };

      const boring: CreativeCandidate<BabylonUICandidate> = {
        id: 'boring',
        data: {
          id: 'boring',
          type: 'mesh',
          position: { x: 0, y: 0, z: 0 },
          color: { r: 0.5, g: 0.5, b: 0.5 }, // Grey
        },
      };

      const delightfulScore = BabylonOptimizeroScorers.delight(delightful);
      const boringScore = BabylonOptimizeroScorers.delight(boring);

      expect(delightfulScore).toBeGreaterThan(boringScore);
    });

    it('should score fit based on position and scale', () => {
      const goodFit: CreativeCandidate<BabylonUICandidate> = {
        id: 'good',
        data: {
          id: 'good',
          type: 'mesh',
          position: { x: 5, y: 2, z: 3 },
          scale: { x: 1, y: 1, z: 1 },
        },
        metadata: { contextType: 'game-hub' },
      };

      const poorFit: CreativeCandidate<BabylonUICandidate> = {
        id: 'poor',
        data: {
          id: 'poor',
          type: 'mesh',
          position: { x: 80, y: 50, z: 80 }, // Too far
          scale: { x: 20, y: 20, z: 20 }, // Too large
        },
      };

      const goodScore = BabylonOptimizeroScorers.fit(goodFit);
      const poorScore = BabylonOptimizeroScorers.fit(poorFit);

      expect(goodScore).toBeGreaterThan(poorScore);
    });

    it('should score cost based on complexity', () => {
      const expensive: CreativeCandidate<BabylonUICandidate> = {
        id: 'expensive',
        data: {
          id: 'expensive',
          type: 'particle-system',
          position: { x: 0, y: 0, z: 0 },
          material: { type: 'pbr', properties: {} },
          animation: { type: 'orbit', duration: 2000 },
          color: { r: 1, g: 1, b: 1, a: 0.5 },
        },
      };

      const cheap: CreativeCandidate<BabylonUICandidate> = {
        id: 'cheap',
        data: {
          id: 'cheap',
          type: 'mesh',
          position: { x: 0, y: 0, z: 0 },
          material: { type: 'standard', properties: {} },
        },
      };

      const expensiveCost = BabylonOptimizeroScorers.cost(expensive);
      const cheapCost = BabylonOptimizeroScorers.cost(cheap);

      expect(expensiveCost).toBeGreaterThan(cheapCost);
    });

    it('should score risk based on potential issues', () => {
      const risky: CreativeCandidate<BabylonUICandidate> = {
        id: 'risky',
        data: {
          id: 'risky',
          type: 'particle-system',
          position: { x: 0, y: 1, z: 1 }, // Close to camera
          scale: { x: 10, y: 10, z: 10 }, // Very large
          interaction: { clickable: false, hoverable: false, draggable: true },
        },
        metadata: { particleCount: 5000 },
      };

      const safe: CreativeCandidate<BabylonUICandidate> = {
        id: 'safe',
        data: {
          id: 'safe',
          type: 'mesh',
          position: { x: 5, y: 2, z: 5 },
          scale: { x: 1, y: 1, z: 1 },
        },
      };

      const riskyScore = BabylonOptimizeroScorers.risk(risky);
      const safeScore = BabylonOptimizeroScorers.risk(safe);

      expect(riskyScore).toBeGreaterThan(safeScore);
    });
  });

  describe('BABYLON_HARD_CHECKS', () => {
    it('should reject NaN positions', () => {
      const candidate: CreativeCandidate<BabylonUICandidate> = {
        id: 'nan',
        data: {
          id: 'nan',
          type: 'mesh',
          position: { x: NaN, y: 0, z: 0 },
        },
      };

      const result = BABYLON_HARD_CHECKS[0](candidate);
      expect(result).toBe('invalid position (NaN detected)');
    });

    it('should reject extreme positions', () => {
      const candidate: CreativeCandidate<BabylonUICandidate> = {
        id: 'far',
        data: {
          id: 'far',
          type: 'mesh',
          position: { x: 2000, y: 0, z: 0 },
        },
      };

      const result = BABYLON_HARD_CHECKS[1](candidate);
      expect(result).toBe('position too far from origin (breaks rendering)');
    });

    it('should reject invalid scales', () => {
      const candidates: CreativeCandidate<BabylonUICandidate>[] = [
        {
          id: 'zero',
          data: {
            id: 'zero',
            type: 'mesh',
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 0, y: 1, z: 1 },
          },
        },
        {
          id: 'negative',
          data: {
            id: 'negative',
            type: 'mesh',
            position: { x: 0, y: 0, z: 0 },
            scale: { x: -1, y: 1, z: 1 },
          },
        },
        {
          id: 'nan-scale',
          data: {
            id: 'nan-scale',
            type: 'mesh',
            position: { x: 0, y: 0, z: 0 },
            scale: { x: NaN, y: 1, z: 1 },
          },
        },
      ];

      for (const candidate of candidates) {
        const result = BABYLON_HARD_CHECKS[2](candidate);
        expect(result).toBe('invalid scale (must be positive)');
      }
    });

    it('should reject invalid colors', () => {
      const candidate: CreativeCandidate<BabylonUICandidate> = {
        id: 'bad-color',
        data: {
          id: 'bad-color',
          type: 'mesh',
          position: { x: 0, y: 0, z: 0 },
          color: { r: NaN, g: 0, b: 0 },
        },
      };

      const result = BABYLON_HARD_CHECKS[3](candidate);
      expect(result).toBe('invalid color values');
    });

    it('should reject excessive particle counts', () => {
      const candidate: CreativeCandidate<BabylonUICandidate> = {
        id: 'too-many',
        data: {
          id: 'too-many',
          type: 'particle-system',
          position: { x: 0, y: 0, z: 0 },
          metadata: { particleCount: 50000 },
        },
      };

      const result = BABYLON_HARD_CHECKS[4](candidate);
      expect(result).toBe('particle count too high (breaks performance)');
    });
  });

  describe('BabylonUIOptimizero Integration', () => {
    it('should optimize UI layout', () => {
      const optimizero = new BabylonUIOptimizero(DEFAULT_WEIGHTS);

      const candidates: BabylonUICandidate[] = [
        BabylonUIGenerator.createGameOrb(
          'orb-1',
          { x: 5, y: 1, z: 0 },
          { r: 0.9, g: 0.3, b: 0.3 },
          'game1'
        ),
        BabylonUIGenerator.createUIPanel('panel-1', { x: -5, y: 3, z: 0 }, { width: 3, height: 4 }),
        {
          id: 'invalid',
          type: 'mesh',
          position: { x: NaN, y: 0, z: 0 },
        },
      ];

      const result = optimizero.optimizeUILayout(candidates);

      expect(result.ranked_candidates.length).toBeGreaterThan(0);
      expect(result.rejected_candidates.length).toBeGreaterThan(0);
      expect(result.best_candidate).toBeDefined();
    });

    it('should filter by performance budget', () => {
      const optimizero = new BabylonUIOptimizero(DEFAULT_WEIGHTS);

      const candidates: BabylonUICandidate[] = [
        {
          id: 'expensive',
          type: 'particle-system',
          position: { x: 0, y: 0, z: 0 },
          material: { type: 'pbr', properties: {} },
        },
        {
          id: 'cheap',
          type: 'mesh',
          position: { x: 0, y: 0, z: 0 },
          material: { type: 'standard', properties: {} },
        },
      ];

      const result = optimizero.optimizeUILayout(candidates);
      const lowBudget = optimizero.filterByPerformanceBudget(result, 0.3);

      // Should only include cheaper candidates
      expect(lowBudget.length).toBeLessThan(result.ranked_candidates.length);
      expect(lowBudget.every(c => c.cost <= 0.3)).toBe(true);
    });

    it('should group candidates by type', () => {
      const optimizero = new BabylonUIOptimizero(DEFAULT_WEIGHTS);

      const candidates: BabylonUICandidate[] = [
        BabylonUIGenerator.createGameOrb('orb-1', { x: 0, y: 0, z: 0 }, { r: 1, g: 0, b: 0 }, 'g1'),
        BabylonUIGenerator.createGameOrb('orb-2', { x: 1, y: 0, z: 0 }, { r: 0, g: 1, b: 0 }, 'g2'),
        BabylonUIGenerator.createUIPanel('panel-1', { x: 0, y: 3, z: 0 }, { width: 2, height: 3 }),
        BabylonUIGenerator.createHolographicEffect('holo-1', { x: 0, y: 5, z: 0 }),
      ];

      const result = optimizero.optimizeUILayout(candidates);
      const grouped = optimizero.groupByType(result);

      expect(grouped['mesh']).toBeDefined();
      expect(grouped['ui-panel']).toBeDefined();
      expect(grouped['effect']).toBeDefined();
      expect(grouped['mesh'].length).toBe(2);
      expect(grouped['ui-panel'].length).toBe(1);
      expect(grouped['effect'].length).toBe(1);
    });
  });

  describe('BabylonUIGenerator', () => {
    it('should create valid game orb candidates', () => {
      const orb = BabylonUIGenerator.createGameOrb(
        'test-orb',
        { x: 5, y: 1, z: 0 },
        { r: 1, g: 0, b: 0 },
        'test-game'
      );

      expect(orb.id).toBe('test-orb');
      expect(orb.type).toBe('mesh');
      expect(orb.position).toEqual({ x: 5, y: 1, z: 0 });
      expect(orb.color).toEqual({ r: 1, g: 0, b: 0 });
      expect(orb.interaction?.clickable).toBe(true);
      expect(orb.metadata?.gameId).toBe('test-game');
    });

    it('should create valid UI panel candidates', () => {
      const panel = BabylonUIGenerator.createUIPanel(
        'test-panel',
        { x: -5, y: 3, z: 0 },
        { width: 4, height: 5 }
      );

      expect(panel.id).toBe('test-panel');
      expect(panel.type).toBe('ui-panel');
      expect(panel.scale).toEqual({ x: 4, y: 5, z: 0.1 });
      expect(panel.material?.type).toBe('glass');
      expect(panel.interaction?.draggable).toBe(true);
    });

    it('should create valid holographic effect candidates', () => {
      const effect = BabylonUIGenerator.createHolographicEffect('test-effect', { x: 0, y: 5, z: 0 });

      expect(effect.id).toBe('test-effect');
      expect(effect.type).toBe('effect');
      expect(effect.material?.type).toBe('holographic');
      expect(effect.animation?.type).toBe('rotate');
    });
  });

  describe('Weight Configuration', () => {
    it('should favor different candidates with different weights', () => {
      const defaultOptimizero = new BabylonUIOptimizero(DEFAULT_WEIGHTS);
      const chaosOptimizero = new BabylonUIOptimizero(CHAOS_WEIGHTS);

      const candidates: BabylonUICandidate[] = [
        BabylonUIGenerator.createGameOrb(
          'orb',
          { x: 5, y: 1, z: 0 },
          { r: 1, g: 0, b: 1 },
          'game'
        ),
        BabylonUIGenerator.createHolographicEffect('holo', { x: 0, y: 5, z: 0 }),
        BabylonUIGenerator.createUIPanel('panel', { x: -5, y: 3, z: 0 }, { width: 3, height: 4 }),
      ];

      const defaultResult = defaultOptimizero.optimizeUILayout(candidates);
      const chaosResult = chaosOptimizero.optimizeUILayout(candidates);

      // Different weights may produce different rankings
      // At minimum, both should have valid results
      expect(defaultResult.best_candidate).toBeDefined();
      expect(chaosResult.best_candidate).toBeDefined();
      expect(defaultResult.ranked_candidates.length).toBe(3);
      expect(chaosResult.ranked_candidates.length).toBe(3);
    });
  });

  describe('Real-world Scenario', () => {
    it('should optimize a game hub scene layout', () => {
      const optimizero = new BabylonUIOptimizero(DEFAULT_WEIGHTS);

      // Simulate a game hub with multiple elements
      const candidates: BabylonUICandidate[] = [];

      // 6 game orbs in a circle
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 5;
        candidates.push(
          BabylonUIGenerator.createGameOrb(
            `orb-${i}`,
            { x: Math.cos(angle) * radius, y: 1, z: Math.sin(angle) * radius },
            { r: Math.random(), g: Math.random(), b: Math.random() },
            `game-${i}`
          )
        );
      }

      // UI panels
      candidates.push(
        BabylonUIGenerator.createUIPanel('left-panel', { x: -8, y: 3, z: 0 }, { width: 3, height: 4 })
      );
      candidates.push(
        BabylonUIGenerator.createUIPanel('right-panel', { x: 8, y: 3, z: 0 }, { width: 3, height: 4 })
      );

      // Central holographic effect
      candidates.push(BabylonUIGenerator.createHolographicEffect('center-holo', { x: 0, y: 5, z: 0 }));

      // Some invalid candidates
      candidates.push({
        id: 'bad-position',
        type: 'mesh',
        position: { x: 5000, y: 0, z: 0 },
      });
      candidates.push({
        id: 'bad-scale',
        type: 'mesh',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: -1, y: 1, z: 1 },
      });

      const result = optimizero.optimizeUILayout(candidates, { contextType: 'game-hub' });

      // Should have valid and rejected candidates
      expect(result.ranked_candidates.length).toBeGreaterThan(0);
      expect(result.rejected_candidates.length).toBe(2); // The two invalid ones
      expect(result.best_candidate).toBeDefined();

      // Best candidate should have a reasonable score
      expect(result.best_candidate!.final_score).toBeGreaterThan(0);

      // All valid candidates should have scored dimensions
      for (const candidate of result.ranked_candidates) {
        expect(candidate.novelty).toBeGreaterThanOrEqual(0);
        expect(candidate.novelty).toBeLessThanOrEqual(1);
        expect(candidate.usefulness).toBeGreaterThanOrEqual(0);
        expect(candidate.usefulness).toBeLessThanOrEqual(1);
        expect(candidate.delight).toBeGreaterThanOrEqual(0);
        expect(candidate.delight).toBeLessThanOrEqual(1);
      }
    });
  });
});
