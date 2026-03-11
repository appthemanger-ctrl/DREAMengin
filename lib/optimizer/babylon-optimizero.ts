/**
 * DREAMengin Babylon.js + Creative Optimizero Integration
 *
 * Purpose:
 * Apply Creative Optimizero algorithm to Babylon.js scene rendering and layout decisions.
 * Determines how UI elements should render and move around in 3D space.
 */

'use client';

import type {
  CreativeCandidate,
  ScoredCandidate,
  OptimizeroWeights,
  OptimizeroResult,
} from './creative-optimizero';
import { CreativeOptimizero, DEFAULT_WEIGHTS } from './creative-optimizero';

/**
 * Represents a 3D UI element candidate in Babylon.js space
 */
export interface BabylonUICandidate {
  id: string;
  type: 'mesh' | 'ui-panel' | 'widget' | 'particle-system' | 'effect';
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  color?: { r: number; g: number; b: number; a?: number };
  animation?: {
    type: 'orbit' | 'pulse' | 'rotate' | 'float' | 'bounce' | 'fade';
    duration: number;
    easing?: string;
  };
  material?: {
    type: 'standard' | 'pbr' | 'holographic' | 'glass' | 'glow';
    properties: Record<string, any>;
  };
  interaction?: {
    clickable: boolean;
    hoverable: boolean;
    draggable: boolean;
    callback?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Scoring functions for Babylon.js UI elements
 */
export class BabylonOptimizeroScorers {
  /**
   * Score novelty - how unique/interesting is this UI element?
   */
  static novelty(candidate: CreativeCandidate<BabylonUICandidate>): number {
    const element = candidate.data;
    let score = 0.5; // base score

    // Novel material types get bonus points
    if (element.material?.type === 'holographic' || element.material?.type === 'glass') {
      score += 0.2;
    }

    // Novel animation types get bonus
    if (element.animation?.type === 'orbit' || element.animation?.type === 'float') {
      score += 0.15;
    }

    // Unusual positioning (not on standard grid) gets bonus
    const isOnGrid = Math.abs(element.position.x % 1) < 0.01 && Math.abs(element.position.z % 1) < 0.01;
    if (!isOnGrid) {
      score += 0.1;
    }

    // Particle systems are visually novel
    if (element.type === 'particle-system') {
      score += 0.15;
    }

    return score;
  }

  /**
   * Score usefulness - does this element serve a clear purpose?
   */
  static usefulness(candidate: CreativeCandidate<BabylonUICandidate>): number {
    const element = candidate.data;
    let score = 0.3; // base score

    // Interactive elements are more useful
    if (element.interaction?.clickable) {
      score += 0.3;
    }
    if (element.interaction?.hoverable) {
      score += 0.1;
    }
    if (element.interaction?.draggable) {
      score += 0.2;
    }

    // UI panels and widgets are inherently useful
    if (element.type === 'ui-panel' || element.type === 'widget') {
      score += 0.2;
    }

    // Elements with callbacks are actionable
    if (element.interaction?.callback) {
      score += 0.1;
    }

    return score;
  }

  /**
   * Score delight - visual impact and aesthetic appeal
   */
  static delight(candidate: CreativeCandidate<BabylonUICandidate>): number {
    const element = candidate.data;
    let score = 0.4; // base score

    // Animated elements create delight
    if (element.animation) {
      score += 0.2;
      // Smooth animations are more delightful
      if (element.animation.easing) {
        score += 0.05;
      }
    }

    // Color vibrancy contributes to delight
    if (element.color) {
      const { r, g, b } = element.color;
      const vibrancy = Math.max(r, g, b) - Math.min(r, g, b);
      score += vibrancy * 0.15;
    }

    // Special materials add visual appeal
    if (element.material?.type === 'glow' || element.material?.type === 'holographic') {
      score += 0.15;
    }

    // Effects are inherently delightful
    if (element.type === 'effect' || element.type === 'particle-system') {
      score += 0.1;
    }

    return score;
  }

  /**
   * Score fit - how well does this element fit the context?
   */
  static fit(candidate: CreativeCandidate<BabylonUICandidate>): number {
    const element = candidate.data;
    let score = 0.5; // base score

    // Check if element is within reasonable bounds
    const { x, y, z } = element.position;
    const distance = Math.sqrt(x * x + y * y + z * z);
    if (distance > 100) {
      score -= 0.3; // Too far from origin
    } else if (distance > 50) {
      score -= 0.15;
    }

    // Check scale reasonableness
    if (element.scale) {
      const { x: sx, y: sy, z: sz } = element.scale;
      const avgScale = (sx + sy + sz) / 3;
      if (avgScale > 10 || avgScale < 0.1) {
        score -= 0.2; // Extreme scales don't fit well
      }
    }

    // Elements with appropriate type for context
    if (candidate.metadata?.contextType === 'game-hub' && element.type === 'mesh') {
      score += 0.2;
    }
    if (candidate.metadata?.contextType === 'ui-overlay' && element.type === 'ui-panel') {
      score += 0.2;
    }

    return score;
  }

  /**
   * Score cost - computational/performance cost
   */
  static cost(candidate: CreativeCandidate<BabylonUICandidate>): number {
    const element = candidate.data;
    let cost = 0.1; // base cost

    // Particle systems are expensive
    if (element.type === 'particle-system') {
      cost += 0.4;
    }

    // Complex materials are expensive
    if (element.material?.type === 'pbr' || element.material?.type === 'holographic') {
      cost += 0.2;
    }

    // Continuous animations have ongoing cost
    if (element.animation) {
      cost += 0.15;
    }

    // Transparent/glass materials require additional passes
    if (element.color?.a !== undefined && element.color.a < 1) {
      cost += 0.1;
    }
    if (element.material?.type === 'glass') {
      cost += 0.15;
    }

    return cost;
  }

  /**
   * Score risk - potential for breaking things
   */
  static risk(candidate: CreativeCandidate<BabylonUICandidate>): number {
    const element = candidate.data;
    let risk = 0.1; // base risk

    // Very large elements might obscure important UI
    if (element.scale) {
      const { x, y, z } = element.scale;
      const maxScale = Math.max(x, y, z);
      if (maxScale > 5) {
        risk += 0.3;
      }
    }

    // Elements too close to camera are risky
    if (Math.abs(element.position.z) < 2 && element.position.y < 3) {
      risk += 0.2;
    }

    // Too many particles could cause performance issues
    if (element.type === 'particle-system' && element.metadata?.particleCount > 1000) {
      risk += 0.3;
    }

    // Complex interactions might have edge cases
    if (element.interaction?.draggable) {
      risk += 0.1;
    }

    return risk;
  }
}

/**
 * Babylon-specific hard checks
 */
export const BABYLON_HARD_CHECKS = [
  // Check for NaN positions
  (candidate: CreativeCandidate<BabylonUICandidate>) => {
    const { x, y, z } = candidate.data.position;
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      return 'invalid position (NaN detected)';
    }
    return null;
  },

  // Check for extreme positions that would break rendering
  (candidate: CreativeCandidate<BabylonUICandidate>) => {
    const { x, y, z } = candidate.data.position;
    const distance = Math.sqrt(x * x + y * y + z * z);
    if (distance > 1000) {
      return 'position too far from origin (breaks rendering)';
    }
    return null;
  },

  // Check for invalid scales
  (candidate: CreativeCandidate<BabylonUICandidate>) => {
    if (candidate.data.scale) {
      const { x, y, z } = candidate.data.scale;
      if (x <= 0 || y <= 0 || z <= 0 || isNaN(x) || isNaN(y) || isNaN(z)) {
        return 'invalid scale (must be positive)';
      }
    }
    return null;
  },

  // Check for invalid colors
  (candidate: CreativeCandidate<BabylonUICandidate>) => {
    if (candidate.data.color) {
      const { r, g, b, a } = candidate.data.color;
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return 'invalid color values';
      }
      if (a !== undefined && (isNaN(a) || a < 0 || a > 1)) {
        return 'invalid alpha value';
      }
    }
    return null;
  },

