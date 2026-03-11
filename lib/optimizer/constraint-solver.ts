/**
 * DREAMengin Constraint Solver
 *
 * Core optimization pattern:
 * - maximize usefulness
 * - minimize cost
 * - subject to constraints
 */

import type {
  Constraint,
  ConstraintSolverOptions,
  OptimizationItem,
  RankedItem,
} from './types';

export class ConstraintSolver {
  private options: ConstraintSolverOptions;

  constructor(options: Partial<ConstraintSolverOptions> = {}) {
    this.options = {
      maxIterations: options.maxIterations ?? 1000,
      convergenceThreshold: options.convergenceThreshold ?? 0.001,
      timeoutMs: options.timeoutMs ?? 100,
    };
  }

  /**
   * Solve optimization problem with constraints
   * Returns items ranked by their optimization score
   */
  solve<T = any>(
    items: OptimizationItem[],
    constraints: Constraint[],
    metadata?: Record<string, any>
  ): RankedItem<OptimizationItem>[] {
    const startTime = Date.now();

    // Calculate weighted scores for each item
    const scoredItems = items.map(item => {
      const score = this.calculateScore(item, constraints);
      return {
        item,
        score,
        rank: 0, // Will be set after sorting
        metadata: { ...item.metadata, ...metadata },
      };
    });

    // Sort by score (descending)
    scoredItems.sort((a, b) => b.score - a.score);

    // Assign ranks
    scoredItems.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > this.options.timeoutMs) {
      console.warn(
        `Optimization exceeded timeout (${elapsed}ms > ${this.options.timeoutMs}ms)`
      );
    }

    return scoredItems;
  }

  /**
   * Calculate optimization score for an item based on constraints
   */
  private calculateScore(
    item: OptimizationItem,
    constraints: Constraint[]
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const constraint of constraints) {
      const constraintValue = this.evaluateConstraint(item, constraint);
      const weight = this.getWeightMultiplier(constraint.priority) * constraint.weight;

      totalScore += constraintValue * weight;
      totalWeight += weight;
    }

    // Normalize to 0-1 range
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Evaluate a single constraint for an item
   */
  private evaluateConstraint(
    item: OptimizationItem,
    constraint: Constraint
  ): number {
    // Check if constraint value is pre-computed
    if (constraint.value !== undefined) {
      return constraint.value;
    }

    // Extract constraint value from item metadata
    const metadata = item.metadata || {};
    const value = metadata[constraint.name];

    if (typeof value === 'number') {
      // Normalize to 0-1 range if needed
      return Math.max(0, Math.min(1, value));
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    // Default to neutral score
    return 0.5;
  }

  /**
   * Get weight multiplier based on priority
   */
  private getWeightMultiplier(priority: string): number {
    switch (priority) {
      case 'critical':
        return 2.0;
      case 'high':
        return 1.5;
      case 'medium':
        return 1.0;
      case 'low':
        return 0.5;
      default:
        return 1.0;
    }
  }

  /**
   * Check if all constraints are satisfied
   */
  checkConstraints(
    items: OptimizationItem[],
    constraints: Constraint[]
  ): boolean {
    for (const constraint of constraints) {
      if (constraint.priority === 'critical') {
        const allSatisfied = items.every(item => {
          const score = this.evaluateConstraint(item, constraint);
          return score >= 0.5; // Critical constraints must be at least 50% satisfied
        });

        if (!allSatisfied) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Optimize with multiple objectives
   */
  multiObjectiveOptimize<T = any>(
    items: OptimizationItem[],
    objectives: Array<{
      name: string;
      constraints: Constraint[];
      weight: number;
    }>
  ): RankedItem<OptimizationItem>[] {
    // Calculate scores for each objective
    const objectiveScores = objectives.map(objective => {
      const rankedItems = this.solve(items, objective.constraints);
      return {
        name: objective.name,
        weight: objective.weight,
        scores: new Map(rankedItems.map(ri => [ri.item.id, ri.score])),
      };
    });

    // Combine scores across objectives
    const combinedScores = items.map(item => {
      let totalScore = 0;
      let totalWeight = 0;

      for (const objective of objectiveScores) {
        const score = objective.scores.get(item.id) ?? 0;
        totalScore += score * objective.weight;
        totalWeight += objective.weight;
      }

      return {
        item,
        score: totalWeight > 0 ? totalScore / totalWeight : 0,
        rank: 0,
        metadata: item.metadata,
      };
    });

    // Sort and assign ranks
    combinedScores.sort((a, b) => b.score - a.score);
    combinedScores.forEach((item, index) => {
      item.rank = index + 1;
    });

    return combinedScores;
  }
}
