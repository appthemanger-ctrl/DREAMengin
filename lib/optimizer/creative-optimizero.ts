/**
 * DREAMengin Creative Optimizero Algorithm
 *
 * Purpose:
 * Generate interesting options first, then keep only the ones that do not break the system.
 *
 * Core Philosophy:
 * - Explore wildly
 * - Reject breakage
 * - Rank by interestingness + usefulness
 *
 * Formula:
 * final_score = (w_novelty * novelty) + (w_usefulness * usefulness) + (w_delight * delight)
 *             + (w_fit * fit) - (w_cost * cost) - (w_risk * risk)
 */

export interface CreativeCandidate<T = any> {
  id: string;
  data: T;
  metadata?: Record<string, any>;
}

export interface ScoredCandidate<T = any> extends CreativeCandidate<T> {
  novelty: number;
  usefulness: number;
  delight: number;
  fit: number;
  cost: number;
  risk: number;
  final_score: number;
  valid: boolean;
  rejection_reasons?: string[];
}

export interface OptimizeroWeights {
  w_novelty: number;
  w_usefulness: number;
  w_delight: number;
  w_fit: number;
  w_cost: number;
  w_risk: number;
}

export interface OptimizeroResult<T = any> {
  best_candidate: ScoredCandidate<T> | null;
  ranked_candidates: ScoredCandidate<T>[];
  rejected_candidates: ScoredCandidate<T>[];
  reasons_for_rejection: Record<string, string[]>;
  metadata: {
    total_candidates: number;
    valid_candidates: number;
    invalid_candidates: number;
    weights_used: OptimizeroWeights;
    timestamp: string;
  };
}

export type HardFailCheck<T = any> = (candidate: CreativeCandidate<T>) => string | null;
export type ScoreFunction<T = any> = (candidate: CreativeCandidate<T>) => number;

/**
 * Recommended weights for balanced exploration
 */
export const DEFAULT_WEIGHTS: OptimizeroWeights = {
  w_novelty: 0.30,
  w_usefulness: 0.25,
  w_delight: 0.20,
  w_fit: 0.15,
  w_cost: 0.05,
  w_risk: 0.05,
};

/**
 * Weights for more chaos - increased novelty and delight
 */
export const CHAOS_WEIGHTS: OptimizeroWeights = {
  w_novelty: 0.40,
  w_usefulness: 0.15,
  w_delight: 0.30,
  w_fit: 0.10,
  w_cost: 0.03,
  w_risk: 0.02,
};

/**
 * Weights for more stability - increased fit and risk consideration
 */
export const STABLE_WEIGHTS: OptimizeroWeights = {
  w_novelty: 0.15,
  w_usefulness: 0.30,
  w_delight: 0.10,
  w_fit: 0.30,
  w_cost: 0.05,
  w_risk: 0.10,
};

/**
 * Creative Optimizero Algorithm
 *
 * Generates interesting options first, then filters out anything that breaks the system.
 */
export class CreativeOptimizero<T = any> {
  private weights: OptimizeroWeights;
  private hardChecks: HardFailCheck<T>[];
  private scorers: {
    novelty: ScoreFunction<T>;
    usefulness: ScoreFunction<T>;
    delight: ScoreFunction<T>;
    fit: ScoreFunction<T>;
    cost: ScoreFunction<T>;
    risk: ScoreFunction<T>;
  };

  constructor(
    weights: OptimizeroWeights = DEFAULT_WEIGHTS,
    scorers: {
      novelty: ScoreFunction<T>;
      usefulness: ScoreFunction<T>;
      delight: ScoreFunction<T>;
      fit: ScoreFunction<T>;
      cost: ScoreFunction<T>;
      risk: ScoreFunction<T>;
    },
    hardChecks: HardFailCheck<T>[] = []
  ) {
    this.weights = weights;
    this.scorers = scorers;
    this.hardChecks = hardChecks;
  }

  /**
   * Add a hard fail check to the algorithm
   */
  addHardCheck(check: HardFailCheck<T>): void {
    this.hardChecks.push(check);
  }