  // Check for excessive particle counts
  (candidate: CreativeCandidate<BabylonUICandidate>) => {
    if (candidate.data.type === 'particle-system') {
      const count = candidate.data.metadata?.particleCount || 0;
      if (count > 10000) {
        return 'particle count too high (breaks performance)';
      }
    }
    return null;
  },
];

/**
 * Babylon.js UI Optimizero
 *
 * Specialization of Creative Optimizero for Babylon.js rendering decisions
 */
export class BabylonUIOptimizero extends CreativeOptimizero<BabylonUICandidate> {
  constructor(weights: OptimizeroWeights = DEFAULT_WEIGHTS) {
    super(
      weights,
      {
        novelty: BabylonOptimizeroScorers.novelty,
        usefulness: BabylonOptimizeroScorers.usefulness,
        delight: BabylonOptimizeroScorers.delight,
        fit: BabylonOptimizeroScorers.fit,
        cost: BabylonOptimizeroScorers.cost,
        risk: BabylonOptimizeroScorers.risk,
      },
      BABYLON_HARD_CHECKS
    );
  }

  /**
   * Optimize UI element placement in a Babylon scene
   */
  optimizeUILayout(
    candidates: BabylonUICandidate[],
    context?: Record<string, any>
  ): OptimizeroResult<BabylonUICandidate> {
    const wrappedCandidates: CreativeCandidate<BabylonUICandidate>[] = candidates.map(
      (data, index) => ({
        id: data.id || `candidate-${index}`,
        data,
        metadata: { ...data.metadata, ...context },
      })
    );

    return this.optimize(wrappedCandidates);
  }