  /**
   * Update weights (useful for runtime tuning)
   */
  updateWeights(weights: Partial<OptimizeroWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Run the Creative Optimizero algorithm
   */
  optimize(candidates: CreativeCandidate<T>[]): OptimizeroResult<T> {
    const startTime = Date.now();
    const scored: ScoredCandidate<T>[] = [];
    const rejected: ScoredCandidate<T>[] = [];
    const rejectionReasons: Record<string, string[]> = {};

    // Step 1-4: Score each candidate
    for (const candidate of candidates) {
      const scoredCandidate: ScoredCandidate<T> = {
        ...candidate,
        novelty: this.clampScore(this.scorers.novelty(candidate)),
        usefulness: this.clampScore(this.scorers.usefulness(candidate)),
        delight: this.clampScore(this.scorers.delight(candidate)),
        fit: this.clampScore(this.scorers.fit(candidate)),
        cost: this.clampScore(this.scorers.cost(candidate)),
        risk: this.clampScore(this.scorers.risk(candidate)),
        final_score: 0,
        valid: true,
        rejection_reasons: [],
      };

      // Step 5: Apply hard safety checks
      const failures = this.runHardChecks(candidate);
      if (failures.length > 0) {
        scoredCandidate.valid = false;
        scoredCandidate.rejection_reasons = failures;
        rejected.push(scoredCandidate);
        rejectionReasons[candidate.id] = failures;
        continue;
      }

      // Calculate final score using the formula
      scoredCandidate.final_score =
        this.weights.w_novelty * scoredCandidate.novelty +
        this.weights.w_usefulness * scoredCandidate.usefulness +
        this.weights.w_delight * scoredCandidate.delight +
        this.weights.w_fit * scoredCandidate.fit -
        this.weights.w_cost * scoredCandidate.cost -
        this.weights.w_risk * scoredCandidate.risk;

      scored.push(scoredCandidate);
    }

    // Step 7: Rank remaining options by final_score (descending)
    scored.sort((a, b) => b.final_score - a.final_score);

    // Step 8: Return best option + top alternatives
    const best = scored.length > 0 ? scored[0] : null;

    return {
      best_candidate: best,
      ranked_candidates: scored,
      rejected_candidates: rejected,
      reasons_for_rejection: rejectionReasons,
      metadata: {
        total_candidates: candidates.length,
        valid_candidates: scored.length,
        invalid_candidates: rejected.length,
        weights_used: this.weights,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Run all hard safety checks on a candidate
   * Returns array of failure reasons (empty if all checks pass)
   */
  private runHardChecks(candidate: CreativeCandidate<T>): string[] {
    const failures: string[] = [];
    for (const check of this.hardChecks) {
      const result = check(candidate);
      if (result) {
        failures.push(result);
      }
    }
    return failures;
  }

  /**
   * Clamp score to 0-1 range
   */
  private clampScore(score: number): number {
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get top N candidates (useful for "top 3 for review" rule)
   */
  getTopN(result: OptimizeroResult<T>, n: number): ScoredCandidate<T>[] {
    return result.ranked_candidates.slice(0, n);
  }

  /**
   * Check if top scores are too close (for "keep top 3 for review" rule)
   */
  areTopScoresClose(result: OptimizeroResult<T>, threshold: number = 0.05): boolean {
    if (result.ranked_candidates.length < 2) return false;
    const top = result.ranked_candidates[0];
    const second = result.ranked_candidates[1];
    return Math.abs(top.final_score - second.final_score) < threshold;
  }
}

/**
 * Standard hard fail checks for UI rendering
 */
export const STANDARD_UI_HARD_CHECKS: HardFailCheck[] = [
  // Check for infinite loops
  (candidate) => {
    if (candidate.metadata?.hasInfiniteLoop) {
      return 'infinite loops detected';
    }
    return null;
  },

  // Check for invalid TypeScript
  (candidate) => {
    if (candidate.metadata?.hasTypeErrors) {
      return 'invalid TypeScript';
    }
    return null;
  },

  // Check for invalid imports
  (candidate) => {
    if (candidate.metadata?.hasInvalidImports) {
      return 'invalid imports';
    }
    return null;
  },

  // Check for severe performance regression
  (candidate) => {
    if (candidate.metadata?.performanceDegradation && candidate.metadata.performanceDegradation > 0.5) {
      return 'severe performance regression';
    }
    return null;
  },

  // Check for privacy violations
  (candidate) => {
    if (candidate.metadata?.breaksPrivacy) {
      return 'breaks privacy';
    }
    return null;
  },

  // Check for navigation continuity
  (candidate) => {
    if (candidate.metadata?.breaksNavigation) {
      return 'breaks navigation continuity';
    }
    return null;
  },

  // Check for fake actions
  (candidate) => {
    if (candidate.metadata?.isFakeAction) {
      return 'fake action';
    }
    return null;
  },
];

/**
 * Helper function to create a basic optimizero with default UI checks
 */
export function createUIOptimizero<T = any>(
  scorers: {
    novelty: ScoreFunction<T>;
    usefulness: ScoreFunction<T>;
    delight: ScoreFunction<T>;
    fit: ScoreFunction<T>;
    cost: ScoreFunction<T>;
    risk: ScoreFunction<T>;
  },
  weights: OptimizeroWeights = DEFAULT_WEIGHTS,
  additionalChecks: HardFailCheck<T>[] = []
): CreativeOptimizero<T> {
  return new CreativeOptimizero<T>(
    weights,
    scorers,
    [...STANDARD_UI_HARD_CHECKS, ...additionalChecks]
  );
}