  /**
   * Filter candidates to only those suitable for current performance budget
   */
  filterByPerformanceBudget(
    result: OptimizeroResult<BabylonUICandidate>,
    maxCost: number
  ): ScoredCandidate<BabylonUICandidate>[] {
    return result.ranked_candidates.filter(candidate => candidate.cost <= maxCost);
  }

  /**
   * Get candidates grouped by type
   */
  groupByType(
    result: OptimizeroResult<BabylonUICandidate>
  ): Record<string, ScoredCandidate<BabylonUICandidate>[]> {
    const groups: Record<string, ScoredCandidate<BabylonUICandidate>[]> = {};

    for (const candidate of result.ranked_candidates) {
      const type = candidate.data.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(candidate);
    }

    return groups;
  }
}

/**
 * Helper to create common UI element candidates
 */
export class BabylonUIGenerator {
  /**
   * Generate a game orb candidate (like in BabylonGameScene)
   */
  static createGameOrb(
    id: string,
    position: { x: number; y: number; z: number },
    color: { r: number; g: number; b: number },
    gameId: string
  ): BabylonUICandidate {
    return {
      id,
      type: 'mesh',
      position,
      scale: { x: 1.1, y: 1.1, z: 1.1 },
      color,
      material: {
        type: 'standard',
        properties: {
          emissiveColor: { r: color.r * 0.3, g: color.g * 0.3, b: color.b * 0.3 },
        },
      },
      animation: {
        type: 'float',
        duration: 2000,
        easing: 'easeInOutSine',
      },
      interaction: {
        clickable: true,
        hoverable: true,
        draggable: false,
        callback: `selectGame:${gameId}`,
      },
      metadata: {
        gameId,
        contextType: 'game-hub',
      },
    };
  }

  /**
   * Generate a UI panel candidate
   */
  static createUIPanel(
    id: string,
    position: { x: number; y: number; z: number },
    size: { width: number; height: number }
  ): BabylonUICandidate {
    return {
      id,
      type: 'ui-panel',
      position,
      scale: { x: size.width, y: size.height, z: 0.1 },
      color: { r: 0.1, g: 0.15, b: 0.25, a: 0.85 },
      material: {
        type: 'glass',
        properties: {
          transparency: 0.15,
          blur: 8,
        },
      },
      interaction: {
        clickable: false,
        hoverable: false,
        draggable: true,
      },
      metadata: {
        contextType: 'ui-overlay',
      },
    };
  }

  /**
   * Generate a holographic effect candidate
   */
  static createHolographicEffect(
    id: string,
    position: { x: number; y: number; z: number }
  ): BabylonUICandidate {
    return {
      id,
      type: 'effect',
      position,
      scale: { x: 2, y: 2, z: 2 },
      color: { r: 0.16, g: 0.54, b: 0.72, a: 0.7 },
      material: {
        type: 'holographic',
        properties: {
          fresnelPower: 2,
          scanlineSpeed: 0.5,
        },
      },
      animation: {
        type: 'rotate',
        duration: 4000,
        easing: 'linear',
      },
      interaction: {
        clickable: false,
        hoverable: false,
        draggable: false,
      },
      metadata: {
        contextType: 'decoration',
      },
    };
  }
}
